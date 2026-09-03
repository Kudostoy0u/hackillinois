import { motion } from 'framer-motion'
import type { Ripple } from '../../types'
import { OceanCanvas } from './OceanCanvas'

export function CoastalScene({ ripples }: { ripples: Ripple[] }) {
  return (
    <div className="coastal-scene" aria-hidden="true">
      <OceanCanvas />
      {ripples.map((ripple) => (
        <motion.span
          className={`ripple ${ripple.kind}`}
          key={ripple.id}
          style={{ left: ripple.x, top: ripple.y }}
          initial={{
            scale: ripple.kind === 'water' ? 0.15 : 0.45,
            opacity: ripple.kind === 'water' ? 0.9 : 0.55,
          }}
          animate={{ scale: ripple.kind === 'water' ? 3.2 : 1.25, opacity: 0 }}
          transition={{ duration: ripple.kind === 'water' ? 1.15 : 2.8, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

