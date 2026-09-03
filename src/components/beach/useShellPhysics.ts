import { useEffect, useRef, type PointerEvent } from 'react'
import { useMotionValue, useReducedMotion } from 'framer-motion'
import {
  getHorizonY,
  getSurfaceAt,
} from './beachGeometry'

type ShellPhysicsOptions = {
  left: number
  top: number
  initialRotation: number
  size: number
  onSplash: (x: number, y: number) => void
}

export function useShellPhysics({
  left,
  top,
  initialRotation,
  size,
  onSplash,
}: ShellPhysicsOptions) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotation = useMotionValue(initialRotation)
  const prefersReducedMotion = useReducedMotion()
  const frameRef = useRef(0)
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startPointerX: 0,
    startPointerY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    velocityX: 0,
    velocityY: 0,
  })

  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), [])

  const startPhysics = () => {
    // This is a top-down scene, so released shells glide across the surface.
    let velocityX = dragRef.current.velocityX * 0.18
    let velocityY = dragRef.current.velocityY * 0.18
    let previousTime = performance.now()
    let elapsed = 0
    let splashed = false

    const simulate = (time: number) => {
      const delta = Math.min(0.028, Math.max(0.001, (time - previousTime) / 1000))
      previousTime = time
      elapsed += delta

      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const baseX = (viewportWidth * left) / 100
      const baseY = (viewportHeight * top) / 100
      let offsetX = x.get()
      let offsetY = y.get()
      let absoluteX = baseX + offsetX + 16
      let absoluteY = baseY + offsetY + 16
      const surface = getSurfaceAt(
        absoluteX,
        absoluteY,
        viewportWidth,
        viewportHeight,
      )
      const damping = Math.pow(
        surface === 'water' ? 0.76 : surface === 'sand' ? 0.87 : 0.94,
        delta * 60,
      )

      velocityX *= damping
      velocityY *= damping
      offsetX += velocityX * delta
      offsetY += velocityY * delta
      absoluteX = baseX + offsetX + 16
      absoluteY = baseY + offsetY + 16

      if (
        !splashed &&
        getSurfaceAt(absoluteX, absoluteY, viewportWidth, viewportHeight) === 'water'
      ) {
        splashed = true
        onSplash(absoluteX, absoluteY)
      }

      const radius = 15 * size
      const leftWall = radius
      const rightWall = viewportWidth - radius
      const topWall = getHorizonY(viewportHeight) + radius
      const bottomWall = viewportHeight - radius
      if (absoluteX < leftWall) {
        offsetX += leftWall - absoluteX
        velocityX = Math.abs(velocityX) * 0.35
      } else if (absoluteX > rightWall) {
        offsetX -= absoluteX - rightWall
        velocityX = -Math.abs(velocityX) * 0.35
      }
      if (absoluteY < topWall) {
        offsetY += topWall - absoluteY
        velocityY = Math.abs(velocityY) * 0.35
      } else if (absoluteY > bottomWall) {
        offsetY -= absoluteY - bottomWall
        velocityY = -Math.abs(velocityY) * 0.35
      }

      x.set(offsetX)
      y.set(offsetY)
      rotation.set(rotation.get() + velocityX * delta * 0.07)

      if (Math.hypot(velocityX, velocityY) >= 6 && elapsed < 12) {
        frameRef.current = window.requestAnimationFrame(simulate)
      }
    }

    frameRef.current = window.requestAnimationFrame(simulate)
  }

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    window.cancelAnimationFrame(frameRef.current)
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startOffsetX: x.get(),
      startOffsetY: y.get(),
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocityX: 0,
      velocityY: 0,
    }
  }

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return

    const now = performance.now()
    const deltaSeconds = Math.max(0.008, (now - drag.lastTime) / 1000)
    const instantX = (event.clientX - drag.lastX) / deltaSeconds
    const instantY = (event.clientY - drag.lastY) / deltaSeconds
    drag.velocityX = drag.velocityX * 0.35 + instantX * 0.65
    drag.velocityY = drag.velocityY * 0.35 + instantY * 0.65
    drag.lastX = event.clientX
    drag.lastY = event.clientY
    drag.lastTime = now

    x.set(drag.startOffsetX + event.clientX - drag.startPointerX)
    const viewportHeight = window.innerHeight
    const baseY = (viewportHeight * top) / 100
    const minimumOffset = getHorizonY(viewportHeight) + 8 - baseY
    y.set(
      Math.max(
        minimumOffset,
        drag.startOffsetY + event.clientY - drag.startPointerY,
      ),
    )
    rotation.set(initialRotation + (event.clientX - drag.startPointerX) * 0.16)
  }

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return

    drag.active = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (performance.now() - drag.lastTime > 90) {
      drag.velocityX *= 0.2
      drag.velocityY *= 0.2
    }
    if (!prefersReducedMotion) startPhysics()
  }

  return {
    style: { x, y, rotate: rotation },
    pointerHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}
