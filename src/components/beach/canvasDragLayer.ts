import { getHorizonY } from './beachGeometry'

export type CanvasPoint = { x: number; y: number }

type DragTarget = CanvasPoint & {
  id: string
  radius: number
  draggable?: boolean
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
      .find(
        (target) =>
          target.draggable !== false &&
          Math.hypot(x - target.x, y - target.y) <= target.radius,
      )

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

    getObstacles(width: number, height: number, excludedId: string) {
      return targets
        .filter((target) => target.id !== excludedId)
        .map((target) => ({
          x: target.x / width,
          y: target.y / height,
          radius: target.radius + 36,
        }))
    },

    isHovering(x: number, y: number) {
      return Boolean(findTarget(x, y))
    },

    start(x: number, y: number) {
      const target = findTarget(x, y)
      if (!target) return null

      activeDrag = {
        target,
        pointerX: x,
        pointerY: y,
        offset: offsets.get(target.id) ?? { x: 0, y: 0 },
      }
      return target.id
    },

    move(x: number, y: number, width: number, height: number) {
      if (!activeDrag) return null

      const { target, pointerX, pointerY, offset } = activeDrag
      const beachHorizon = getHorizonY(height)
      const nextPoint = {
        x: Math.max(target.radius, Math.min(width - target.radius, target.x + x - pointerX)),
        y: Math.max(
          beachHorizon + target.radius,
          Math.min(height - target.radius, target.y + y - pointerY),
        ),
      }

      if (target.onMove) {
        target.onMove(nextPoint)
      } else {
        offsets.set(target.id, {
          x: offset.x + nextPoint.x - target.x,
          y: offset.y + nextPoint.y - target.y,
        })
      }
      return target.id
    },

    end() {
      if (!activeDrag) return null
      const draggedId = activeDrag.target.id
      activeDrag.target.onEnd?.()
      activeDrag = null
      return draggedId
    },
  }
}

export type CanvasDragLayer = ReturnType<typeof createCanvasDragLayer>
