import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import {
  drawBeachBall,
  drawBeachChair,
  drawCrab,
  drawDrink,
  drawPebbles,
  drawSandcastle,
  drawSeagull,
  drawTowel,
  drawUmbrella,
} from './drawing'
import {
  findCrabPath,
  type CrabPoint,
} from './pathfinding'
import {
  BEACH_BALLS,
  BEACH_SETS,
  BIRDS,
  CRAB_DESTINATIONS,
  CRAB_OBSTACLES,
  CRAB_SEEDS,
  DRINKS,
  PEBBLE_GROUPS,
  SANDCASTLES,
  TOWELS,
  type CrabSeed,
} from './sceneLayout'
import { createCanvasDragLayer } from './canvasDragLayer'

export function OceanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    let frameId = 0
    let width = 0
    let height = 0
    let pixelRatio = 1
    let sandPattern: CanvasPattern | null = null
    let waterPattern: CanvasPattern | null = null
    let lastCrabTime = 0

    type CrabAgent = CrabSeed & {
      path: CrabPoint[]
      waypoint: number
    }

    const crabAgents: CrabAgent[] = CRAB_SEEDS.map((seed) => ({
      ...seed,
      path: [],
      waypoint: 0,
    }))
    const dragLayer = createCanvasDragLayer()

    const makeTexture = (kind: 'sand' | 'water') => {
      const texture = document.createElement('canvas')
      texture.width = 220
      texture.height = 220
      const textureContext = texture.getContext('2d')!
      textureContext.clearRect(0, 0, 220, 220)
      let seed = kind === 'sand' ? 1847 : 9211
      const random = () => {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
      }
      const count = kind === 'sand' ? 1100 : 360
      for (let index = 0; index < count; index += 1) {
        const x = random() * 220
        const y = random() * 220
        const size = kind === 'sand' ? random() * 1.4 + 0.25 : random() * 10 + 2
        textureContext.fillStyle =
          kind === 'sand'
            ? 'rgba(' + (115 + random() * 55) + ', ' + (82 + random() * 45) + ', ' + (42 + random() * 30) + ', ' + (0.08 + random() * 0.13) + ')'
            : 'rgba(221, 255, 247, ' + (0.025 + random() * 0.055) + ')'
        textureContext.beginPath()
        textureContext.ellipse(x, y, size, kind === 'sand' ? size * 0.5 : 0.75, random(), 0, Math.PI * 2)
        textureContext.fill()
      }
      return context.createPattern(texture, 'repeat')
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = String(width) + 'px'
      canvas.style.height = String(height) + 'px'
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      sandPattern = makeTexture('sand')
      waterPattern = makeTexture('water')
    }

    const coastX = (y: number, time: number) => {
      const horizon = height * 0.345
      const progress = Math.max(0, (y - horizon) / Math.max(1, height - horizon))
      const sweep = width * (0.448 - progress * 0.052 + Math.sin(progress * Math.PI) * 0.012)
      return (
        sweep +
        Math.sin(y * 0.027 + time * 0.00055) * 13 +
        Math.sin(y * 0.011 - time * 0.00032) * 17 +
        Math.sin(y * 0.071 + 1.4) * 5
      )
    }

    const uprightAngle = (angle: number) => {
      let normalized = Math.atan2(Math.sin(angle), Math.cos(angle))
      if (normalized > Math.PI / 2) normalized -= Math.PI
      if (normalized < -Math.PI / 2) normalized += Math.PI
      return Math.max(-1.38, Math.min(1.38, normalized))
    }

    const shorelinePath = (time: number, offset = 0) => {
      const horizon = height * 0.345
      const path = new Path2D()
      path.moveTo(0, horizon)
      path.lineTo(coastX(horizon, time) + offset, horizon)
      for (let y = horizon; y <= height + 12; y += 7) path.lineTo(coastX(y, time) + offset, y)
      path.lineTo(0, height + 12)
      path.closePath()
      return path
    }

    const draw = (time: number) => {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)
      dragLayer.beginFrame()
      const horizon = height * 0.345

      const sky = context.createLinearGradient(0, 0, 0, horizon)
      sky.addColorStop(0, '#5fc6e8')
      sky.addColorStop(0.58, '#b9e7e3')
      sky.addColorStop(1, '#f4dfb5')
      context.fillStyle = sky
      context.fillRect(0, 0, width, horizon + 3)

      const sunX = width * 0.23
      const sunY = Math.min(178, height * 0.18)
      const glow = context.createRadialGradient(sunX, sunY, 8, sunX, sunY, 105)
      glow.addColorStop(0, 'rgba(255, 250, 210, 0.98)')
      glow.addColorStop(0.22, 'rgba(255, 222, 120, 0.92)')
      glow.addColorStop(1, 'rgba(255, 229, 152, 0)')
      context.fillStyle = glow
      context.fillRect(sunX - 110, sunY - 110, 220, 220)
      context.fillStyle = '#ffe39a'
      context.beginPath()
      context.arc(sunX, sunY, 32, 0, Math.PI * 2)
      context.fill()

      const sand = context.createLinearGradient(width * 0.4, horizon, width, height)
      sand.addColorStop(0, '#e8c17d')
      sand.addColorStop(0.28, '#f2d493')
      sand.addColorStop(1, '#dcb06c')
      context.fillStyle = sand
      context.fillRect(0, horizon, width, height - horizon)
      if (sandPattern) {
        context.globalAlpha = 0.85
        context.fillStyle = sandPattern
        context.fillRect(0, horizon, width, height - horizon)
        context.globalAlpha = 1
      }

      context.save()
      context.clip(shorelinePath(time))
      const water = context.createLinearGradient(0, horizon, width * 0.45, height)
      water.addColorStop(0, '#2dbcc4')
      water.addColorStop(0.42, '#0c91aa')
      water.addColorStop(1, '#075c78')
      context.fillStyle = water
      context.fillRect(0, horizon, width * 0.52, height - horizon)
      if (waterPattern) {
        context.globalAlpha = 0.9
        context.fillStyle = waterPattern
        context.fillRect(0, horizon, width * 0.54, height - horizon)
        context.globalAlpha = 1
      }

      context.globalCompositeOperation = 'screen'
      const reflection = context.createRadialGradient(
        sunX,
        horizon + 18,
        3,
        sunX,
        horizon + height * 0.2,
        height * 0.29,
      )
      reflection.addColorStop(0, 'rgba(255, 239, 180, 0.3)')
      reflection.addColorStop(0.35, 'rgba(255, 231, 157, 0.12)')
      reflection.addColorStop(1, 'rgba(255, 231, 157, 0)')
      context.fillStyle = reflection
      context.beginPath()
      context.ellipse(sunX, horizon + height * 0.17, width * 0.075, height * 0.26, 0, 0, Math.PI * 2)
      context.fill()
      context.globalCompositeOperation = 'source-over'

      for (let row = 0; row < 15; row += 1) {
        const y = horizon + 24 + row * 45
        const phase = time * (0.00035 + row * 0.000009) + row * 1.73
        context.strokeStyle =
          row < 4 ? 'rgba(233,255,249,0.46)' : 'rgba(203,249,243,0.28)'
        context.lineWidth = row < 3 ? 1.8 : 1.15
        context.beginPath()
        for (let x = -20; x < width * 0.47; x += 7) {
          const waveY = y + Math.sin(x * 0.035 + phase) * (3.2 + row * 0.13)
          if (x === -20) context.moveTo(x, waveY)
          else context.lineTo(x, waveY)
        }
        context.stroke()
      }
      context.restore()

      for (let band = 0; band < 4; band += 1) {
        context.strokeStyle =
          band === 0
            ? 'rgba(255,255,247,0.96)'
            : 'rgba(232,255,248,' + (0.6 - band * 0.11) + ')'
        context.lineWidth = 8 - band * 1.5
        context.lineCap = 'round'
        context.beginPath()
        const offset = 4 + band * 6 + Math.sin(time * 0.0012 + band) * 3
        for (let y = horizon; y <= height + 7; y += 6) {
          const x = coastX(y, time) + offset
          if (y === horizon) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        context.stroke()
      }

      BEACH_SETS.forEach((set, setIndex) => {
        const umbrella = dragLayer.place(
          `umbrella-${setIndex}`,
          width * set.x,
          height * set.y,
        )
        drawUmbrella(context, umbrella.x, umbrella.y, set.radius, set.colors)
        dragLayer.register({
          id: `umbrella-${setIndex}`,
          ...umbrella,
          radius: set.radius * 1.15,
        })

        for (let chair = 0; chair < set.chairs; chair += 1) {
          const side = chair % 2 ? -1 : 1
          const chairId = `chair-${setIndex}-${chair}`
          const chairPosition = dragLayer.place(
            chairId,
            width * set.x + side * set.radius * (1.05 + Math.floor(chair / 2) * 0.7),
            height * set.y + set.radius * (1.22 + chair * 0.24),
          )
          drawBeachChair(
            context,
            chairPosition.x,
            chairPosition.y,
            set.radius / 32,
            ['#53a7ba', '#e77a61', '#f1c45c'][chair % 3],
            side * (0.18 + chair * 0.08),
          )
          dragLayer.register({
            id: chairId,
            ...chairPosition,
            radius: Math.max(15, set.radius * 0.72),
          })
        }
      })

      TOWELS.forEach(([x, y, towelWidth, color, rotation], index) => {
        const id = `towel-${index}`
        const position = dragLayer.place(id, width * x, height * y)
        drawTowel(context, position.x, position.y, towelWidth, color, rotation)
        dragLayer.register({ id, ...position, radius: towelWidth * 0.92 })
      })

      DRINKS.forEach(([x, y, scale, color], index) => {
        const id = `drink-${index}`
        const position = dragLayer.place(id, width * x, height * y)
        drawDrink(context, position.x, position.y, scale, color)
        dragLayer.register({ id, ...position, radius: Math.max(9, scale * 13) })
      })

      const crabDelta = lastCrabTime ? Math.min(0.04, (time - lastCrabTime) / 1000) : 0
      lastCrabTime = time
      crabAgents.forEach((crab, crabIndex) => {
        if (!prefersReducedMotion && time >= crab.pauseUntil) {
          if (!crab.path.length || crab.waypoint >= crab.path.length) {
            const territory = CRAB_DESTINATIONS[crabIndex]
            const destination = territory[crab.destinationCursor % territory.length]
            crab.gait =
              (crab.destinationCursor + crabIndex) % 3 === 1 ? 'forward' : 'sideways'
            crab.destinationCursor += 1
            crab.path = findCrabPath(crab, destination, width, height, CRAB_OBSTACLES)
            crab.waypoint = crab.path.length > 1 ? 1 : 0
            if (crab.path.length < 2) crab.pauseUntil = time + 900
          }

          const waypoint = crab.path[crab.waypoint]
          if (waypoint) {
            const deltaX = (waypoint.x - crab.x) * width
            const deltaY = (waypoint.y - crab.y) * height
            const distance = Math.hypot(deltaX, deltaY)
            if (distance < 4) {
              crab.x = waypoint.x
              crab.y = waypoint.y
              crab.waypoint += 1
              if (crab.waypoint >= crab.path.length) {
                crab.path = []
                crab.pauseUntil = time + 650 + crabIndex * 240
              }
            } else {
              const travelHeading = Math.atan2(deltaY, deltaX)
              const targetHeading = uprightAngle(
                crab.gait === 'forward' ? travelHeading + Math.PI / 2 : travelHeading,
              )
              const turn = Math.atan2(
                Math.sin(targetHeading - crab.heading),
                Math.cos(targetHeading - crab.heading),
              )
              crab.heading += turn * Math.min(1, crabDelta * 5.5)
              const step = Math.min(distance, crab.speed * crabDelta)
              crab.x += (deltaX / distance / width) * step
              crab.y += (deltaY / distance / height) * step
              crab.walkPhase += step * 0.28
            }
          }
        }
        drawCrab(
          context,
          crab.x * width,
          crab.y * height,
          crab.scale,
          crab.heading,
          crab.walkPhase,
        )
        dragLayer.register({
          id: `crab-${crabIndex}`,
          x: crab.x * width,
          y: crab.y * height,
          radius: Math.max(14, crab.scale * 24),
          onMove: (point) => {
            crab.x = point.x / width
            crab.y = point.y / height
            crab.path = []
            crab.waypoint = 0
            crab.pauseUntil = Number.POSITIVE_INFINITY
          },
          onEnd: () => {
            crab.path = []
            crab.pauseUntil = performance.now() + 650
          },
        })
      })

      BEACH_BALLS.forEach((ball, index) => {
        const id = `ball-${index}`
        const position = dragLayer.place(id, width * ball.x, height * ball.y)
        drawBeachBall(context, position.x, position.y, ball.radius)
        dragLayer.register({ id, ...position, radius: ball.radius * 1.15 })
      })

      SANDCASTLES.forEach((castle, index) => {
        const id = `sandcastle-${index}`
        const position = dragLayer.place(id, width * castle.x, height * castle.y)
        drawSandcastle(context, position.x, position.y, castle.scale)
        dragLayer.register({ id, ...position, radius: castle.scale * 34 })
      })

      PEBBLE_GROUPS.forEach((pebbles, index) => {
        const id = `pebbles-${index}`
        const position = dragLayer.place(id, width * pebbles.x, height * pebbles.y)
        drawPebbles(context, position.x, position.y, pebbles.scale)
        dragLayer.register({ id, ...position, radius: pebbles.scale * 31 })
      })

      BIRDS.forEach((bird, index) => {
        const travel = width + 180
        const x = ((time * bird.speed + width * bird.offsetRatio) % travel) - 90
        const y = height * bird.yRatio + Math.sin(time * 0.0007 + index * 2) * 12
        const wingLift = Math.sin(time * 0.006 + index * 1.6) * 6
        drawSeagull(context, x, y, bird.scale, wingLift)
      })

      if (!prefersReducedMotion) frameId = window.requestAnimationFrame(draw)
    }

    const handleResize = () => {
      resize()
      if (prefersReducedMotion) draw(0)
    }

    let activePointerId: number | null = null
    const isInterfaceElement = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(
        target.closest(
          'button, a, input, .events-section, .side-panel, .site-header, .credits-card',
        ),
      )

    const handlePointerDown = (event: PointerEvent) => {
      if (isInterfaceElement(event.target)) return
      if (!dragLayer.start(event.clientX, event.clientY)) return

      activePointerId = event.pointerId
      document.body.classList.add('dragging-beach-object')
      document.body.classList.remove('beach-object-hover')
      event.preventDefault()
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (activePointerId === event.pointerId) {
        dragLayer.move(event.clientX, event.clientY, width, height)
        if (prefersReducedMotion) draw(0)
        return
      }

      const hovering =
        !isInterfaceElement(event.target) &&
        dragLayer.isHovering(event.clientX, event.clientY)
      document.body.classList.toggle('beach-object-hover', hovering)
    }

    const finishDrag = (event?: PointerEvent) => {
      if (event && activePointerId !== event.pointerId) return
      if (!dragLayer.end()) return

      activePointerId = null
      document.body.classList.remove('dragging-beach-object')
      if (prefersReducedMotion) draw(0)
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
