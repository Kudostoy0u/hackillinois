export type CanvasPoint = { x: number; y: number }

type DragTarget = CanvasPoint & {
  id: string
  radius: number
  onMove?: (point: CanvasPoint) => void
  onEnd?: () => void
}

type ActiveDrag = {
  target: DragTarget
  pointerX: number
  pointerY: number
  offset: CanvasPoint
}

export function createCanvasDragLayer() {
  const offsets = new Map<string, CanvasPoint>()
  let targets: DragTarget[] = []
  let activeDrag: ActiveDrag | null = null

  const findTarget = (x: number, y: number) =>
    targets
      .slice()
      .reverse()
      .find((target) => Math.hypot(x - target.x, y - target.y) <= target.radius)

  return {
    beginFrame() {
      targets = []
    },

    place(id: string, x: number, y: number) {
      const offset = offsets.get(id) ?? { x: 0, y: 0 }
      return { x: x + offset.x, y: y + offset.y }
    },

    register(target: DragTarget) {
      targets.push(target)
    },

    isHovering(x: number, y: number) {
      return Boolean(findTarget(x, y))
    },

    start(x: number, y: number) {
      const target = findTarget(x, y)
      if (!target) return false

      activeDrag = {
        target,
        pointerX: x,
        pointerY: y,
        offset: offsets.get(target.id) ?? { x: 0, y: 0 },
      }
      return true
    },

    move(x: number, y: number, width: number, height: number) {
      if (!activeDrag) return false

      const { target, pointerX, pointerY, offset } = activeDrag
      const nextPoint = {
        x: Math.max(target.radius, Math.min(width - target.radius, target.x + x - pointerX)),
        y: Math.max(target.radius, Math.min(height - target.radius, target.y + y - pointerY)),
      }

      if (target.onMove) {
        target.onMove(nextPoint)
      } else {
        offsets.set(target.id, {
          x: offset.x + nextPoint.x - target.x,
          y: offset.y + nextPoint.y - target.y,
        })
      }
      return true
    },

    end() {
      if (!activeDrag) return false
      activeDrag.target.onEnd?.()
      activeDrag = null
      return true
    },
  }
}
