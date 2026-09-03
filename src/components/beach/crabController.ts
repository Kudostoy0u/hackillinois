import type { CanvasDragLayer } from './canvasDragLayer'
import { drawCrab } from './drawing'
import {
  findCrabPath,
  findNearestClearPosition,
  isCrabPositionClear,
  isCrabSegmentClear,
  type CrabObstacle,
  type CrabPoint,
} from './pathfinding'
import { CRAB_DESTINATIONS, CRAB_SEEDS, type CrabSeed } from './sceneLayout'

type CrabAgent = CrabSeed & {
  path: CrabPoint[]
  waypoint: number
}

function uprightAngle(angle: number) {
  let normalized = Math.atan2(Math.sin(angle), Math.cos(angle))
  if (normalized > Math.PI / 2) normalized -= Math.PI
  if (normalized < -Math.PI / 2) normalized += Math.PI
  return Math.max(-1.38, Math.min(1.38, normalized))
}

export function createCrabController() {
  const agents: CrabAgent[] = CRAB_SEEDS.map((seed) => ({
    ...seed,
    path: [],
    waypoint: 0,
  }))
  let lastFrameTime = 0

  const resetRoute = (crab: CrabAgent) => {
    crab.path = []
    crab.waypoint = 0
  }

  const clearRoutes = (pauseUntil: number) => {
    agents.forEach((crab) => {
      resetRoute(crab)
      crab.pauseUntil = pauseUntil
    })
  }

  const planRoute = (
    crab: CrabAgent,
    crabIndex: number,
    width: number,
    height: number,
    obstacles: CrabObstacle[],
  ) => {
    const territory = CRAB_DESTINATIONS[crabIndex]
    const destination = territory[crab.destinationCursor % territory.length]
    crab.gait =
      (crab.destinationCursor + crabIndex) % 3 === 1 ? 'forward' : 'sideways'
    crab.destinationCursor += 1
    crab.path = findCrabPath(crab, destination, width, height, obstacles)
    crab.waypoint = crab.path.length > 1 ? 1 : 0
    return crab.path.length > 1
  }

  return {
    pauseForDecorDrag() {
      agents.forEach((crab) => {
        crab.pauseUntil = Number.POSITIVE_INFINITY
      })
    },

    resumeAfterDecorDrag(time: number) {
      clearRoutes(time + 80)
    },

    draw(
      context: CanvasRenderingContext2D,
      width: number,
      height: number,
      time: number,
      reducedMotion: boolean,
      dragLayer: CanvasDragLayer,
    ) {
      const delta = lastFrameTime ? Math.min(0.04, (time - lastFrameTime) / 1000) : 0
      lastFrameTime = time

      agents.forEach((crab, crabIndex) => {
        if (!reducedMotion && time >= crab.pauseUntil) {
          const obstacles = dragLayer.getObstacles(width, height, `crab-${crabIndex}`)
          let canMove = true

          if (!isCrabPositionClear(crab, width, height, obstacles)) {
            const safePosition = findNearestClearPosition(crab, width, height, obstacles)
            if (safePosition) {
              crab.x = safePosition.x
              crab.y = safePosition.y
              resetRoute(crab)
            } else {
              resetRoute(crab)
              crab.pauseUntil = time + 180
              canMove = false
            }
          }

          if (canMove) {
            const waypoint = crab.path[crab.waypoint]
            if (
              waypoint &&
              !isCrabSegmentClear(crab, waypoint, width, height, obstacles)
            ) {
              resetRoute(crab)
            }

            if (!crab.path.length || crab.waypoint >= crab.path.length) {
              const routeFound = planRoute(crab, crabIndex, width, height, obstacles)
              if (!routeFound) crab.pauseUntil = time + 180
            }

            const nextWaypoint = crab.path[crab.waypoint]
            if (nextWaypoint) {
              const deltaX = (nextWaypoint.x - crab.x) * width
              const deltaY = (nextWaypoint.y - crab.y) * height
              const distance = Math.hypot(deltaX, deltaY)

              if (distance < 4) {
                crab.x = nextWaypoint.x
                crab.y = nextWaypoint.y
                crab.waypoint += 1
                if (crab.waypoint >= crab.path.length) {
                  resetRoute(crab)
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
                crab.heading += turn * Math.min(1, delta * 5.5)
                const step = Math.min(distance, crab.speed * delta)
                const nextPosition = {
                  x: crab.x + (deltaX / distance / width) * step,
                  y: crab.y + (deltaY / distance / height) * step,
                }
                if (isCrabPositionClear(nextPosition, width, height, obstacles)) {
                  crab.x = nextPosition.x
                  crab.y = nextPosition.y
                  crab.walkPhase += step * 0.28
                } else {
                  resetRoute(crab)
                }
              }
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
            resetRoute(crab)
            crab.pauseUntil = Number.POSITIVE_INFINITY
          },
          onEnd: () => {
            resetRoute(crab)
            crab.pauseUntil = performance.now() + 80
          },
        })
      })
    },
  }
}
