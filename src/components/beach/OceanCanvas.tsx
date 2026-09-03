import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { createCanvasDragLayer } from './canvasDragLayer'
import { createCrabController } from './crabController'
import { drawBeachDecor } from './decorRenderer'
import {
  createSceneTexture,
  drawBirds,
  drawEnvironment,
  type ScenePatterns,
} from './environmentRenderer'

const INTERFACE_SELECTOR =
  'button, a, input, .events-section, .side-panel, .site-header, .credits-card'

function isInterfaceElement(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(INTERFACE_SELECTOR))
}
export function OceanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let frameId = 0
    let width = 0
    let height = 0
    let pixelRatio = 1
    let activePointerId: number | null = null
    let patterns: ScenePatterns = { sand: null, water: null }

    const dragLayer = createCanvasDragLayer()
    const crabController = createCrabController()

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      patterns = {
        sand: createSceneTexture(context, 'sand'),
        water: createSceneTexture(context, 'water'),
      }
    }

    const draw = (time: number) => {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)
      dragLayer.beginFrame()

      drawEnvironment(context, width, height, time, patterns)
      drawBeachDecor(context, width, height, dragLayer)
      crabController.draw(
        context,
        width,
        height,
        time,
        Boolean(prefersReducedMotion),
        dragLayer,
      )
      drawBirds(context, width, height, time)

      if (!prefersReducedMotion) {
        frameId = window.requestAnimationFrame(draw)
      }
    }

    const redrawStaticScene = () => {
      if (prefersReducedMotion) draw(0)
    }

    const handleResize = () => {
      resize()
      redrawStaticScene()
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (isInterfaceElement(event.target)) return
      const draggedId = dragLayer.start(event.clientX, event.clientY)
      if (!draggedId) return

      activePointerId = event.pointerId
      if (!draggedId.startsWith('crab-')) {
        crabController.pauseForDecorDrag()
      }
      document.body.classList.add('dragging-beach-object')
      document.body.classList.remove('beach-object-hover')
      event.preventDefault()
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId === event.pointerId) {
        dragLayer.move(event.clientX, event.clientY, width, height)
        redrawStaticScene()
        return
      }

      const hovering =
        !isInterfaceElement(event.target) &&
        dragLayer.isHovering(event.clientX, event.clientY)
      document.body.classList.toggle('beach-object-hover', hovering)
    }

    const finishDrag = (event?: PointerEvent) => {
      if (event && activePointerId !== event.pointerId) return
      const draggedId = dragLayer.end()
      if (!draggedId) return

      activePointerId = null
      if (!draggedId.startsWith('crab-')) {
        crabController.resumeAfterDecorDrag(performance.now())
      }
      document.body.classList.remove('dragging-beach-object')
      redrawStaticScene()
    }

    const handleWindowBlur = () => finishDrag()

    resize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', finishDrag)
    window.addEventListener('pointercancel', finishDrag)
    window.addEventListener('blur', handleWindowBlur)

    if (prefersReducedMotion) draw(0)
    else frameId = window.requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', finishDrag)
      window.removeEventListener('pointercancel', finishDrag)
      window.removeEventListener('blur', handleWindowBlur)
      document.body.classList.remove('beach-object-hover', 'dragging-beach-object')
      window.cancelAnimationFrame(frameId)
    }
  }, [prefersReducedMotion])

  return <canvas className="ocean-canvas" ref={canvasRef} aria-hidden="true" />
}
