export type CrabPoint = { x: number; y: number }
export type CrabObstacle = CrabPoint & { radius: number }

export function findCrabPath(
  start: CrabPoint,
  destination: CrabPoint,
  width: number,
  height: number,
  obstacles: CrabObstacle[],
) {
  const columns = 34
  const rows = 28
  const horizon = 0.345
  const pointForCell = (column: number, row: number): CrabPoint => ({
    x: column / (columns - 1),
    y: horizon + (row / (rows - 1)) * (1 - horizon),
  })
  const isWalkable = (column: number, row: number) => {
    if (column < 0 || column >= columns || row < 0 || row >= rows) return false
    const point = pointForCell(column, row)
    const coastProgress = (point.y - horizon) / (1 - horizon)
    const safeCoast = 0.448 - coastProgress * 0.052 + 0.027
    if (point.x < safeCoast || point.x > 0.985 || point.y < 0.37 || point.y > 0.975) return false
    return !obstacles.some((obstacle) => {
      const deltaX = (point.x - obstacle.x) * width
      const deltaY = (point.y - obstacle.y) * height
      return Math.hypot(deltaX, deltaY) < obstacle.radius
    })
  }
  const nearestWalkable = (point: CrabPoint) => {
    const originColumn = Math.round(point.x * (columns - 1))
    const originRow = Math.round(((point.y - horizon) / (1 - horizon)) * (rows - 1))
    for (let radius = 0; radius < Math.max(columns, rows); radius += 1) {
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
  if (!reachedKey) return []

  const cells: Array<{ column: number; row: number }> = []
  let cursor: string | undefined = reachedKey
  while (cursor) {
    const [column, row] = cursor.split(':').map(Number)
    cells.unshift({ column, row })
    cursor = cameFrom.get(cursor)
  }
  const points = cells.map((cell) => pointForCell(cell.column, cell.row))

  const lineIsClear = (from: CrabPoint, to: CrabPoint) => {
    const distance = Math.hypot((to.x - from.x) * width, (to.y - from.y) * height)
    const steps = Math.max(2, Math.ceil(distance / 12))
    for (let step = 1; step < steps; step += 1) {
      const progress = step / steps
      const point = {
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress,
      }
      const column = Math.round(point.x * (columns - 1))
      const row = Math.round(((point.y - horizon) / (1 - horizon)) * (rows - 1))
      if (!isWalkable(column, row)) return false
    }
    return true
  }
  const simplified: CrabPoint[] = points.length ? [points[0]] : []
  let pointIndex = 0
  while (pointIndex < points.length - 1) {
    let furthest = pointIndex + 1
    for (let candidate = points.length - 1; candidate > pointIndex + 1; candidate -= 1) {
      if (lineIsClear(points[pointIndex], points[candidate])) {
        furthest = candidate
        break
      }
    }
    simplified.push(points[furthest])
    pointIndex = furthest
  }
  return simplified
}

