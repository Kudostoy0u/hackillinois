import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { GiOpeningShell, GiSpiralShell, GiTripleShells } from 'react-icons/gi'
import { useShellPhysics } from './useShellPhysics'

type ShellDefinition = {
  icon: ReactNode
  label: string
  left: number
  top: number
  rotation: number
  size: number
}

type PhysicsShellProps = ShellDefinition & {
  className: string
  onSplash: (x: number, y: number) => void
}

const SHELLS: ShellDefinition[] = [
  { icon: <GiOpeningShell />, label: 'pink shell', left: 49, top: 68, rotation: -18, size: 1 },
  { icon: <GiOpeningShell />, label: 'coral shell', left: 83, top: 90, rotation: 8, size: 0.92 },
  { icon: <GiOpeningShell />, label: 'sunset shell', left: 96, top: 78, rotation: 35, size: 0.72 },
  { icon: <GiSpiralShell />, label: 'ivory spiral shell', left: 97.2, top: 39, rotation: -12, size: 0.82 },
  { icon: <GiTripleShells />, label: 'tiny shell cluster', left: 94.8, top: 46, rotation: 18, size: 0.72 },
  { icon: <GiOpeningShell />, label: 'rose shell', left: 96.2, top: 60, rotation: 11, size: 0.68 },
  { icon: <GiSpiralShell />, label: 'small spiral shell', left: 98.1, top: 69, rotation: 26, size: 0.74 },
  { icon: <GiTripleShells />, label: 'peach shell cluster', left: 95.1, top: 86, rotation: -19, size: 0.66 },
]

function PhysicsShell({
  icon,
  label,
  left,
  top,
  rotation,
  size,
  className,
  onSplash,
}: PhysicsShellProps) {
  const physics = useShellPhysics({
    left,
    top,
    initialRotation: rotation,
    size,
    onSplash,
  })

  return (
    <motion.button
      type="button"
      className={`shell ${className}`}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        scale: size,
        ...physics.style,
      }}
      aria-label={`Throw the ${label} into the water`}
      whileHover={{ scale: size * 1.12 }}
      whileTap={{
        scale: size * 1.42,
        cursor: 'grabbing',
        filter: 'drop-shadow(0 12px 7px rgb(43 52 46 / 28%))',
      }}
      {...physics.pointerHandlers}
    >
      {icon}
    </motion.button>
  )
}

export function ShellToss({ onSplash }: { onSplash: (x: number, y: number) => void }) {
  return (
    <div className="beach-shells" aria-label="Throwable shells on the beach">
      {SHELLS.map((shell, index) => (
        <PhysicsShell
          {...shell}
          className={`shell-${(index % 3) + 1}`}
          key={shell.label}
          onSplash={onSplash}
        />
      ))}
    </div>
  )
}

