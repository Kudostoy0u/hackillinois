import { useCallback, useEffect, useRef, useState } from 'react'
import { getSurfaceAt } from '../components/beach/beachGeometry'
import type { Ripple } from '../types'

function surfaceAt(x: number, y: number): Ripple['kind'] | 'sky' {
  return getSurfaceAt(x, y, window.innerWidth, window.innerHeight)
}

export function useRipples() {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const rippleCounter = useRef(0)

  const addRipple = useCallback((x: number, y: number, kind: Ripple['kind'] = 'water') => {
    rippleCounter.current += 1
    const id = rippleCounter.current

    setRipples((current) => [...current.slice(-18), { id, x, y, kind }])
    window.setTimeout(
      () => setRipples((current) => current.filter((ripple) => ripple.id !== id)),
      kind === 'water' ? 1250 : 2900,
    )
  }, [])

  useEffect(() => {
    let lastX = -100
    let lastY = -100
    let lastTime = 0

    const handlePointerMove = (event: PointerEvent) => {
      const now = performance.now()
      const distance = Math.hypot(event.clientX - lastX, event.clientY - lastY)
      if (distance < 20 || now - lastTime < 42) return

      const surface = surfaceAt(event.clientX, event.clientY)
      const shouldRipple = surface === 'water' || (surface === 'sand' && event.buttons > 0)
      if (!shouldRipple) return

      addRipple(event.clientX, event.clientY, surface)
      lastX = event.clientX
      lastY = event.clientY
      lastTime = now
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (surfaceAt(event.clientX, event.clientY) === 'sand') {
        addRipple(event.clientX, event.clientY, 'sand')
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [addRipple])

  return { ripples }
}
