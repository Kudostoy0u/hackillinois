import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { GiNautilusShell, GiOpeningShell, GiSpiralShell, GiTripleShells } from 'react-icons/gi'

type PhysicsShellProps = {
  icon: ReactNode
  label: string
  left: number
  top: number
  initialRotation: number
  size: number
  className: string
  onSplash: (x: number, y: number) => void
}

function PhysicsShell({
  icon,
  label,
  left,
  top,
  initialRotation,
  size,
  className,
  onSplash,
}: PhysicsShellProps) {
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
    // Top-down projection: hand velocity becomes a short surface glide, not a ballistic fall.
    let velocityX = dragRef.current.velocityX * 0.18
    let velocityY = dragRef.current.velocityY * 0.18
    let previousTime = performance.now()
    let elapsed = 0
    let splashed = false

    const simulate = (time: number) => {
      const delta = Math.min(0.028, Math.max(0.001, (time - previousTime) / 1000))
      previousTime = time
      elapsed += delta

      const baseX = (window.innerWidth * left) / 100
      const baseY = (window.innerHeight * top) / 100
      let offsetX = x.get()
      let offsetY = y.get()
      let absoluteX = baseX + offsetX + 16
      let absoluteY = baseY + offsetY + 16
      const surfaceProgress = Math.max(
        0,
        (absoluteY - window.innerHeight * 0.345) / (window.innerHeight * 0.655),
      )
      const coast = window.innerWidth * (0.448 - surfaceProgress * 0.052)
      const inWater = absoluteY > window.innerHeight * 0.345 && absoluteX < coast
      const overGround = absoluteY > window.innerHeight * 0.345
      const damping = Math.pow(inWater ? 0.76 : overGround ? 0.87 : 0.94, delta * 60)
      velocityX *= damping
      velocityY *= damping
      offsetX += velocityX * delta
      offsetY += velocityY * delta
      absoluteX = baseX + offsetX + 16
      absoluteY = baseY + offsetY + 16

      const nextSurfaceProgress = Math.max(
        0,
        (absoluteY - window.innerHeight * 0.345) / (window.innerHeight * 0.655),
      )
      const nextCoast = window.innerWidth * (0.448 - nextSurfaceProgress * 0.052)
      const enteredWater = absoluteY > window.innerHeight * 0.345 && absoluteX < nextCoast
      if (enteredWater && !splashed) {
        splashed = true
        onSplash(absoluteX, absoluteY)
      }

      const radius = 15 * size
      const leftWall = radius
      const rightWall = window.innerWidth - radius
      const topWall = window.innerHeight * 0.345 + radius
      const bottomWall = window.innerHeight - radius
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

      const atRest = Math.hypot(velocityX, velocityY) < 6
      if (!atRest && elapsed < 12) frameRef.current = window.requestAnimationFrame(simulate)
    }

    frameRef.current = window.requestAnimationFrame(simulate)
  }

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    window.cancelAnimationFrame(frameRef.current)
    event.currentTarget.setPointerCapture(event.pointerId)
    const now = performance.now()
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startOffsetX: x.get(),
      startOffsetY: y.get(),
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: now,
      velocityX: 0,
      velocityY: 0,
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
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
    const baseY = (window.innerHeight * top) / 100
    const minimumSurfaceOffset = window.innerHeight * 0.345 + 8 - baseY
    const nextY = Math.max(
      minimumSurfaceOffset,
      drag.startOffsetY + event.clientY - drag.startPointerY,
    )
    y.set(nextY)
    rotation.set(initialRotation + (event.clientX - drag.startPointerX) * 0.16)
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return
    dragRef.current.active = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (performance.now() - dragRef.current.lastTime > 90) {
      dragRef.current.velocityX *= 0.2
      dragRef.current.velocityY *= 0.2
    }
    if (!prefersReducedMotion) startPhysics()
  }

  return (
    <motion.button
      type="button"
      className={`shell ${className}`}
      style={{ left: `${left}%`, top: `${top}%`, x, y, rotate: rotation, scale: size }}
      aria-label={`Throw the ${label} into the water`}
      whileHover={{ scale: size * 1.12 }}
      whileTap={{
        scale: size * 1.42,
        cursor: 'grabbing',
        filter: 'drop-shadow(0 12px 7px rgb(43 52 46 / 28%))',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {icon}
    </motion.button>
  )
}

export function ShellToss({ onSplash }: { onSplash: (x: number, y: number) => void }) {
  const shells = [
    { icon: <GiOpeningShell />, label: 'pink shell', left: 49, top: 68, rotation: -18, size: 1 },
    { icon: <GiNautilusShell />, label: 'spiral shell', left: 91, top: 62, rotation: 22, size: 1.2 },
    { icon: <GiOpeningShell />, label: 'coral shell', left: 83, top: 90, rotation: 8, size: 0.92 },
    { icon: <GiNautilusShell />, label: 'small shell', left: 58, top: 87, rotation: -32, size: 0.78 },
    { icon: <GiOpeningShell />, label: 'sunset shell', left: 96, top: 78, rotation: 35, size: 0.72 },
    { icon: <GiSpiralShell />, label: 'ivory spiral shell', left: 97.2, top: 39, rotation: -12, size: 0.82 },
    { icon: <GiTripleShells />, label: 'tiny shell cluster', left: 94.8, top: 46, rotation: 18, size: 0.72 },
    { icon: <GiNautilusShell />, label: 'gold nautilus shell', left: 98, top: 53, rotation: -28, size: 0.9 },
    { icon: <GiOpeningShell />, label: 'rose shell', left: 96.2, top: 60, rotation: 11, size: 0.68 },
    { icon: <GiSpiralShell />, label: 'small spiral shell', left: 98.1, top: 69, rotation: 26, size: 0.74 },
    { icon: <GiTripleShells />, label: 'peach shell cluster', left: 95.1, top: 86, rotation: -19, size: 0.66 },
    { icon: <GiNautilusShell />, label: 'large beach shell', left: 97.5, top: 94, rotation: 7, size: 1.05 },
  ]

  return (
    <div className="beach-shells" aria-label="Throwable shells on the beach">
      {shells.map((shell, index) => (
        <PhysicsShell
          {...shell}
          initialRotation={shell.rotation}
          className={`shell-${(index % 3) + 1}`}
          key={shell.label}
          onSplash={onSplash}
        />
      ))}
    </div>
  )
}

