export const BEACH_GEOMETRY = {
  horizonRatio: 0.345,
  shoreTopRatio: 0.448,
  shoreSlope: 0.052,
  shoreCurveRatio: 0.012,
  pathClearanceRatio: 0.027,
} as const

export function getHorizonY(height: number) {
  return height * BEACH_GEOMETRY.horizonRatio
}

export function getShoreProgress(y: number, height: number) {
  const horizon = getHorizonY(height)
  return Math.max(0, (y - horizon) / Math.max(1, height - horizon))
}

export function getBaseShoreRatio(progress: number) {
  return BEACH_GEOMETRY.shoreTopRatio - progress * BEACH_GEOMETRY.shoreSlope
}

export function getBaseShoreX(y: number, width: number, height: number) {
  return width * getBaseShoreRatio(getShoreProgress(y, height))
}

export function getSurfaceAt(
  x: number,
  y: number,
  width: number,
  height: number,
): 'sky' | 'water' | 'sand' {
  if (y < getHorizonY(height)) return 'sky'
  return x < getBaseShoreX(y, width, height) ? 'water' : 'sand'
}
