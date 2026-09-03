import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { DayWaveTransition } from '../../types'

export function DayWave({
  phase,
  onPhaseComplete,
}: {
  phase: DayWaveTransition['phase']
  onPhaseComplete: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    const context = canvas?.getContext('2d')
    if (!canvas || !container || !context) return

    let width = 1
    let height = 1
    let pixelRatio = 1
    let frameId = 0

    const resize = () => {
      const bounds = container.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    const draw = (time: number, scheduleNextFrame = true) => {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)

      const frontX = (y: number, offset = 0) =>
        width -
        54 +
        offset +
        Math.sin(y * 0.018 + time * 0.0042) * 18 +
        Math.sin(y * 0.047 - time * 0.0028) * 7 +
        Math.sin(y * 0.008 + 1.7) * 9

      const waterShape = new Path2D()
      waterShape.moveTo(0, 0)
      waterShape.lineTo(frontX(0), 0)
      for (let y = 0; y <= height + 5; y += 4) waterShape.lineTo(frontX(y), y)
      waterShape.lineTo(0, height)
      waterShape.closePath()

      context.save()
      context.clip(waterShape)
      const water = context.createLinearGradient(0, 0, width, 0)
      water.addColorStop(0, '#064f75')
      water.addColorStop(0.44, '#087f9f')
      water.addColorStop(0.78, '#10aeb7')
      water.addColorStop(1, '#0c819d')
      context.fillStyle = water
      context.fillRect(0, 0, width, height)

      const glowY = 140
      const glow = context.createRadialGradient(
        width * 0.64,
        glowY,
        0,
        width * 0.64,
        glowY,
        width * 0.55,
      )
      glow.addColorStop(0, 'rgba(132, 235, 222, 0.38)')
      glow.addColorStop(1, 'rgba(132, 235, 222, 0)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)

      const currentOffset = prefersReducedMotion ? 0 : (time * 0.022) % 68
      for (let row = -1; row < Math.ceil(height / 68) + 1; row += 1) {
        const baseY = row * 68 + currentOffset
        context.strokeStyle = row % 2 ? 'rgba(206,255,246,0.14)' : 'rgba(229,255,249,0.2)'
        context.lineWidth = row % 2 ? 2 : 3
        context.beginPath()
        for (let x = -20; x <= width + 20; x += 9) {
          const y = baseY + Math.sin(x * 0.021 + row * 1.4 + time * 0.0018) * 5
          if (x === -20) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        context.stroke()
      }

      for (let index = 0; index < 22; index += 1) {
        const x = ((index * 137 + time * 0.018) % (width + 100)) - 50
        const y = ((index * 83) % Math.max(1, height - 20)) + 10
        context.strokeStyle = `rgba(222,255,248,${0.08 + (index % 3) * 0.025})`
        context.lineWidth = 1.2
        context.beginPath()
        context.ellipse(x, y, 16 + (index % 4) * 7, 3, -0.08, 0, Math.PI * 2)
        context.stroke()
      }
      context.restore()

      const traceFront = (offset: number) => {
        context.beginPath()
        context.moveTo(frontX(0, offset), 0)
        for (let y = 0; y <= height + 5; y += 4) context.lineTo(frontX(y, offset), y)
      }

      traceFront(-25)
      context.strokeStyle = 'rgba(160, 242, 231, 0.34)'
      context.lineWidth = 8
      context.setLineDash([18, 30, 8, 23])
      context.lineDashOffset = prefersReducedMotion ? 0 : -time * 0.08
      context.lineCap = 'round'
      context.stroke()

      traceFront(-7)
      context.strokeStyle = 'rgba(223, 255, 248, 0.48)'
      context.lineWidth = 18
      context.setLineDash([])
      context.stroke()

      traceFront(0)
      context.strokeStyle = '#f5fff9'
      context.lineWidth = 7
      context.setLineDash([31, 9, 57, 14])
      context.lineDashOffset = prefersReducedMotion ? 0 : time * 0.11
      context.stroke()
      context.setLineDash([])

      const bubbleShift = prefersReducedMotion ? 0 : time * 0.025
      for (let index = 0; index < Math.ceil(height / 43); index += 1) {
        const y = (index * 43 + bubbleShift) % (height + 30) - 15
        const x = frontX(y, -13 - (index % 4) * 6)
        const radius = 1.8 + (index % 3) * 1.4
        context.fillStyle = index % 2 ? 'rgba(247,255,251,0.78)' : 'rgba(213,255,246,0.64)'
        context.beginPath()
        context.arc(x, y, radius, 0, Math.PI * 2)
        context.fill()
      }

      if (!prefersReducedMotion && scheduleNextFrame) {
        frameId = window.requestAnimationFrame(draw)
      }
    }

    const observer = new ResizeObserver(() => {
      resize()
      // Resizing clears a canvas synchronously. Repaint in the same task so the
      // cards underneath can never flash through before the next animation frame.
      draw(performance.now(), false)
    })
    resize()
    observer.observe(container)
    if (prefersReducedMotion) draw(0)
    else frameId = window.requestAnimationFrame(draw)

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(frameId)
    }
  }, [prefersReducedMotion])

  return (
    <motion.div
      className="day-wave"
      initial={{ x: 'calc(-100% - 120px)', opacity: 1 }}
      animate={phase === 'cover' ? { x: '0px', opacity: 1 } : { x: '0px', opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={
        phase === 'cover'
          ? { duration: 0.72, ease: [0.65, 0, 0.26, 1] }
          : { duration: 0.58, delay: 0.28, ease: 'easeOut' }
      }
      onAnimationComplete={onPhaseComplete}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} />
    </motion.div>
  )
}

