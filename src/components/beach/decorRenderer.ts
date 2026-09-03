import type { CanvasDragLayer } from './canvasDragLayer'
import {
  drawBeachBall,
  drawBeachChair,
  drawDrink,
  drawSandcastle,
  drawTowel,
  drawUmbrella,
} from './drawing'
import { BEACH_BALLS, BEACH_SETUPS, DRINKS, SANDCASTLES, TOWELS } from './sceneLayout'

const CHAIR_COLORS = ['#53a7ba', '#e77a61', '#f1c45c']

export function drawBeachDecor(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  dragLayer: CanvasDragLayer,
) {
  BEACH_SETUPS.forEach((setup, setupIndex) => {
    const umbrellaId = `umbrella-${setupIndex}`
    const umbrella = dragLayer.place(umbrellaId, width * setup.x, height * setup.y)
    drawUmbrella(
      context,
      umbrella.x,
      umbrella.y,
      setup.radius,
      [setup.canopy.primary, setup.canopy.secondary],
    )
    dragLayer.register({
      id: umbrellaId,
      ...umbrella,
      radius: setup.radius * 1.15,
    })

    for (let chairIndex = 0; chairIndex < setup.chairs; chairIndex += 1) {
      const side = chairIndex % 2 ? -1 : 1
      const chairId = `chair-${setupIndex}-${chairIndex}`
      const chair = dragLayer.place(
        chairId,
        width * setup.x +
          side * setup.radius * (1.05 + Math.floor(chairIndex / 2) * 0.7),
        height * setup.y + setup.radius * (1.22 + chairIndex * 0.24),
      )
      drawBeachChair(
        context,
        chair.x,
        chair.y,
        setup.radius / 32,
        CHAIR_COLORS[chairIndex % CHAIR_COLORS.length],
        side * (0.18 + chairIndex * 0.08),
      )
      dragLayer.register({
        id: chairId,
        ...chair,
        radius: Math.max(15, setup.radius * 0.72),
      })
    }
  })

  TOWELS.forEach((towel, index) => {
    const id = `towel-${index}`
    const position = dragLayer.place(id, width * towel.x, height * towel.y)
    drawTowel(
      context,
      position.x,
      position.y,
      towel.width,
      towel.color,
      towel.rotation,
    )
    dragLayer.register({ id, ...position, radius: towel.width * 0.92 })
  })

  DRINKS.forEach((drink, index) => {
    const id = `drink-${index}`
    const position = dragLayer.place(id, width * drink.x, height * drink.y)
    drawDrink(context, position.x, position.y, drink.scale, drink.color)
    dragLayer.register({
      id,
      ...position,
      radius: Math.max(9, drink.scale * 13),
    })
  })

  BEACH_BALLS.forEach((ball, index) => {
    const id = `ball-${index}`
    const position = dragLayer.place(id, width * ball.x, height * ball.y)
    drawBeachBall(context, position.x, position.y, ball.radius)
    dragLayer.register({ id, ...position, radius: ball.radius * 1.15 })
  })

  SANDCASTLES.forEach((castle, index) => {
    const id = `sandcastle-${index}`
    const position = dragLayer.place(id, width * castle.x, height * castle.y)
    drawSandcastle(context, position.x, position.y, castle.scale)
    dragLayer.register({
      id,
      ...position,
      radius: castle.scale * 34,
      draggable: false,
    })
  })
}
