import { BEACH_GEOMETRY, getBaseShoreRatio } from './beachGeometry'

export type CrabPoint = { x: number; y: number }
export type CrabObstacle = CrabPoint & { radius: number }

const GRID_COLUMNS = 48
const GRID_ROWS = 36

export function isCrabPositionClear(
  point: CrabPoint,
  width: number,
  height: number,
  obstacles: CrabObstacle[],
) {
  const horizon = BEACH_GEOMETRY.horizonRatio
  const coastProgress = (point.y - horizon) / (1 - horizon)
  const safeCoast =
    getBaseShoreRatio(coastProgress) + BEACH_GEOMETRY.pathClearanceRatio

  if (point.x < safeCoast || point.x > 0.985 || point.y < 0.37 || point.y > 0.975) {
    return false
  }

  return !obstacles.some((obstacle) => {
    const deltaX = (point.x - obstacle.x) * width
    const deltaY = (point.y - obstacle.y) * height
    return Math.hypot(deltaX, deltaY) <= obstacle.radius
  })
}

export function isCrabSegmentClear(
  from: CrabPoint,
  to: CrabPoint,
  width: number,
  height: number,
  obstacles: CrabObstacle[],
) {
  const distance = Math.hypot((to.x - from.x) * width, (to.y - from.y) * height)
  const steps = Math.max(1, Math.ceil(distance / 6))

  for (let step = 0; step <= steps; step += 1) {
    const progress = step / steps
    if (
      !isCrabPositionClear(
        {
          x: from.x + (to.x - from.x) * progress,
          y: from.y + (to.y - from.y) * progress,
        },
        width,
        height,
        obstacles,
      )
    ) {
      return false
    }
  }
  return true
}

export function findNearestClearPosition(
  origin: CrabPoint,
  width: number,
  height: number,
  obstacles: CrabObstacle[],
) {
  if (isCrabPositionClear(origin, width, height, obstacles)) return origin

  const maximumRadius = Math.hypot(width, height)
  for (let radius = 8; radius <= maximumRadius; radius += 8) {
    const samples = Math.max(12, Math.ceil((Math.PI * 2 * radius) / 12))
    const angleOffset = (radius / 8 % 2) * (Math.PI / samples)
    for (let sample = 0; sample < samples; sample += 1) {
      const angle = angleOffset + (sample / samples) * Math.PI * 2
      const candidate = {
        x: origin.x + Math.cos(angle) * radius / width,
        y: origin.y + Math.sin(angle) * radius / height,
      }
      if (isCrabPositionClear(candidate, width, height, obstacles)) return candidate
    }
  }
  return null
}

export function findCrabPath(
  start: CrabPoint,
  destination: CrabPoint,
  width: number,
  height: number,
  obstacles: CrabObstacle[],
) {
  const horizon = BEACH_GEOMETRY.horizonRatio
  const pointForCell = (column: number, row: number): CrabPoint => ({
    x: column / (GRID_COLUMNS - 1),
    y: horizon + (row / (GRID_ROWS - 1)) * (1 - horizon),
  })
  const isWalkable = (column: number, row: number) => {
    if (
      column < 0 ||
      column >= GRID_COLUMNS ||
      row < 0 ||
      row >= GRID_ROWS
    ) return false
    return isCrabPositionClear(pointForCell(column, row), width, height, obstacles)
  }
  const nearestWalkable = (point: CrabPoint) => {
    const originColumn = Math.round(point.x * (GRID_COLUMNS - 1))
    const originRow = Math.round(
      ((point.y - horizon) / (1 - horizon)) * (GRID_ROWS - 1),
    )
    for (let radius = 0; radius < Math.max(GRID_COLUMNS, GRID_ROWS); radius += 1) {
      for (let rowOffset = -radius; rowOffset <= radius; rowOffset += 1) {
        for (let columnOffset = -radius; columnOffset <= radius; columnOffset += 1) {
          if (Math.max(Math.abs(columnOffset), Math.abs(rowOffset)) !== radius) continue
          const column = originColumn + columnOffset
          const row = originRow + rowOffset
          if (isWalkable(column, row)) return { column, row }
        }
      }
    }
    return null
  }

  const startCell = nearestWalkable(start)
  const goalCell = nearestWalkable(destination)
  if (!startCell || !goalCell) return []

  const key = (column: number, row: number) => `${column}:${row}`
  const open = [{ ...startCell, score: 0 }]
  const cameFrom = new Map<string, string>()
  const cost = new Map([[key(startCell.column, startCell.row), 0]])
  const heuristic = (column: number, row: number) =>
    Math.hypot(goalCell.column - column, goalCell.row - row)
  const neighbors = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0], [1, 0],
    [-1, 1], [0, 1], [1, 1],
  ]
  let reachedKey: string | null = null

  while (open.length) {
    open.sort((a, b) => a.score - b.score)
    const current = open.shift()!
    const currentKey = key(current.column, current.row)
    if (current.column === goalCell.column && current.row === goalCell.row) {
      reachedKey = currentKey
      break
    }
    for (const [columnOffset, rowOffset] of neighbors) {
      const column = current.column + columnOffset
      const row = current.row + rowOffset
      if (!isWalkable(column, row)) continue
      const diagonal = columnOffset !== 0 && rowOffset !== 0
      if (
        diagonal &&
        (!isWalkable(current.column + columnOffset, current.row) ||
          !isWalkable(current.column, current.row + rowOffset))
      ) continue
      const nextCost = (cost.get(currentKey) ?? Infinity) + (diagonal ? 1.414 : 1)
      const nextKey = key(column, row)
      if (nextCost >= (cost.get(nextKey) ?? Infinity)) continue
      cameFrom.set(nextKey, currentKey)
      cost.set(nextKey, nextCost)
      const existing = open.find((node) => node.column === column && node.row === row)
      const score = nextCost + heuristic(column, row)
      if (existing) existing.score = score
      else open.push({ column, row, score })
    }
  }
  if (!reachedKey) {
    const fallback = [...cost.entries()].reduce<[string, number] | null>(
      (farthest, entry) => !farthest || entry[1] > farthest[1] ? entry : farthest,
      null,
    )
    if (!fallback || fallback[1] === 0) return []
    reachedKey = fallback[0]
  }

  const cells: Array<{ column: number; row: number }> = []
  let cursor: string | undefined = reachedKey
  while (cursor) {
    const [column, row] = cursor.split(':').map(Number)
    cells.unshift({ column, row })
    cursor = cameFrom.get(cursor)
  }
  const points = cells.map((cell) => pointForCell(cell.column, cell.row))
  if (points.length && isCrabPositionClear(start, width, height, obstacles)) {
    points[0] = start
  }

  const simplified: CrabPoint[] = points.length ? [points[0]] : []
  let pointIndex = 0
  while (pointIndex < points.length - 1) {
    let furthest = pointIndex + 1
    for (let candidate = points.length - 1; candidate > pointIndex + 1; candidate -= 1) {
      if (isCrabSegmentClear(points[pointIndex], points[candidate], width, height, obstacles)) {
        furthest = candidate
        break
      }
    }
    simplified.push(points[furthest])
    pointIndex = furthest
  }
  return simplified
}
