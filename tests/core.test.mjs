import assert from 'node:assert/strict'
import { after, describe, test } from 'node:test'
import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true },
})

after(async () => {
  await vite.close()
})

const { filterEvents, scheduleDays } = await vite.ssrLoadModule(
  '/src/utils/eventFilters.ts',
)
const { dayLabel, duration, formatRange, toDateKey } = await vite.ssrLoadModule(
  '/src/utils/eventFormatters.ts',
)
const { findCrabPath } = await vite.ssrLoadModule(
  '/src/components/beach/pathfinding.ts',
)
const { createCanvasDragLayer } = await vite.ssrLoadModule(
  '/src/components/beach/canvasDragLayer.ts',
)
const { getHorizonY } = await vite.ssrLoadModule(
  '/src/components/beach/beachGeometry.ts',
)

const fridayNoon = Date.parse('2026-02-27T18:00:00Z') / 1000
const fridayOne = Date.parse('2026-02-27T19:00:00Z') / 1000
const saturdayNoon = Date.parse('2026-02-28T18:00:00Z') / 1000

const events = [
  {
    eventId: 'workshop',
    name: 'Build an API',
    description: 'A practical backend workshop.',
    startTime: fridayNoon,
    endTime: fridayOne,
    eventType: 'WORKSHOP',
    locations: [{ description: 'Siebel 1404' }],
    sponsor: 'Acme',
  },
  {
    eventId: 'lunch',
    name: 'Lunch',
    description: 'Food for hackers.',
    startTime: fridayOne,
    endTime: fridayOne + 3600,
    eventType: 'MEAL',
    locations: [{ description: 'Atrium' }],
  },
  {
    eventId: 'speaker',
    name: 'Engineering Talk',
    description: 'A Saturday presentation.',
    startTime: saturdayNoon,
    endTime: saturdayNoon + 3600,
    eventType: 'SPEAKER',
    locations: [{ description: 'Auditorium' }],
  },
]

describe('event filtering', () => {
  test('filters by day and category inclusively', () => {
    const visible = filterEvents(events, {
      day: '2026-02-27',
      category: 'workshop',
      query: '',
    })

    assert.deepEqual(visible.map((event) => event.eventId), ['workshop'])
  })

  test('searches names, descriptions, sponsors, and locations', () => {
    for (const query of ['build', 'backend', 'acme', 'siebel']) {
      const visible = filterEvents(events, {
        day: '2026-02-27',
        category: null,
        query,
      })
      assert.deepEqual(visible.map((event) => event.eventId), ['workshop'])
    }
  })

  test('returns sorted unique schedule days', () => {
    assert.deepEqual(scheduleDays(events), ['2026-02-27', '2026-02-28'])
  })
})

describe('event date formatting', () => {
  test('uses the event timezone for date keys', () => {
    assert.equal(toDateKey(fridayNoon), '2026-02-27')
  })

  test('formats human-readable labels, ranges, and durations', () => {
    assert.deepEqual(dayLabel('2026-02-27'), {
      weekday: 'Friday',
      date: 'Feb 27',
    })
    assert.equal(formatRange(events[0]), '12:00 PM – 1:00 PM')
    assert.equal(duration(events[0]), '1 hr')
  })
})

describe('crab pathfinding', () => {
  test('routes around an obstacle placed on the direct path', () => {
    const start = { x: 0.58, y: 0.48 }
    const destination = { x: 0.9, y: 0.82 }
    const path = findCrabPath(start, destination, 1200, 800, [
      { x: 0.74, y: 0.65, radius: 105 },
    ])

    assert.ok(path.length >= 3)
    const directSlope =
      (destination.y - start.y) / (destination.x - start.x)
    assert.ok(
      path.some((point) => {
        const directY = start.y + (point.x - start.x) * directSlope
        return Math.abs(point.y - directY) > 0.025
      }),
    )
  })
})

describe('canvas drag layer', () => {
  test('moves targets and prevents dragging into the sky', () => {
    const layer = createCanvasDragLayer()
    layer.register({ id: 'chair', x: 500, y: 500, radius: 20 })

    assert.equal(layer.start(500, 500), 'chair')
    assert.equal(layer.move(520, 0, 1000, 800), 'chair')

    const moved = layer.place('chair', 500, 500)
    assert.equal(moved.x, 520)
    assert.equal(moved.y, getHorizonY(800) + 20)
  })

  test('keeps fixed targets selectable as obstacles but not draggable', () => {
    const layer = createCanvasDragLayer()
    layer.register({
      id: 'sandcastle',
      x: 700,
      y: 600,
      radius: 30,
      draggable: false,
    })

    assert.equal(layer.start(700, 600), null)
    assert.deepEqual(layer.getObstacles(1000, 800, 'crab-0'), [
      { x: 0.7, y: 0.75, radius: 66 },
    ])
  })

  test('reports the latest dragged position to pathfinding', () => {
    const layer = createCanvasDragLayer()
    layer.register({ id: 'chair', x: 500, y: 500, radius: 20 })
    layer.start(500, 500)
    layer.move(100, 80, 1000, 800)
    layer.end()

    layer.beginFrame()
    const moved = layer.place('chair', 500, 500)
    layer.register({ id: 'chair', ...moved, radius: 20 })

    assert.deepEqual(layer.getObstacles(1000, 800, 'crab-0'), [
      { x: 0.1, y: 0.37, radius: 56 },
    ])
  })
})
