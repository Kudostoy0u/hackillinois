export function drawUmbrella(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  colors: [string, string],
) {
  context.save()
  context.translate(x, y)
  context.rotate(-0.08)
  context.fillStyle = 'rgba(70, 52, 31, 0.2)'
  context.beginPath()
  context.ellipse(radius * 0.24, radius * 0.34, radius * 1.05, radius * 0.76, -0.08, 0, Math.PI * 2)
  context.fill()

  // The pole begins at the center hub and emerges continuously from beneath
  // the canopy, which keeps the construction readable from overhead.
  context.strokeStyle = '#9a7855'
  context.lineWidth = Math.max(2, radius * 0.055)
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(radius * 0.24, radius * 1.42)
  context.stroke()

  context.save()
  context.scale(1, 0.76)
  for (let segment = 0; segment < 8; segment += 1) {
    const start = -Math.PI / 2 + (segment * Math.PI * 2) / 8
    const end = -Math.PI / 2 + ((segment + 1) * Math.PI * 2) / 8
    context.beginPath()
    context.moveTo(0, 0)
    context.arc(0, 0, radius, start, end)
    context.closePath()
    context.fillStyle = colors[segment % 2]
    context.fill()
    context.strokeStyle = 'rgba(82, 64, 47, 0.2)'
    context.lineWidth = Math.max(0.8, radius * 0.025)
    context.stroke()
  }
  context.strokeStyle = 'rgba(72, 63, 55, 0.42)'
  context.lineWidth = Math.max(1.2, radius * 0.035)
  context.beginPath()
  context.arc(0, 0, radius, 0, Math.PI * 2)
  context.stroke()
  context.restore()

  context.fillStyle = '#f5c26d'
  context.strokeStyle = 'rgba(91, 66, 43, 0.36)'
  context.lineWidth = Math.max(0.8, radius * 0.025)
  context.beginPath()
  context.arc(0, 0, Math.max(2.2, radius * 0.085), 0, Math.PI * 2)
  context.fill()
  context.stroke()
  context.restore()
}

export function drawBeachChair(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
  rotation: number,
) {
  context.save()
  context.translate(x, y)
  context.rotate(rotation)
  context.scale(scale, scale)
  context.fillStyle = 'rgba(69, 49, 31, 0.16)'
  context.beginPath()
  context.ellipse(7, 37, 19, 6, 0.12, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#8d6846'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(-14, -20)
  context.lineTo(-10, 28)
  context.lineTo(15, 37)
  context.moveTo(14, -20)
  context.lineTo(10, 28)
  context.lineTo(-15, 37)
  context.stroke()
  context.fillStyle = color
  context.beginPath()
  context.moveTo(-12, -18)
  context.lineTo(12, -18)
  context.lineTo(9, 25)
  context.lineTo(-9, 25)
  context.closePath()
  context.fill()
  context.strokeStyle = 'rgba(255,255,255,0.7)'
  context.lineWidth = 3
  for (let stripe = -5; stripe <= 12; stripe += 9) {
    context.beginPath()
    context.moveTo(-11, stripe)
    context.lineTo(11, stripe)
    context.stroke()
  }
  context.restore()
}

export function drawSandcastle(context: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  context.save()
  context.translate(x, y)
  context.scale(scale, scale)
  context.fillStyle = 'rgba(83, 58, 31, 0.15)'
  context.beginPath()
  context.ellipse(4, 24, 32, 8, 0, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#c99855'
  context.fillRect(-19, -5, 38, 26)
  ;[-27, 20].forEach((towerX) => {
    context.fillRect(towerX, -1, 10, 24)
    context.fillRect(towerX - 2, -7, 4, 8)
    context.fillRect(towerX + 4, -7, 4, 8)
    context.fillRect(towerX + 10, -7, 4, 8)
  })
  context.fillRect(-19, -13, 7, 10)
  context.fillRect(-4, -13, 8, 10)
  context.fillRect(12, -13, 7, 10)
  context.fillStyle = '#825f3e'
  context.beginPath()
  context.arc(0, 21, 7, Math.PI, 0)
  context.fill()
  context.strokeStyle = '#765338'
  context.lineWidth = 1.4
  context.beginPath()
  context.moveTo(0, -13)
  context.lineTo(0, -39)
  context.stroke()
  context.fillStyle = '#ef6f51'
  context.beginPath()
  context.moveTo(1, -38)
  context.lineTo(17, -32)
  context.lineTo(1, -27)
  context.closePath()
  context.fill()
  context.restore()
}

export function drawTowel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  color: string,
  rotation: number,
) {
  const towelHeight = width * 1.72
  context.save()
  context.translate(x, y)
  context.rotate(rotation)
  context.fillStyle = 'rgba(80, 55, 31, 0.16)'
  context.fillRect(-width / 2 + 4, -towelHeight / 2 + 6, width, towelHeight)
  context.fillStyle = color
  context.fillRect(-width / 2, -towelHeight / 2, width, towelHeight)
  context.fillStyle = 'rgba(255,255,255,0.54)'
  for (let stripe = -towelHeight / 2 + 8; stripe < towelHeight / 2; stripe += 15) {
    context.fillRect(-width / 2, stripe, width, 5)
  }
  context.strokeStyle = 'rgba(255,255,255,0.78)'
  context.lineWidth = 1.2
  for (let fringe = -width / 2 + 3; fringe < width / 2; fringe += 5) {
    context.beginPath()
    context.moveTo(fringe, towelHeight / 2)
    context.lineTo(fringe, towelHeight / 2 + 5)
    context.moveTo(fringe, -towelHeight / 2)
    context.lineTo(fringe, -towelHeight / 2 - 5)
    context.stroke()
  }
  context.restore()
}

export function drawDrink(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color: string,
) {
  context.save()
  context.translate(x, y)
  context.scale(scale, scale)
  context.fillStyle = 'rgba(68, 48, 29, 0.17)'
  context.beginPath()
  context.ellipse(3, 5, 11, 6, 0, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#f7f0dc'
  context.beginPath()
  context.arc(0, 0, 9, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = color
  context.beginPath()
  context.arc(0, 0, 6.5, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = '#ef6f51'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(2, -4)
  context.lineTo(11, -20)
  context.stroke()
  context.fillStyle = '#87b85b'
  context.beginPath()
  context.arc(-6, -5, 5, -0.8, 1.9)
  context.lineTo(-6, -5)
  context.fill()
  context.restore()
}

export function drawCrab(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  rotation: number,
  walkPhase: number,
) {
  context.save()
  context.translate(x, y)
  context.rotate(rotation)
  context.scale(scale, scale)
  context.strokeStyle = '#b84f3f'
  context.lineWidth = 2.2
  context.lineCap = 'round'
  for (const side of [-1, 1]) {
    for (let leg = -1; leg <= 1; leg += 1) {
      const stride = Math.sin(walkPhase + leg * 1.8 + (side > 0 ? 0 : Math.PI)) * 3.5
      context.beginPath()
      context.moveTo(side * 8, leg * 4)
      context.lineTo(side * 15, leg * 7 + stride)
      context.lineTo(side * 20, leg * 7 + side * 2 - stride * 0.5)
      context.stroke()
    }
    context.beginPath()
    context.moveTo(side * 8, -4)
    context.lineTo(side * 18, -12)
    context.stroke()
    context.fillStyle = '#df6a53'
    context.beginPath()
    context.arc(side * 21, -14, 5, 0, Math.PI * 2)
    context.fill()
    context.stroke()
  }
  context.fillStyle = '#d85f4b'
  context.beginPath()
  context.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2)
  context.fill()
  context.stroke()
  context.fillStyle = '#182e34'
  context.beginPath()
  context.arc(-4, -6, 1.4, 0, Math.PI * 2)
  context.arc(4, -6, 1.4, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

export function drawBeachBall(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  context.save()
  context.translate(x, y)
  context.fillStyle = 'rgba(67, 48, 30, 0.16)'
  context.beginPath()
  context.ellipse(5, radius * 0.78, radius * 0.9, radius * 0.28, 0, 0, Math.PI * 2)
  context.fill()
  const colors = ['#ef6f51', '#f6d05d', '#2c9eb2', '#fff4d8']
  for (let slice = 0; slice < 4; slice += 1) {
    context.fillStyle = colors[slice]
    context.beginPath()
    context.moveTo(0, 0)
    context.arc(0, 0, radius, (slice * Math.PI) / 2, ((slice + 1) * Math.PI) / 2)
    context.closePath()
    context.fill()
  }
  context.strokeStyle = 'rgba(74,69,55,0.3)'
  context.lineWidth = 1
  context.beginPath()
  context.arc(0, 0, radius, 0, Math.PI * 2)
  context.stroke()
  context.fillStyle = '#fff8e7'
  context.beginPath()
  context.arc(0, 0, radius * 0.2, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

export function drawSeagull(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  wingLift: number,
) {
  context.save()
  context.translate(x, y)
  context.scale(scale, scale)
  context.lineJoin = 'round'

  context.fillStyle = 'rgba(30, 69, 77, 0.13)'
  context.beginPath()
  context.ellipse(2, 8, 29, 5, 0, 0, Math.PI * 2)
  context.fill()

  context.fillStyle = '#f8fbf7'
  context.strokeStyle = '#647b80'
  context.lineWidth = 1.4
  context.beginPath()
  context.moveTo(-2, 2)
  context.bezierCurveTo(-14, -2, -26, -15 - wingLift, -43, -10 - wingLift * 0.7)
  context.bezierCurveTo(-30, -1, -19, 5, -5, 8)
  context.closePath()
  context.fill()
  context.stroke()

  context.beginPath()
  context.moveTo(3, 2)
  context.bezierCurveTo(15, -3, 28, -14 - wingLift, 44, -7 - wingLift * 0.7)
  context.bezierCurveTo(31, 0, 19, 6, 5, 8)
  context.closePath()
  context.fill()
  context.stroke()

  context.beginPath()
  context.ellipse(2, 4, 12, 6, 0, 0, Math.PI * 2)
  context.fill()
  context.stroke()
  context.beginPath()
  context.arc(12, 1, 5.5, 0, Math.PI * 2)
  context.fill()
  context.stroke()

  context.fillStyle = '#e8a044'
  context.beginPath()
  context.moveTo(17, 0)
  context.lineTo(25, 2.5)
  context.lineTo(17, 4)
  context.closePath()
  context.fill()
  context.fillStyle = '#173a45'
  context.beginPath()
  context.arc(13.6, -0.4, 1, 0, Math.PI * 2)
  context.fill()
  context.restore()
}
