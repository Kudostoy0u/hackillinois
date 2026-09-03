import { AnimatePresence, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiExternalLink,
  FiMapPin,
  FiSearch,
  FiStar,
  FiX,
} from 'react-icons/fi'
import { GiNautilusShell, GiOpeningShell, GiSpiralShell, GiTripleShells } from 'react-icons/gi'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'

const API_URL = '/api/adonix'
const LOGO_URL =
  'https://2022.hackillinois.org/static/media/logo.340b1373.svg'
const EVENT_TIME_ZONE = 'America/Chicago'

type Location = {
  description: string
  latitude?: number
  longitude?: number
}

type Event = {
  eventId: string
  name: string
  description: string
  startTime: number
  endTime: number
  eventType: string
  locations: Location[]
  sponsor?: string
  points?: number
  isAsync?: boolean
}

type Category = 'main' | 'workshop' | 'speaker' | 'activity' | 'food'

const categories: Array<{ id: Category; label: string; color: string }> = [
  { id: 'main', label: 'Main events', color: '#ef6f51' },
  { id: 'workshop', label: 'Workshops', color: '#725ac1' },
  { id: 'speaker', label: 'Talks & Q&A', color: '#e9a23b' },
  { id: 'activity', label: 'Activities', color: '#34a88a' },
  { id: 'food', label: 'Food', color: '#e05680' },
]

const categoryMap = new Map(categories.map((category) => [category.id, category]))

const FALLBACK_EVENTS: Event[] = [
  {
    eventId: 'fallback-checkin',
    name: 'Attendee Check-In',
    description:
      'Check in, pick up your badge, and get ready for a weekend of building.',
    startTime: 1772222400,
    endTime: 1772233200,
    eventType: 'OTHER',
    locations: [{ description: 'Siebel CS 1st Floor Lobby' }],
  },
  {
    eventId: 'fallback-opening',
    name: 'Opening Ceremony',
    description: 'Welcome to HackIllinois! Meet the team and begin the weekend.',
    startTime: 1772233200,
    endTime: 1772236800,
    eventType: 'OTHER',
    locations: [{ description: 'Siebel CS 1404' }],
  },
  {
    eventId: 'fallback-team',
    name: 'Team Matching',
    description: 'Find your crew, pick a track, and start building together.',
    startTime: 1772245800,
    endTime: 1772249400,
    eventType: 'WORKSHOP',
    locations: [{ description: 'Siebel CS 0218' }],
  },
  {
    eventId: 'fallback-breakfast',
    name: 'Breakfast',
    description: 'Fuel up for a full day of hacking.',
    startTime: 1772285400,
    endTime: 1772289000,
    eventType: 'MEAL',
    locations: [{ description: 'Siebel CS 2nd Floor Atrium' }],
  },
  {
    eventId: 'fallback-showcase',
    name: 'Project Showcase',
    description: 'Share what you built and celebrate the weekend with the community.',
    startTime: 1772377200,
    endTime: 1772386200,
    eventType: 'OTHER',
    locations: [{ description: 'Siebel Center for Computer Science' }],
  },
  {
    eventId: 'fallback-closing',
    name: 'Closing Ceremonies',
    description: 'One last gathering to celebrate the hackers and winning projects.',
    startTime: 1772396100,
    endTime: 1772399700,
    eventType: 'OTHER',
    locations: [{ description: 'Siebel CS 1404' }],
  },
]

function eventCategory(type: string): Category {
  if (type === 'MEAL') return 'food'
  if (type === 'WORKSHOP') return 'workshop'
  if (type === 'SPEAKER' || type === 'QNA') return 'speaker'
  if (type === 'MINIEVENT' || type === 'SIDEQUEST') return 'activity'
  return 'main'
}

function toDateKey(timestamp: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp * 1000))
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

function dayLabel(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 12))
  return {
    weekday: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: 'UTC',
    }).format(date),
    date: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(date),
  }
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: EVENT_TIME_ZONE,
  }).format(new Date(timestamp * 1000))
}

function formatRange(event: Event) {
  if (event.startTime === event.endTime) return formatTime(event.startTime)
  return `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
}

function duration(event: Event) {
  const minutes = Math.max(0, Math.round((event.endTime - event.startTime) / 60))
  if (!minutes) return 'Deadline'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`
}

function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [status, setStatus] = useState<'loading' | 'live' | 'cached'>('loading')

  const load = async (signal?: AbortSignal) => {
    setStatus('loading')
    try {
      const response = await fetch(API_URL, { signal })
      if (!response.ok) throw new Error(`Events request failed: ${response.status}`)
      const payload = (await response.json()) as { events?: Event[] }
      if (!Array.isArray(payload.events) || !payload.events.length) {
        throw new Error('No events returned')
      }
      setEvents(payload.events.sort((a, b) => a.startTime - b.startTime))
      setStatus('live')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setEvents(FALLBACK_EVENTS)
      setStatus('cached')
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    // The request resolves asynchronously; cleanup still cancels it on unmount.
    // oxlint-disable-next-line react/set-state-in-effect
    void load(controller.signal)
    return () => controller.abort()
  }, [])

  return { events, status }
}

function Header() {
  const location = useLocation()
  const scheduleActive = location.pathname === '/'

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="HackIllinois schedule home">
          <img src={LOGO_URL} alt="HackIllinois" />
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link className={scheduleActive ? 'active' : ''} to="/">
            Schedule
          </Link>
          <a href="https://2025.hackillinois.org/mentors">Mentors</a>
          <a href="https://2025.hackillinois.org/prizes">Prizes</a>
          <NavLink to="/credits">Credits</NavLink>
        </nav>
      </div>
    </header>
  )
}

type Ripple = { id: number; x: number; y: number; kind: 'water' | 'sand'; depth: number }

function beachProgress(normalizedY: number) {
  return Math.max(0, Math.min(1, (normalizedY - 0.345) / 0.655))
}

function beachDepthScale(normalizedY: number) {
  return 0.28 + Math.sqrt(beachProgress(normalizedY)) * 0.78
}

function beachShoreX(normalizedY: number) {
  return 0.455 + beachProgress(normalizedY) * 0.025
}

function beachDecorX(normalizedX: number, normalizedY: number) {
  const progress = beachProgress(normalizedY)
  const shoreline = beachShoreX(normalizedY)
  const inlandSpread = 0.61 + progress * 0.39
  return Math.max(shoreline + 0.035, shoreline + (normalizedX - shoreline) * inlandSpread)
}

function drawUmbrella(
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

function drawBeachChair(
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

function drawSandcastle(context: CanvasRenderingContext2D, x: number, y: number, scale: number) {
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

function drawPebbles(context: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  const colors = ['#9a876f', '#d9c4a2', '#768887', '#b9795b', '#eee1c3']
  context.save()
  context.translate(x, y)
  context.scale(scale, scale)
  for (let index = 0; index < 13; index += 1) {
    const angle = index * 2.37
    const distance = 5 + (index % 5) * 6
    context.fillStyle = colors[index % colors.length]
    context.beginPath()
    context.ellipse(
      Math.cos(angle) * distance,
      Math.sin(angle) * distance * 0.55,
      2.5 + (index % 3),
      1.8 + ((index + 1) % 3),
      angle,
      0,
      Math.PI * 2,
    )
    context.fill()
  }
  context.stroke()
  context.restore()
}

function drawTowel(
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

function drawDrink(
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

function drawCrab(
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

function drawBeachBall(context: CanvasRenderingContext2D, x: number, y: number, radius: number) {
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

type CrabPoint = { x: number; y: number }
type CrabObstacle = CrabPoint & { radius: number }

function findCrabPath(
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
    const safeCoast = beachShoreX(point.y) + 0.027
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

function drawSeagull(
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

function OceanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    let frameId = 0
    let width = 0
    let height = 0
    let pixelRatio = 1
    let sandPattern: CanvasPattern | null = null
    let waterPattern: CanvasPattern | null = null
    let lastCrabTime = 0

    type CrabAgent = {
      x: number
      y: number
      scale: number
      speed: number
      heading: number
      walkPhase: number
      path: CrabPoint[]
      waypoint: number
      destinationCursor: number
      pauseUntil: number
      gait: 'forward' | 'sideways'
    }

    const crabAgents: CrabAgent[] = [
      { x: beachDecorX(0.9, 0.51), y: 0.51, scale: 0.76, speed: 22, heading: -0.15, walkPhase: 1.2, path: [], waypoint: 0, destinationCursor: 1, pauseUntil: 300, gait: 'forward' },
      { x: beachDecorX(0.9, 0.86), y: 0.86, scale: 0.78, speed: 20, heading: -0.25, walkPhase: 3.2, path: [], waypoint: 0, destinationCursor: 0, pauseUntil: 900, gait: 'sideways' },
    ]

    const crabDestinationLayout: CrabPoint[][] = [
      [{ x: 0.8, y: 0.46 }, { x: 0.96, y: 0.49 }, { x: 0.91, y: 0.59 }, { x: 0.78, y: 0.61 }],
      [{ x: 0.78, y: 0.76 }, { x: 0.96, y: 0.79 }, { x: 0.91, y: 0.93 }, { x: 0.75, y: 0.91 }],
    ]
    const crabDestinations = crabDestinationLayout.map((territory) =>
      territory.map((point) => ({ ...point, x: beachDecorX(point.x, point.y) })),
    )

    const crabObstacleLayout: CrabObstacle[] = [
      // Umbrellas and their chair groupings.
      { x: 0.51, y: 0.43, radius: 36 },
      { x: 0.62, y: 0.405, radius: 22 },
      { x: 0.93, y: 0.49, radius: 68 },
      { x: 0.79, y: 0.7, radius: 65 },
      { x: 0.55, y: 0.57, radius: 38 },
      { x: 0.965, y: 0.83, radius: 70 },
      { x: 0.67, y: 0.9, radius: 42 },
      { x: 0.88, y: 0.94, radius: 50 },
      { x: 0.72, y: 0.48, radius: 44 },
      { x: 0.985, y: 0.61, radius: 34 },
      { x: 0.6, y: 0.76, radius: 48 },
      { x: 0.965, y: 0.395, radius: 42 },
      // Towels, castles, balls, and drink clusters.
      { x: 0.955, y: 0.44, radius: 30 },
      { x: 0.875, y: 0.54, radius: 34 },
      { x: 0.98, y: 0.56, radius: 27 },
      { x: 0.735, y: 0.61, radius: 32 },
      { x: 0.91, y: 0.68, radius: 31 },
      { x: 0.62, y: 0.69, radius: 29 },
      { x: 0.965, y: 0.75, radius: 32 },
      { x: 0.82, y: 0.87, radius: 32 },
      { x: 0.94, y: 0.93, radius: 28 },
      { x: 0.56, y: 0.95, radius: 25 },
      { x: 0.49, y: 0.5, radius: 20 },
      { x: 0.59, y: 0.43, radius: 18 },
      { x: 0.55, y: 0.39, radius: 12 },
      { x: 0.57, y: 0.52, radius: 14 },
      { x: 0.47, y: 0.59, radius: 23 },
      { x: 0.86, y: 0.8, radius: 43 },
      { x: 0.51, y: 0.91, radius: 31 },
      { x: 0.96, y: 0.7, radius: 28 },
      { x: 0.94, y: 0.59, radius: 18 },
      { x: 0.73, y: 0.85, radius: 16 },
    ]
    const crabObstacles = [
      ...crabObstacleLayout.map((obstacle) => ({
        ...obstacle,
        x: beachDecorX(obstacle.x, obstacle.y),
      })),
      // Sparse setups beyond the main decor band still participate in routing.
      { x: 0.875, y: 0.405, radius: 32 },
      { x: 0.945, y: 0.465, radius: 19 },
      { x: 0.82, y: 0.52, radius: 24 },
      { x: 0.86, y: 0.58, radius: 18 },
      { x: 0.94, y: 0.62, radius: 29 },
      { x: 0.91, y: 0.69, radius: 25 },
      { x: 0.96, y: 0.78, radius: 18 },
    ]

    type BeachDragTarget = {
      id: string
      x: number
      y: number
      radius: number
      crabIndex?: number
    }
    type ActiveBeachDrag = BeachDragTarget & {
      pointerId: number
      pointerX: number
      pointerY: number
      startOffsetX: number
      startOffsetY: number
      startCrabX: number
      startCrabY: number
    }
    const dragOffsets = new Map<string, { x: number; y: number }>()
    let dragTargets: BeachDragTarget[] = []
    let activeBeachDrag: ActiveBeachDrag | null = null

    const makeTexture = (kind: 'sand' | 'water') => {
      const texture = document.createElement('canvas')
      texture.width = 220
      texture.height = 220
      const textureContext = texture.getContext('2d')!
      textureContext.clearRect(0, 0, 220, 220)
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
        textureContext.ellipse(x, y, size, kind === 'sand' ? size * 0.5 : 0.75, random(), 0, Math.PI * 2)
        textureContext.fill()
      }
      return context.createPattern(texture, 'repeat')
    }

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      sandPattern = makeTexture('sand')
      waterPattern = makeTexture('water')
    }

    const coastX = (y: number, time: number) => {
      const horizon = height * 0.345
      const progress = Math.max(0, (y - horizon) / Math.max(1, height - horizon))
      const sweep = width * (beachShoreX(y / height) + Math.sin(progress * Math.PI) * 0.009)
      return (
        sweep +
        Math.sin(y * 0.027 + time * 0.00055) * 13 +
        Math.sin(y * 0.011 - time * 0.00032) * 17 +
        Math.sin(y * 0.071 + 1.4) * 5
      )
    }

    const depthScale = beachDepthScale

    const uprightAngle = (angle: number) => {
      let normalized = Math.atan2(Math.sin(angle), Math.cos(angle))
      if (normalized > Math.PI / 2) normalized -= Math.PI
      if (normalized < -Math.PI / 2) normalized += Math.PI
      return Math.max(-1.38, Math.min(1.38, normalized))
    }

    const shorelinePath = (time: number, offset = 0) => {
      const horizon = height * 0.345
      const path = new Path2D()
      path.moveTo(0, horizon)
      path.lineTo(coastX(horizon, time) + offset, horizon)
      for (let y = horizon; y <= height + 12; y += 7) path.lineTo(coastX(y, time) + offset, y)
      path.lineTo(0, height + 12)
      path.closePath()
      return path
    }

    const draw = (time: number) => {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)
      dragTargets = []
      const horizon = height * 0.345
      const populationShift = height * 0.028
      const draggablePoint = (
        id: string,
        baseX: number,
        baseY: number,
        radius: number,
        hitShiftY = 0,
      ) => {
        const offset = dragOffsets.get(id) ?? { x: 0, y: 0 }
        const point = { x: baseX + offset.x, y: baseY + offset.y }
        dragTargets.push({
          id,
          x: point.x,
          y: point.y + hitShiftY,
          radius: Math.max(11, radius),
        })
        return point
      }
      const draggableUmbrella = (
        id: string,
        x: number,
        y: number,
        radius: number,
        colors: [string, string],
        hitShiftY = 0,
      ) => {
        const point = draggablePoint(id, x, y, radius * 1.12, hitShiftY)
        drawUmbrella(context, point.x, point.y, radius, colors)
        return point
      }
      const draggableTowel = (
        id: string,
        x: number,
        y: number,
        towelWidth: number,
        color: string,
        rotation: number,
        hitShiftY = 0,
      ) => {
        const point = draggablePoint(id, x, y, towelWidth, hitShiftY)
        drawTowel(context, point.x, point.y, towelWidth, color, rotation)
      }
      const draggableDrink = (
        id: string,
        x: number,
        y: number,
        scale: number,
        color: string,
        hitShiftY = 0,
      ) => {
        const point = draggablePoint(id, x, y, 14 * scale, hitShiftY)
        drawDrink(context, point.x, point.y, scale, color)
      }
      const draggablePebbles = (
        id: string,
        x: number,
        y: number,
        scale: number,
        hitShiftY = 0,
      ) => {
        const point = draggablePoint(id, x, y, 29 * scale, hitShiftY)
        drawPebbles(context, point.x, point.y, scale)
      }
      const draggableBall = (
        id: string,
        x: number,
        y: number,
        radius: number,
        hitShiftY = 0,
      ) => {
        const point = draggablePoint(id, x, y, radius, hitShiftY)
        drawBeachBall(context, point.x, point.y, radius)
      }

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
      if (sandPattern) {
        context.globalAlpha = 0.85
        context.fillStyle = sandPattern
        context.fillRect(0, horizon, width, height - horizon)
        context.globalAlpha = 1
      }

      context.save()
      context.clip(shorelinePath(time))
      const water = context.createLinearGradient(0, horizon, width * 0.45, height)
      water.addColorStop(0, '#2dbcc4')
      water.addColorStop(0.42, '#0c91aa')
      water.addColorStop(1, '#075c78')
      context.fillStyle = water
      context.fillRect(0, horizon, width * 0.58, height - horizon)
      if (waterPattern) {
        context.globalAlpha = 0.9
        context.fillStyle = waterPattern
        context.fillRect(0, horizon, width * 0.58, height - horizon)
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
      context.ellipse(sunX, horizon + height * 0.17, width * 0.075, height * 0.26, 0, 0, Math.PI * 2)
      context.fill()
      context.globalCompositeOperation = 'source-over'

      const oceanLineCount = 24
      for (let row = 0; row < oceanLineCount; row += 1) {
        const depth = row / (oceanLineCount - 1)
        const y = horizon + 9 + Math.pow(depth, 1.72) * (height - horizon - 2)
        const phase = time * (0.00031 + depth * 0.00014) + row * 1.37
        context.strokeStyle = `rgba(220, 255, 248, ${0.2 + depth * 0.15})`
        context.lineWidth = 0.55 + depth * 1.25
        context.beginPath()
        for (let x = -20; x < width * 0.52; x += 7) {
          const frequency = 0.068 - depth * 0.034
          const waveY = y + Math.sin(x * frequency + phase) * (0.7 + depth * 4.7)
          if (x === -20) context.moveTo(x, waveY)
          else context.lineTo(x, waveY)
        }
        context.stroke()
      }
      context.restore()

      for (let band = 0; band < 4; band += 1) {
        context.strokeStyle = band === 0 ? 'rgba(255,255,247,0.96)' : `rgba(232,255,248,${0.6 - band * 0.11})`
        context.lineWidth = 8 - band * 1.5
        context.lineCap = 'round'
        context.beginPath()
        const offset = 4 + band * 6 + Math.sin(time * 0.0012 + band) * 3
        for (let y = horizon; y <= height + 7; y += 6) {
          const x = coastX(y, time) + offset
          if (y === horizon) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        context.stroke()
      }

      // A horizon row establishes the depth before the denser foreground
      // population begins. These intentionally approach miniature scale.
      draggableUmbrella(
        'horizon-umbrella-1',
        width * beachDecorX(0.56, 0.358),
        height * 0.358,
        15 * depthScale(0.358),
        ['#e16f68', '#fff1d5'],
      )
      draggableTowel(
        'horizon-towel-1',
        width * beachDecorX(0.64, 0.365),
        height * 0.365,
        15 * depthScale(0.365),
        '#4f9fb3',
        0.16,
      )
      draggableDrink(
        'horizon-drink-1',
        width * beachDecorX(0.71, 0.372),
        height * 0.372,
        0.48 * depthScale(0.372),
        '#e7a544',
      )
      draggableUmbrella(
        'horizon-umbrella-2',
        width * beachDecorX(0.79, 0.38),
        height * 0.38,
        13 * depthScale(0.38),
        ['#4ba58e', '#fff3d7'],
      )
      draggablePebbles(
        'horizon-pebbles-1',
        width * beachDecorX(0.86, 0.365),
        height * 0.365,
        0.38 * depthScale(0.365),
      )
      drawSandcastle(
        context,
        width * beachDecorX(0.91, 0.385),
        height * 0.385,
        0.34 * depthScale(0.385),
      )
      draggableBall(
        'horizon-ball-1',
        width * 0.965,
        height * 0.375,
        6 * depthScale(0.375),
      )
      draggableTowel(
        'horizon-towel-2',
        width * beachDecorX(0.5, 0.382),
        height * 0.382,
        13 * depthScale(0.382),
        '#e58a66',
        -0.2,
      )
      draggablePebbles(
        'horizon-pebbles-2',
        width * beachDecorX(0.61, 0.35),
        height * 0.35,
        0.32 * depthScale(0.35),
      )
      draggableBall(
        'horizon-ball-2',
        width * beachDecorX(0.75, 0.354),
        height * 0.354,
        5 * depthScale(0.354),
      )
      draggableDrink(
        'horizon-drink-2',
        width * beachDecorX(0.84, 0.398),
        height * 0.398,
        0.42 * depthScale(0.398),
        '#dd7180',
      )
      draggableTowel(
        'horizon-towel-3',
        width * 0.92,
        height * 0.405,
        13 * depthScale(0.405),
        '#6eaab5',
        0.12,
      )
      draggablePebbles(
        'horizon-pebbles-3',
        width * 0.98,
        height * 0.35,
        0.3 * depthScale(0.35),
      )
      draggableUmbrella(
        'horizon-umbrella-3',
        width * beachDecorX(0.68, 0.397),
        height * 0.397,
        12 * depthScale(0.397),
        ['#6d84be', '#fff0d2'],
      )
      draggableDrink(
        'horizon-drink-3',
        width * beachDecorX(0.59, 0.405),
        height * 0.405,
        0.4 * depthScale(0.405),
        '#56a98d',
      )

      context.save()
      context.translate(0, height * 0.028)

      const beachSets = [
        { x: 0.51, y: 0.43, radius: 22, chairs: 1, colors: ['#2f9a83', '#fff0cb'] as [string, string] },
        { x: 0.62, y: 0.405, radius: 18, chairs: 0, colors: ['#d4617f', '#fff4d8'] as [string, string] },
        { x: 0.93, y: 0.49, radius: 35, chairs: 3, colors: ['#ef6f51', '#fff3d5'] as [string, string] },
        { x: 0.79, y: 0.7, radius: 31, chairs: 1, colors: ['#167f9a', '#f8e8bd'] as [string, string] },
        { x: 0.55, y: 0.57, radius: 23, chairs: 0, colors: ['#e4a442', '#fff5dc'] as [string, string] },
        { x: 0.965, y: 0.83, radius: 27, chairs: 2, colors: ['#725ac1', '#f7e7cc'] as [string, string] },
        { x: 0.67, y: 0.9, radius: 26, chairs: 0, colors: ['#e05680', '#fff1d1'] as [string, string] },
        { x: 0.88, y: 0.94, radius: 21, chairs: 1, colors: ['#37a88a', '#f8ecc9'] as [string, string] },
        { x: 0.72, y: 0.48, radius: 20, chairs: 2, colors: ['#de7b43', '#fff5dc'] as [string, string] },
        { x: 0.985, y: 0.61, radius: 20, chairs: 0, colors: ['#2387a4', '#fff1d6'] as [string, string] },
        { x: 0.6, y: 0.76, radius: 18, chairs: 1, colors: ['#8167c7', '#f8e8c8'] as [string, string] },
        { x: 0.965, y: 0.395, radius: 24, chairs: 2, colors: ['#e66c64', '#fff3d9'] as [string, string] },
      ]
      beachSets.forEach((set, setIndex) => {
        const umbrellaX = width * beachDecorX(set.x, set.y)
        const umbrellaY = height * set.y
        const perspective = depthScale(set.y)
        const renderedRadius = set.radius * perspective
        draggableUmbrella(
          `umbrella-${setIndex}`,
          umbrellaX,
          umbrellaY,
          renderedRadius,
          set.colors,
          populationShift,
        )
        for (let chair = 0; chair < set.chairs; chair += 1) {
          const side = chair % 2 ? -1 : 1
          const chairScale = (set.radius / 32) * perspective
          const chairPoint = draggablePoint(
            `chair-${setIndex}-${chair}`,
            umbrellaX + side * renderedRadius * (1.05 + Math.floor(chair / 2) * 0.7),
            umbrellaY + renderedRadius * (1.22 + chair * 0.24),
            28 * chairScale,
            populationShift,
          )
          drawBeachChair(
            context,
            chairPoint.x,
            chairPoint.y,
            chairScale,
            ['#53a7ba', '#e77a61', '#f1c45c'][chair % 3],
            side * (0.18 + chair * 0.08),
          )
        }
      })

      // A few distant, deliberately sparse setups sit beyond the main
      // shoreline-following band.
      const remoteUmbrellaY = 0.405
      const remotePerspective = depthScale(remoteUmbrellaY)
      const remoteRadius = 17 * remotePerspective
      draggableUmbrella(
        'remote-umbrella-1',
        width * 0.875,
        height * remoteUmbrellaY,
        remoteRadius,
        ['#e6a53e', '#fff3d5'],
        populationShift,
      )
      const remoteChairPoint = draggablePoint(
        'remote-chair-1',
        width * 0.875 + remoteRadius * 1.25,
        height * remoteUmbrellaY + remoteRadius * 1.3,
        13 * remotePerspective,
        populationShift,
      )
      drawBeachChair(
        context,
        remoteChairPoint.x,
        remoteChairPoint.y,
        0.45 * remotePerspective,
        '#4d9cb0',
        0.22,
      )
      draggableTowel('remote-towel-1', width * 0.945, height * 0.465, 15 * depthScale(0.465), '#d8758c', -0.2, populationShift)
      draggableDrink('remote-drink-1', width * 0.91, height * 0.48, 0.58 * depthScale(0.48), '#eaa957', populationShift)
      draggableTowel('remote-towel-2', width * 0.82, height * 0.52, 18 * depthScale(0.52), '#4f9eb5', 0.16, populationShift)
      draggablePebbles('remote-pebbles-1', width * 0.9, height * 0.55, 0.48 * depthScale(0.55), populationShift)
      draggableBall('remote-ball-1', width * 0.86, height * 0.58, 8 * depthScale(0.58), populationShift)
      drawSandcastle(context, width * 0.94, height * 0.62, 0.45 * depthScale(0.62))
      draggableDrink('remote-drink-2', width * 0.79, height * 0.64, 0.56 * depthScale(0.64), '#62aea9', populationShift)
      draggableTowel('remote-towel-3', width * 0.91, height * 0.69, 19 * depthScale(0.69), '#e7ad4c', -0.13, populationShift)
      draggablePebbles('remote-pebbles-2', width * 0.84, height * 0.73, 0.58 * depthScale(0.73), populationShift)
      draggableBall('remote-ball-2', width * 0.96, height * 0.78, 8 * depthScale(0.78), populationShift)

      const towels = [
        [0.49, 0.5, 18, '#4ca4b2', 0.24],
        [0.59, 0.43, 17, '#ea7b62', -0.18],
        [0.955, 0.44, 24, '#e87972', -0.22],
        [0.875, 0.54, 28, '#55a6b8', 0.31],
        [0.98, 0.56, 20, '#e4ad4f', -0.15],
        [0.735, 0.61, 25, '#8b70c9', 0.18],
        [0.91, 0.68, 23, '#46aa8d', -0.34],
        [0.62, 0.69, 21, '#ea7e65', 0.26],
        [0.965, 0.75, 26, '#3d9db6', 0.14],
        [0.82, 0.87, 24, '#d9688e', -0.28],
        [0.94, 0.93, 20, '#e3a643', 0.22],
        [0.56, 0.95, 18, '#3c9a84', -0.17],
      ] as const
      towels.forEach(([x, y, towelWidth, color, rotation], towelIndex) => {
        draggableTowel(
          `towel-${towelIndex}`,
          width * beachDecorX(x, y),
          height * y,
          towelWidth * depthScale(y),
          color,
          rotation,
          populationShift,
        )
      })

      const drinks = [
        [0.55, 0.39, 0.7, '#e9a64f'],
        [0.925, 0.43, 0.9, '#eaa957'],
        [0.89, 0.58, 0.8, '#e97876'],
        [0.975, 0.67, 0.72, '#6db5aa'],
        [0.77, 0.76, 0.82, '#efbd52'],
        [0.95, 0.9, 0.68, '#dc7688'],
        [0.64, 0.86, 0.7, '#75b7c2'],
      ] as const
      drinks.forEach(([x, y, scale, color], drinkIndex) =>
        draggableDrink(
          `drink-${drinkIndex}`,
          width * beachDecorX(x, y),
          height * y,
          scale * depthScale(y),
          color,
          populationShift,
        ),
      )

      const crabDelta = lastCrabTime ? Math.min(0.04, (time - lastCrabTime) / 1000) : 0
      lastCrabTime = time
      crabAgents.forEach((crab, crabIndex) => {
        const crabId = `crab-${crabIndex}`
        if (!prefersReducedMotion && time >= crab.pauseUntil && activeBeachDrag?.id !== crabId) {
          if (!crab.path.length || crab.waypoint >= crab.path.length) {
            const territory = crabDestinations[crabIndex]
            const destination = territory[crab.destinationCursor % territory.length]
            crab.gait = (crab.destinationCursor + crabIndex) % 3 === 1 ? 'forward' : 'sideways'
            crab.destinationCursor += 1
            crab.path = findCrabPath(crab, destination, width, height, crabObstacles)
            crab.waypoint = crab.path.length > 1 ? 1 : 0
            if (crab.path.length < 2) crab.pauseUntil = time + 900
          }

          const waypoint = crab.path[crab.waypoint]
          if (waypoint) {
            const deltaX = (waypoint.x - crab.x) * width
            const deltaY = (waypoint.y - crab.y) * height
            const distance = Math.hypot(deltaX, deltaY)
            if (distance < 4) {
              crab.x = waypoint.x
              crab.y = waypoint.y
              crab.waypoint += 1
              if (crab.waypoint >= crab.path.length) {
                crab.path = []
                crab.pauseUntil = time + 650 + crabIndex * 240
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
              crab.heading += turn * Math.min(1, crabDelta * 5.5)
              const step = Math.min(distance, crab.speed * crabDelta)
              crab.x += (deltaX / distance / width) * step
              crab.y += (deltaY / distance / height) * step
              crab.walkPhase += step * 0.28
            }
          }
        }
        const renderedCrabScale = crab.scale * depthScale(crab.y)
        drawCrab(
          context,
          crab.x * width,
          crab.y * height,
          renderedCrabScale,
          crab.heading,
          crab.walkPhase,
        )
        dragTargets.push({
          id: crabId,
          x: crab.x * width,
          y: crab.y * height + populationShift,
          radius: Math.max(12, 22 * renderedCrabScale),
          crabIndex,
        })
      })
      draggableBall('ball-1', width * beachDecorX(0.57, 0.52), height * 0.52, 9 * depthScale(0.52), populationShift)
      draggableBall('ball-2', width * beachDecorX(0.94, 0.59), height * 0.59, 11 * depthScale(0.59), populationShift)
      draggableBall('ball-3', width * beachDecorX(0.73, 0.85), height * 0.85, 9 * depthScale(0.85), populationShift)
      drawSandcastle(context, width * beachDecorX(0.47, 0.59), height * 0.59, 0.52 * depthScale(0.59))
      drawSandcastle(context, width * beachDecorX(0.86, 0.8), height * 0.8, 0.82 * depthScale(0.8))
      drawSandcastle(context, width * beachDecorX(0.51, 0.91), height * 0.91, 0.58 * depthScale(0.91))
      drawSandcastle(context, width * beachDecorX(0.96, 0.7), height * 0.7, 0.45 * depthScale(0.7))
      draggablePebbles('pebbles-1', width * beachDecorX(0.47, 0.72), height * 0.72, 0.9 * depthScale(0.72), populationShift)
      draggablePebbles('pebbles-2', width * beachDecorX(0.64, 0.55), height * 0.55, 0.72 * depthScale(0.55), populationShift)
      draggablePebbles('pebbles-3', width * beachDecorX(0.9, 0.9), height * 0.9, 0.65 * depthScale(0.9), populationShift)
      draggablePebbles('pebbles-4', width * beachDecorX(0.52, 0.42), height * 0.42, 0.55 * depthScale(0.42), populationShift)
      context.restore()

      const birds = [
        { speed: 0.028, offset: 0, y: height * 0.17, scale: 0.75 },
        { speed: 0.019, offset: width * 0.45, y: height * 0.24, scale: 0.52 },
        { speed: 0.034, offset: width * 0.72, y: height * 0.11, scale: 0.42 },
      ]
      birds.forEach((bird, index) => {
        const travel = width + 180
        const x = ((time * bird.speed + bird.offset) % travel) - 90
        const y = bird.y + Math.sin(time * 0.0007 + index * 2) * 12
        const wingLift = Math.sin(time * 0.006 + index * 1.6) * 6
        drawSeagull(context, x, y, bird.scale, wingLift)
      })

      if (!prefersReducedMotion) frameId = window.requestAnimationFrame(draw)
    }

    const isInterfaceTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(target.closest('button, a, input, .events-section, .side-panel, .site-header'))

    const targetAt = (x: number, y: number) => {
      for (let index = dragTargets.length - 1; index >= 0; index -= 1) {
        const target = dragTargets[index]
        if (Math.hypot(x - target.x, y - target.y) <= target.radius) return target
      }
      return null
    }

    const handleDecorPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || isInterfaceTarget(event.target)) return
      const target = targetAt(event.clientX, event.clientY)
      if (!target) return
      const offset = dragOffsets.get(target.id) ?? { x: 0, y: 0 }
      const crab = target.crabIndex === undefined ? undefined : crabAgents[target.crabIndex]
      activeBeachDrag = {
        ...target,
        pointerId: event.pointerId,
        pointerX: event.clientX,
        pointerY: event.clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
        startCrabX: crab ? crab.x * width : 0,
        startCrabY: crab ? crab.y * height + height * 0.028 : 0,
      }
      if (crab) crab.pauseUntil = Number.POSITIVE_INFINITY
      document.body.classList.add('dragging-beach-decor')
      event.preventDefault()
    }

    const handleDecorPointerMove = (event: PointerEvent) => {
      if (!activeBeachDrag) {
        const hovering = !isInterfaceTarget(event.target) && Boolean(targetAt(event.clientX, event.clientY))
        document.body.classList.toggle('hovering-beach-decor', hovering)
        return
      }
      if (event.pointerId !== activeBeachDrag.pointerId) return
      const deltaX = event.clientX - activeBeachDrag.pointerX
      const deltaY = event.clientY - activeBeachDrag.pointerY
      if (activeBeachDrag.crabIndex !== undefined) {
        const crab = crabAgents[activeBeachDrag.crabIndex]
        if (crab) {
          crab.x = (activeBeachDrag.startCrabX + deltaX) / width
          crab.y = (activeBeachDrag.startCrabY + deltaY - height * 0.028) / height
          crab.path = []
          crab.waypoint = 0
        }
      } else {
        dragOffsets.set(activeBeachDrag.id, {
          x: activeBeachDrag.startOffsetX + deltaX,
          y: activeBeachDrag.startOffsetY + deltaY,
        })
      }
      if (prefersReducedMotion) draw(performance.now())
      event.preventDefault()
    }

    const finishDecorDrag = (event: PointerEvent) => {
      if (!activeBeachDrag || event.pointerId !== activeBeachDrag.pointerId) return
      if (activeBeachDrag.crabIndex !== undefined) {
        const crab = crabAgents[activeBeachDrag.crabIndex]
        if (crab) {
          crab.path = []
          crab.waypoint = 0
          crab.pauseUntil = performance.now() + 900
        }
      }
      activeBeachDrag = null
      document.body.classList.remove('dragging-beach-decor')
      if (prefersReducedMotion) draw(performance.now())
    }

    const handleResize = () => {
      resize()
      if (prefersReducedMotion) draw(0)
    }

    resize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('pointerdown', handleDecorPointerDown)
    window.addEventListener('pointermove', handleDecorPointerMove, { passive: false })
    window.addEventListener('pointerup', finishDecorDrag)
    window.addEventListener('pointercancel', finishDecorDrag)
    if (prefersReducedMotion) draw(0)
    else frameId = window.requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointerdown', handleDecorPointerDown)
      window.removeEventListener('pointermove', handleDecorPointerMove)
      window.removeEventListener('pointerup', finishDecorDrag)
      window.removeEventListener('pointercancel', finishDecorDrag)
      document.body.classList.remove('dragging-beach-decor', 'hovering-beach-decor')
      window.cancelAnimationFrame(frameId)
    }
  }, [prefersReducedMotion])

  return <canvas className="ocean-canvas" ref={canvasRef} aria-hidden="true" />
}

function CoastalScene({ ripples }: { ripples: Ripple[] }) {
  return (
    <div className="coastal-scene" aria-hidden="true">
      <OceanCanvas />
      {ripples.map((ripple) => (
        <motion.span
          className={`ripple ${ripple.kind}`}
          key={ripple.id}
          style={{ left: ripple.x, top: ripple.y }}
          initial={{
            scale: (ripple.kind === 'water' ? 0.15 : 0.45) * ripple.depth,
            opacity: ripple.kind === 'water' ? 0.9 : 0.55,
          }}
          animate={{
            scale: (ripple.kind === 'water' ? 3.2 : 1.25) * ripple.depth,
            opacity: 0,
          }}
          transition={{ duration: ripple.kind === 'water' ? 1.15 : 2.8, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

type PhysicsShellProps = {
  icon: React.ReactNode
  label: string
  left: number
  top: number
  initialRotation: number
  size: number
  className: string
  onSplash: (x: number, y: number) => void
}

function PhysicsShell({
  icon,
  label,
  left,
  top,
  initialRotation,
  size,
  className,
  onSplash,
}: PhysicsShellProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotation = useMotionValue(initialRotation)
  const shellFontSize = useMotionValue(21.6 * size * beachDepthScale(top / 100))
  const prefersReducedMotion = useReducedMotion()
  const frameRef = useRef(0)
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startPointerX: 0,
    startPointerY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    velocityX: 0,
    velocityY: 0,
  })

  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), [])

  const updatePerspectiveSize = (absoluteY: number) => {
    shellFontSize.set(21.6 * size * beachDepthScale(absoluteY / window.innerHeight))
  }

  const startPhysics = () => {
    // Top-down projection: hand velocity becomes a short surface glide, not a ballistic fall.
    let velocityX = dragRef.current.velocityX * 0.18
    let velocityY = dragRef.current.velocityY * 0.18
    let previousTime = performance.now()
    let elapsed = 0
    let splashed = false

    const simulate = (time: number) => {
      const delta = Math.min(0.028, Math.max(0.001, (time - previousTime) / 1000))
      previousTime = time
      elapsed += delta

      const baseX = (window.innerWidth * left) / 100
      const baseY = (window.innerHeight * top) / 100
      let offsetX = x.get()
      let offsetY = y.get()
      let absoluteX = baseX + offsetX + 16
      let absoluteY = baseY + offsetY + 16
      const surfaceProgress = Math.max(
        0,
        (absoluteY - window.innerHeight * 0.345) / (window.innerHeight * 0.655),
      )
      const coast = window.innerWidth * beachShoreX(0.345 + surfaceProgress * 0.655)
      const inWater = absoluteY > window.innerHeight * 0.345 && absoluteX < coast
      const overGround = absoluteY > window.innerHeight * 0.345
      const damping = Math.pow(inWater ? 0.76 : overGround ? 0.87 : 0.94, delta * 60)
      velocityX *= damping
      velocityY *= damping
      offsetX += velocityX * delta
      offsetY += velocityY * delta
      absoluteX = baseX + offsetX + 16
      absoluteY = baseY + offsetY + 16

      const nextSurfaceProgress = Math.max(
        0,
        (absoluteY - window.innerHeight * 0.345) / (window.innerHeight * 0.655),
      )
      const nextCoast = window.innerWidth * beachShoreX(0.345 + nextSurfaceProgress * 0.655)
      const enteredWater = absoluteY > window.innerHeight * 0.345 && absoluteX < nextCoast
      if (enteredWater && !splashed) {
        splashed = true
        onSplash(absoluteX, absoluteY)
      }

      const radius = 15 * size
      const leftWall = radius
      const rightWall = window.innerWidth - radius
      const topWall = window.innerHeight * 0.345 + radius
      const bottomWall = window.innerHeight - radius
      if (absoluteX < leftWall) {
        offsetX += leftWall - absoluteX
        velocityX = Math.abs(velocityX) * 0.35
      } else if (absoluteX > rightWall) {
        offsetX -= absoluteX - rightWall
        velocityX = -Math.abs(velocityX) * 0.35
      }
      if (absoluteY < topWall) {
        offsetY += topWall - absoluteY
        velocityY = Math.abs(velocityY) * 0.35
      } else if (absoluteY > bottomWall) {
        offsetY -= absoluteY - bottomWall
        velocityY = -Math.abs(velocityY) * 0.35
      }

      x.set(offsetX)
      y.set(offsetY)
      updatePerspectiveSize(baseY + offsetY + 16)
      rotation.set(rotation.get() + velocityX * delta * 0.07)

      const atRest = Math.hypot(velocityX, velocityY) < 6
      if (!atRest && elapsed < 12) frameRef.current = window.requestAnimationFrame(simulate)
    }

    frameRef.current = window.requestAnimationFrame(simulate)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    window.cancelAnimationFrame(frameRef.current)
    event.currentTarget.setPointerCapture(event.pointerId)
    const now = performance.now()
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startOffsetX: x.get(),
      startOffsetY: y.get(),
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: now,
      velocityX: 0,
      velocityY: 0,
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag.active || drag.pointerId !== event.pointerId) return
    const now = performance.now()
    const deltaSeconds = Math.max(0.008, (now - drag.lastTime) / 1000)
    const instantX = (event.clientX - drag.lastX) / deltaSeconds
    const instantY = (event.clientY - drag.lastY) / deltaSeconds
    drag.velocityX = drag.velocityX * 0.35 + instantX * 0.65
    drag.velocityY = drag.velocityY * 0.35 + instantY * 0.65
    drag.lastX = event.clientX
    drag.lastY = event.clientY
    drag.lastTime = now
    x.set(drag.startOffsetX + event.clientX - drag.startPointerX)
    const baseY = (window.innerHeight * top) / 100
    const minimumSurfaceOffset = window.innerHeight * 0.345 + 8 - baseY
    const nextY = Math.max(
      minimumSurfaceOffset,
      drag.startOffsetY + event.clientY - drag.startPointerY,
    )
    y.set(nextY)
    updatePerspectiveSize(baseY + nextY + 16)
    rotation.set(initialRotation + (event.clientX - drag.startPointerX) * 0.16)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active || dragRef.current.pointerId !== event.pointerId) return
    dragRef.current.active = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (performance.now() - dragRef.current.lastTime > 90) {
      dragRef.current.velocityX *= 0.2
      dragRef.current.velocityY *= 0.2
    }
    if (!prefersReducedMotion) startPhysics()
  }

  return (
    <motion.button
      type="button"
      className={`shell ${className}`}
      style={{ left: `${left}%`, top: `${top}%`, x, y, rotate: rotation, fontSize: shellFontSize }}
      aria-label={`Throw the ${label} into the water`}
      whileHover={{ scale: 1.12 }}
      whileTap={{
        scale: 1.42,
        cursor: 'grabbing',
        filter: 'drop-shadow(0 12px 7px rgb(43 52 46 / 28%))',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {icon}
    </motion.button>
  )
}

function ShellToss({ onSplash }: { onSplash: (x: number, y: number) => void }) {
  const shells = [
    { icon: <GiOpeningShell />, label: 'pink shell', left: 49, top: 68, rotation: -18, size: 1 },
    { icon: <GiNautilusShell />, label: 'spiral shell', left: 91, top: 62, rotation: 22, size: 1.2 },
    { icon: <GiOpeningShell />, label: 'coral shell', left: 83, top: 90, rotation: 8, size: 0.92 },
    { icon: <GiNautilusShell />, label: 'small shell', left: 58, top: 87, rotation: -32, size: 0.78 },
    { icon: <GiOpeningShell />, label: 'sunset shell', left: 96, top: 78, rotation: 35, size: 0.72 },
    { icon: <GiSpiralShell />, label: 'ivory spiral shell', left: 97.2, top: 39, rotation: -12, size: 0.82 },
    { icon: <GiTripleShells />, label: 'tiny shell cluster', left: 94.8, top: 46, rotation: 18, size: 0.72 },
    { icon: <GiNautilusShell />, label: 'gold nautilus shell', left: 98, top: 53, rotation: -28, size: 0.9 },
    { icon: <GiOpeningShell />, label: 'rose shell', left: 96.2, top: 60, rotation: 11, size: 0.68 },
    { icon: <GiSpiralShell />, label: 'small spiral shell', left: 98.1, top: 69, rotation: 26, size: 0.74 },
    { icon: <GiTripleShells />, label: 'peach shell cluster', left: 95.1, top: 86, rotation: -19, size: 0.66 },
    { icon: <GiNautilusShell />, label: 'large beach shell', left: 97.5, top: 94, rotation: 7, size: 1.05 },
  ]

  return (
    <div className="beach-shells" aria-label="Throwable shells on the beach">
      {shells.map((shell, index) => (
        <PhysicsShell
          {...shell}
          left={beachDecorX(shell.left / 100, shell.top / 100) * 100}
          top={Math.min(97, shell.top + 2.8)}
          initialRotation={shell.rotation}
          className={`shell-${(index % 3) + 1}`}
          key={shell.label}
          onSplash={onSplash}
        />
      ))}
    </div>
  )
}

type DayWaveTransition = {
  targetDay: string
  phase: 'cover' | 'reveal'
}

function DayWave({
  phase,
  onPhaseComplete,
}: {
  phase: DayWaveTransition['phase']
  onPhaseComplete: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    const context = canvas?.getContext('2d')
    if (!canvas || !container || !context) return

    let width = 1
    let height = 1
    let pixelRatio = 1
    let frameId = 0

    const resize = () => {
      const bounds = container.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    const draw = (time: number, scheduleNextFrame = true) => {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)

      const frontX = (y: number, offset = 0) =>
        width -
        54 +
        offset +
        Math.sin(y * 0.018 + time * 0.0042) * 18 +
        Math.sin(y * 0.047 - time * 0.0028) * 7 +
        Math.sin(y * 0.008 + 1.7) * 9

      const waterShape = new Path2D()
      waterShape.moveTo(0, 0)
      waterShape.lineTo(frontX(0), 0)
      for (let y = 0; y <= height + 5; y += 4) waterShape.lineTo(frontX(y), y)
      waterShape.lineTo(0, height)
      waterShape.closePath()

      context.save()
      context.clip(waterShape)
      const water = context.createLinearGradient(0, 0, width, 0)
      water.addColorStop(0, '#064f75')
      water.addColorStop(0.44, '#087f9f')
      water.addColorStop(0.78, '#10aeb7')
      water.addColorStop(1, '#0c819d')
      context.fillStyle = water
      context.fillRect(0, 0, width, height)

      const glowY = 140
      const glow = context.createRadialGradient(
        width * 0.64,
        glowY,
        0,
        width * 0.64,
        glowY,
        width * 0.55,
      )
      glow.addColorStop(0, 'rgba(132, 235, 222, 0.38)')
      glow.addColorStop(1, 'rgba(132, 235, 222, 0)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)

      const currentOffset = prefersReducedMotion ? 0 : (time * 0.022) % 68
      for (let row = -1; row < Math.ceil(height / 68) + 1; row += 1) {
        const baseY = row * 68 + currentOffset
        context.strokeStyle = row % 2 ? 'rgba(206,255,246,0.14)' : 'rgba(229,255,249,0.2)'
        context.lineWidth = row % 2 ? 2 : 3
        context.beginPath()
        for (let x = -20; x <= width + 20; x += 9) {
          const y = baseY + Math.sin(x * 0.021 + row * 1.4 + time * 0.0018) * 5
          if (x === -20) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        context.stroke()
      }

      for (let index = 0; index < 22; index += 1) {
        const x = ((index * 137 + time * 0.018) % (width + 100)) - 50
        const y = ((index * 83) % Math.max(1, height - 20)) + 10
        context.strokeStyle = `rgba(222,255,248,${0.08 + (index % 3) * 0.025})`
        context.lineWidth = 1.2
        context.beginPath()
        context.ellipse(x, y, 16 + (index % 4) * 7, 3, -0.08, 0, Math.PI * 2)
        context.stroke()
      }
      context.restore()

      const traceFront = (offset: number) => {
        context.beginPath()
        context.moveTo(frontX(0, offset), 0)
        for (let y = 0; y <= height + 5; y += 4) context.lineTo(frontX(y, offset), y)
      }

      traceFront(-25)
      context.strokeStyle = 'rgba(160, 242, 231, 0.34)'
      context.lineWidth = 8
      context.setLineDash([18, 30, 8, 23])
      context.lineDashOffset = prefersReducedMotion ? 0 : -time * 0.08
      context.lineCap = 'round'
      context.stroke()

      traceFront(-7)
      context.strokeStyle = 'rgba(223, 255, 248, 0.48)'
      context.lineWidth = 18
      context.setLineDash([])
      context.stroke()

      traceFront(0)
      context.strokeStyle = '#f5fff9'
      context.lineWidth = 7
      context.setLineDash([31, 9, 57, 14])
      context.lineDashOffset = prefersReducedMotion ? 0 : time * 0.11
      context.stroke()
      context.setLineDash([])

      const bubbleShift = prefersReducedMotion ? 0 : time * 0.025
      for (let index = 0; index < Math.ceil(height / 43); index += 1) {
        const y = (index * 43 + bubbleShift) % (height + 30) - 15
        const x = frontX(y, -13 - (index % 4) * 6)
        const radius = 1.8 + (index % 3) * 1.4
        context.fillStyle = index % 2 ? 'rgba(247,255,251,0.78)' : 'rgba(213,255,246,0.64)'
        context.beginPath()
        context.arc(x, y, radius, 0, Math.PI * 2)
        context.fill()
      }

      if (!prefersReducedMotion && scheduleNextFrame) {
        frameId = window.requestAnimationFrame(draw)
      }
    }

    const observer = new ResizeObserver(() => {
      resize()
      // Resizing clears a canvas synchronously. Repaint in the same task so the
      // cards underneath can never flash through before the next animation frame.
      draw(performance.now(), false)
    })
    resize()
    observer.observe(container)
    if (prefersReducedMotion) draw(0)
    else frameId = window.requestAnimationFrame(draw)

    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(frameId)
    }
  }, [prefersReducedMotion])

  return (
    <motion.div
      className="day-wave"
      initial={{ x: 'calc(-100% - 120px)', opacity: 1 }}
      animate={phase === 'cover' ? { x: '0px', opacity: 1 } : { x: '0px', opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={
        phase === 'cover'
          ? { duration: 0.72, ease: [0.65, 0, 0.26, 1] }
          : { duration: 0.58, delay: 0.28, ease: 'easeOut' }
      }
      onAnimationComplete={onPhaseComplete}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} />
    </motion.div>
  )
}

function SchedulePage() {
  const { events, status } = useEvents()
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [query, setQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const [dayWave, setDayWave] = useState<DayWaveTransition | null>(null)
  const [eventsCollapsed, setEventsCollapsed] = useState(false)
  const rippleCounter = useRef(0)

  useEffect(() => {
    document.title = 'HackIllinois | Schedule'
  }, [])

  const days = useMemo(
    () => [...new Set(events.map((event) => toDateKey(event.startTime)))].sort().slice(0, 3),
    [events],
  )

  const activeDay = selectedDay && days.includes(selectedDay) ? selectedDay : (days[0] ?? '')
  const requestedDay = dayWave?.targetDay ?? activeDay

  const changeDay = (day: string) => {
    if (day === activeDay || dayWave) return
    setDayWave({ targetDay: day, phase: 'cover' })
  }

  const finishWavePhase = () => {
    if (!dayWave) return
    if (dayWave.phase === 'cover') {
      setSelectedDay(dayWave.targetDay)
      setDayWave({ ...dayWave, phase: 'reveal' })
    } else {
      setDayWave(null)
    }
  }

  const visibleEvents = useMemo(() => {
    const search = query.trim().toLowerCase()
    return events.filter((event) => {
      const category = eventCategory(event.eventType)
      const matchesSearch =
        !search ||
        event.name.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search) ||
        event.locations.some((location) => location.description.toLowerCase().includes(search)) ||
        event.sponsor?.toLowerCase().includes(search)
      return (
        toDateKey(event.startTime) === activeDay &&
        (!selectedCategory || selectedCategory === category) &&
        matchesSearch
      )
    })
  }, [activeDay, events, query, selectedCategory])

  const addRipple = useCallback((x: number, y: number, kind: Ripple['kind'] = 'water') => {
    rippleCounter.current += 1
    const id = rippleCounter.current
    const depth = 0.4 + beachProgress(y / window.innerHeight) * 0.6
    setRipples((current) => [...current.slice(-18), { id, x, y, kind, depth }])
    window.setTimeout(
      () => setRipples((current) => current.filter((item) => item.id !== id)),
      kind === 'water' ? 1250 : 2900,
    )
  }, [])

  useEffect(() => {
    let lastX = -100
    let lastY = -100
    let lastTime = 0

    const surfaceAt = (x: number, y: number): Ripple['kind'] | 'sky' => {
      const horizon = window.innerHeight * 0.345
      const horizonOverspill = Math.min(90, window.innerHeight * 0.1)
      if (y < horizon - horizonOverspill) return 'sky'
      if (y < horizon) return x < window.innerWidth * beachShoreX(0.345) ? 'water' : 'sky'
      const progress = Math.max(0, (y - horizon) / Math.max(1, window.innerHeight - horizon))
      const coast = window.innerWidth * beachShoreX(0.345 + progress * 0.655)
      return x < coast ? 'water' : 'sand'
    }

    const handlePointerMove = (event: PointerEvent) => {
      const now = performance.now()
      const distance = Math.hypot(event.clientX - lastX, event.clientY - lastY)
      if (distance < 20 || now - lastTime < 42) return
      const surface = surfaceAt(event.clientX, event.clientY)
      if (surface === 'water' || (surface === 'sand' && event.buttons > 0)) {
        addRipple(event.clientX, event.clientY, surface)
        lastX = event.clientX
        lastY = event.clientY
        lastTime = now
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (surfaceAt(event.clientX, event.clientY) === 'sand') {
        addRipple(event.clientX, event.clientY, 'sand')
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerdown', handlePointerDown, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [addRipple])

  const selectedLabel = activeDay ? dayLabel(activeDay) : null

  return (
    <div className="app-shell">
      <CoastalScene ripples={ripples} />
      <Header />
      <main className="schedule-main">
        <section className="schedule-intro">
          <div>
            <h1>Catch the next wave.</h1>
            <p>Three days of building, learning, and finding your crew.</p>
          </div>
          <label className="search-box">
            <FiSearch aria-hidden="true" />
            <span className="sr-only">Search schedule</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events or rooms"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                <FiX />
              </button>
            )}
          </label>
        </section>

        <div className={`schedule-grid${eventsCollapsed ? ' events-collapsed' : ''}`}>
          <aside className="schedule-sidebar">
            <section className="side-panel day-panel">
              <div className="day-panel-heading">
                <span className="panel-kicker">Choose your day</span>
                <AnimatePresence initial={false}>
                  {eventsCollapsed && (
                    <motion.button
                      type="button"
                      className="event-panel-toggle expand-events"
                      aria-label="Expand event schedule"
                      title="Expand event schedule"
                      initial={{ opacity: 0, scale: 0.65, x: -8 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.65 }}
                      onClick={() => setEventsCollapsed(false)}
                    >
                      <FiChevronRight aria-hidden="true" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              <div className="day-tabs" role="tablist" aria-label="Schedule day">
                {days.map((day, index) => {
                  const label = dayLabel(day)
                  return (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={requestedDay === day}
                      className={requestedDay === day ? 'active' : ''}
                      key={day}
                      disabled={Boolean(dayWave)}
                      onClick={() => changeDay(day)}
                    >
                      <span>Day {index + 1}</span>
                      <strong>{label.weekday}</strong>
                      <small>{label.date}</small>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="side-panel legend-panel">
              <div className="panel-heading">
                <span className="panel-kicker">Filters</span>
                <button
                  type="button"
                  className={selectedCategory === null ? 'active' : ''}
                  onClick={() => setSelectedCategory(null)}
                >
                  Show all
                </button>
              </div>
              <div className="legend-list">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    className={selectedCategory === category.id ? 'enabled' : ''}
                    onClick={() => setSelectedCategory(category.id)}
                    aria-pressed={selectedCategory === category.id}
                  >
                    <span style={{ '--category-color': category.color } as React.CSSProperties} />
                    {category.label}
                  </button>
                ))}
              </div>
            </section>

          </aside>

          <AnimatePresence initial={false}>
            {!eventsCollapsed && (
              <motion.section
                className="events-section"
                aria-live="polite"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
            <button
              type="button"
              className="event-panel-toggle collapse-events"
              aria-label="Collapse event schedule"
              title="Collapse event schedule"
              onClick={() => setEventsCollapsed(true)}
            >
              <FiChevronLeft aria-hidden="true" />
            </button>
            <div className="events-heading">
              <div>
                <span className="eyebrow">{selectedLabel?.date ?? 'Loading'}</span>
                <h2>{selectedLabel?.weekday ?? 'Finding the shoreline…'}</h2>
              </div>
              <span className="event-count">
                {visibleEvents.length} {visibleEvents.length === 1 ? 'event' : 'events'}
              </span>
            </div>

            {status === 'loading' && !events.length ? (
              <div className="event-list loading-list">
                {[0, 1, 2, 3].map((item) => (
                  <div className="event-skeleton" key={item} />
                ))}
              </div>
            ) : visibleEvents.length ? (
              <motion.div className="event-list" layout={!dayWave}>
                <AnimatePresence mode="popLayout" initial={false}>
                  {visibleEvents.map((event, index) => (
                    <EventCard
                      key={event.eventId}
                      event={event}
                      index={index}
                      skipEntrance={dayWave?.phase === 'reveal'}
                      onSelect={() => setSelectedEvent(event)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GiNautilusShell />
                <h3>No events washed ashore.</h3>
                <p>Try another search or turn on another event type.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setSelectedCategory(null)
                  }}
                >
                  Reset filters
                </button>
              </motion.div>
            )}
            <AnimatePresence>
              {dayWave && (
                <DayWave phase={dayWave.phase} onPhaseComplete={finishWavePhase} />
              )}
            </AnimatePresence>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>
      <ShellToss onSplash={addRipple} />
      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  )
}

function EventCard({
  event,
  index,
  skipEntrance,
  onSelect,
}: {
  event: Event
  index: number
  skipEntrance: boolean
  onSelect: () => void
}) {
  const category = categoryMap.get(eventCategory(event.eventType)) ?? categories[0]
  const location = event.locations[0]?.description || 'Location TBA'

  return (
    <motion.button
      type="button"
      layout={!skipEntrance}
      className="event-card"
      style={{ '--event-color': category.color } as React.CSSProperties}
      onClick={onSelect}
      initial={skipEntrance ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={
        skipEntrance
          ? { duration: 0 }
          : { delay: Math.min(index * 0.035, 0.22), duration: 0.35 }
      }
      whileHover={{ y: -3 }}
    >
      <span className="card-accent" />
      <span className="event-time">{formatTime(event.startTime)}</span>
      <span className="event-card-body">
        <span className="event-topline">
          <span className="event-category">{category.label}</span>
          {event.sponsor && <span className="sponsor">with {event.sponsor}</span>}
        </span>
        <strong>{event.name}</strong>
        <span className="event-meta">
          <span>
            <FiMapPin /> {location}
          </span>
          <span>
            <FiClock /> {duration(event)}
          </span>
        </span>
      </span>
      <span className="details-cue">
        Details <FiArrowLeft />
      </span>
    </motion.button>
  )
}

function EventModal({ event, onClose }: { event: Event | null; onClose: () => void }) {
  useEffect(() => {
    if (!event) return
    const onKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [event, onClose])

  const category = event ? categoryMap.get(eventCategory(event.eventType)) ?? categories[0] : categories[0]

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(mouseEvent) => {
            if (mouseEvent.target === mouseEvent.currentTarget) onClose()
          }}
        >
          <motion.article
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-dialog-title"
            className="event-modal"
            style={{ '--event-color': category.color } as React.CSSProperties}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          >
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close details">
              <FiX />
            </button>
            <span className="modal-category">{category.label}</span>
            <h2 id="event-dialog-title">{event.name}</h2>
            {event.sponsor && <p className="modal-sponsor">Presented with {event.sponsor}</p>}
            <div className="modal-facts">
              <div>
                <FiClock />
                <span>
                  <small>Time</small>
                  <strong>{formatRange(event)}</strong>
                </span>
              </div>
              <div>
                <FiMapPin />
                <span>
                  <small>Location</small>
                  <strong>{event.locations[0]?.description || 'To be announced'}</strong>
                </span>
              </div>
              {!!event.points && (
                <div>
                  <FiStar />
                  <span>
                    <small>Points</small>
                    <strong>{event.points} points</strong>
                  </span>
                </div>
              )}
            </div>
            <div className="modal-description">
              <span>What’s happening</span>
              <p>{event.description || 'More details are coming soon. Check back before the event.'}</p>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const creditGroups = [
  { title: 'Developer', content: 'Kundan Baliga' },
  {
    title: 'HackIllinois logo',
    content: 'HackIllinois 2022',
    href: 'https://2022.hackillinois.org/',
  },
  {
    title: 'Site favicon',
    content: 'HackIllinois 2021 Schedule',
    href: 'https://2021.hackillinois.org/schedule',
  },
  {
    title: 'Schedule event data',
    content: 'HackIllinois Adonix API',
    href: 'https://adonix.hackillinois.org/docs/',
  },
  {
    title: 'Iconography',
    content: 'React Icons',
    href: 'https://react-icons.github.io/react-icons/',
  },
  {
    title: 'Animation',
    content: 'Framer Motion',
    href: 'https://www.framer.com/motion/',
  },
  {
    title: 'Typography',
    content: 'Google Fonts',
    href: 'https://fonts.google.com/',
  },
  {
    title: 'Beach scene & interactions',
    content: 'Original code-native artwork by Kundan Baliga',
  },
]

function CreditsPage() {
  useEffect(() => {
    document.title = 'Credits | HackIllinois Schedule'
  }, [])

  return (
    <div className="app-shell credits-shell">
      <CoastalScene ripples={[]} />
      <Header />
      <main className="credits-main">
        <motion.div
          className="credits-card"
          initial={{ opacity: 0, y: 24, rotate: -0.8 }}
          animate={{ opacity: 1, y: 0, rotate: -0.35 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="postcard-stamp" aria-hidden="true">
            HI
            <span>2027</span>
          </div>
          <Link className="back-link" to="/">
            <FiArrowLeft /> Back to schedule
          </Link>
          <span className="eyebrow">Made with care in Champaign</span>
          <h1>Credits & thanks</h1>
          <p className="credits-lede">
            This shoreline was shaped by a community of makers and a few wonderful open-source resources.
          </p>
          <div className="credits-grid">
            {creditGroups.map((credit) => (
              <div className="credit-item" key={credit.title}>
                <span>{credit.title}</span>
                {credit.href ? (
                  <a href={credit.href} target="_blank" rel="noreferrer">
                    {credit.content} <FiExternalLink />
                  </a>
                ) : (
                  <strong>{credit.content}</strong>
                )}
              </div>
            ))}
          </div>
          <p className="credits-note">
            The beach, water, waves, shells, birds, and sun on this version are original code-native artwork.
          </p>
        </motion.div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SchedulePage />} />
      <Route path="/credits" element={<CreditsPage />} />
      <Route path="*" element={<SchedulePage />} />
    </Routes>
  )
}
