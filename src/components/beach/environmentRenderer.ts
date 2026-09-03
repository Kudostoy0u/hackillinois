import { BEACH_GEOMETRY, getBaseShoreRatio, getHorizonY, getShoreProgress } from './beachGeometry'
import { drawSeagull } from './drawing'
import { BIRDS } from './sceneLayout'

export type ScenePatterns = {
  sand: CanvasPattern | null
  water: CanvasPattern | null
}

export function createSceneTexture(
  context: CanvasRenderingContext2D,
  kind: 'sand' | 'water',
) {
  const texture = document.createElement('canvas')
  texture.width = 220
  texture.height = 220
  const textureContext = texture.getContext('2d')!
  let seed = kind === 'sand' ? 1847 : 9211
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }

  const count = kind === 'sand' ? 1100 : 360
  for (let index = 0; index < count; index += 1) {
    const x = random() * 220
    const y = random() * 220
    const size = kind === 'sand' ? random() * 1.4 + 0.25 : random() * 10 + 2
    textureContext.fillStyle =
      kind === 'sand'
        ? `rgba(${115 + random() * 55}, ${82 + random() * 45}, ${42 + random() * 30}, ${0.08 + random() * 0.13})`
        : `rgba(221, 255, 247, ${0.025 + random() * 0.055})`
    textureContext.beginPath()
    textureContext.ellipse(
      x,
      y,
      size,
      kind === 'sand' ? size * 0.5 : 0.75,
      random(),
      0,
      Math.PI * 2,
    )
    textureContext.fill()
  }

  return context.createPattern(texture, 'repeat')
}

function getAnimatedCoastX(y: number, time: number, width: number, height: number) {
  const progress = getShoreProgress(y, height)
  const curve = Math.sin(progress * Math.PI) * BEACH_GEOMETRY.shoreCurveRatio
  const sweep = width * (getBaseShoreRatio(progress) + curve)

  return (
    sweep +
    Math.sin(y * 0.027 + time * 0.00055) * 13 +
    Math.sin(y * 0.011 - time * 0.00032) * 17 +
    Math.sin(y * 0.071 + 1.4) * 5
  )
}

function createShorelinePath(
  width: number,
  height: number,
  time: number,
  offset = 0,
) {
  const horizon = getHorizonY(height)
  const path = new Path2D()
  path.moveTo(0, horizon)
  path.lineTo(getAnimatedCoastX(horizon, time, width, height) + offset, horizon)
  for (let y = horizon; y <= height + 12; y += 7) {
    path.lineTo(getAnimatedCoastX(y, time, width, height) + offset, y)
  }
  path.lineTo(0, height + 12)
  path.closePath()
  return path
}

export function drawEnvironment(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  patterns: ScenePatterns,
) {
  const horizon = getHorizonY(height)
  const sky = context.createLinearGradient(0, 0, 0, horizon)
  sky.addColorStop(0, '#5fc6e8')
  sky.addColorStop(0.58, '#b9e7e3')
  sky.addColorStop(1, '#f4dfb5')
  context.fillStyle = sky
  context.fillRect(0, 0, width, horizon + 3)

  const sunX = width * 0.23
  const sunY = Math.min(178, height * 0.18)
  const glow = context.createRadialGradient(sunX, sunY, 8, sunX, sunY, 105)
  glow.addColorStop(0, 'rgba(255, 250, 210, 0.98)')
  glow.addColorStop(0.22, 'rgba(255, 222, 120, 0.92)')
  glow.addColorStop(1, 'rgba(255, 229, 152, 0)')
  context.fillStyle = glow
  context.fillRect(sunX - 110, sunY - 110, 220, 220)
  context.fillStyle = '#ffe39a'
  context.beginPath()
  context.arc(sunX, sunY, 32, 0, Math.PI * 2)
  context.fill()

  const sand = context.createLinearGradient(width * 0.4, horizon, width, height)
  sand.addColorStop(0, '#e8c17d')
  sand.addColorStop(0.28, '#f2d493')
  sand.addColorStop(1, '#dcb06c')
  context.fillStyle = sand
  context.fillRect(0, horizon, width, height - horizon)
  if (patterns.sand) {
    context.globalAlpha = 0.85
    context.fillStyle = patterns.sand
    context.fillRect(0, horizon, width, height - horizon)
    context.globalAlpha = 1
  }

  context.save()
  context.clip(createShorelinePath(width, height, time))
  const water = context.createLinearGradient(0, horizon, width * 0.45, height)
  water.addColorStop(0, '#2dbcc4')
  water.addColorStop(0.42, '#0c91aa')
  water.addColorStop(1, '#075c78')
  context.fillStyle = water
  context.fillRect(0, horizon, width * 0.52, height - horizon)
  if (patterns.water) {
    context.globalAlpha = 0.9
    context.fillStyle = patterns.water
    context.fillRect(0, horizon, width * 0.54, height - horizon)
    context.globalAlpha = 1
  }

  context.globalCompositeOperation = 'screen'
  const reflection = context.createRadialGradient(
    sunX,
    horizon + 18,
    3,
    sunX,
    horizon + height * 0.2,
    height * 0.29,
  )
  reflection.addColorStop(0, 'rgba(255, 239, 180, 0.3)')
  reflection.addColorStop(0.35, 'rgba(255, 231, 157, 0.12)')
  reflection.addColorStop(1, 'rgba(255, 231, 157, 0)')
  context.fillStyle = reflection
  context.beginPath()
  context.ellipse(
    sunX,
    horizon + height * 0.17,
    width * 0.075,
    height * 0.26,
    0,
    0,
    Math.PI * 2,
  )
  context.fill()
  context.globalCompositeOperation = 'source-over'

  for (let row = 0; row < 15; row += 1) {
    const y = horizon + 24 + row * 45
    const phase = time * (0.00035 + row * 0.000009) + row * 1.73
    context.strokeStyle =
      row < 4 ? 'rgba(233,255,249,0.46)' : 'rgba(203,249,243,0.28)'
    context.lineWidth = row < 3 ? 1.8 : 1.15
    context.beginPath()
    for (let x = -20; x < width * 0.47; x += 7) {
      const waveY = y + Math.sin(x * 0.035 + phase) * (3.2 + row * 0.13)
      if (x === -20) context.moveTo(x, waveY)
      else context.lineTo(x, waveY)
    }
    context.stroke()
  }
  context.restore()

  for (let band = 0; band < 4; band += 1) {
    context.strokeStyle =
      band === 0
        ? 'rgba(255,255,247,0.96)'
        : `rgba(232,255,248,${0.6 - band * 0.11})`
    context.lineWidth = 8 - band * 1.5
    context.lineCap = 'round'
    context.beginPath()
    const offset = 4 + band * 6 + Math.sin(time * 0.0012 + band) * 3
    for (let y = horizon; y <= height + 7; y += 6) {
      const x = getAnimatedCoastX(y, time, width, height) + offset
      if (y === horizon) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.stroke()
  }
}

export function drawBirds(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
) {
  BIRDS.forEach((bird, index) => {
    const travel = width + 180
    const x = ((time * bird.speed + width * bird.offsetRatio) % travel) - 90
    const y = height * bird.yRatio + Math.sin(time * 0.0007 + index * 2) * 12
    const wingLift = Math.sin(time * 0.006 + index * 1.6) * 6
    drawSeagull(context, x, y, bird.scale, wingLift)
  })
}
