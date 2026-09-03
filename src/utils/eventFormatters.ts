import { EVENT_TIME_ZONE } from '../config'
import type { Category, Event } from '../types'

export function eventCategory(type: string): Category {
  if (type === 'MEAL') return 'food'
  if (type === 'WORKSHOP') return 'workshop'
  if (type === 'SPEAKER' || type === 'QNA') return 'speaker'
  if (type === 'MINIEVENT' || type === 'SIDEQUEST') return 'activity'
  return 'main'
}

export function toDateKey(timestamp: number) {
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

export function dayLabel(key: string) {
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

export function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: EVENT_TIME_ZONE,
  }).format(new Date(timestamp * 1000))
}

export function formatRange(event: Event) {
  if (event.startTime === event.endTime) return formatTime(event.startTime)
  return `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
}

export function duration(event: Event) {
  const minutes = Math.max(0, Math.round((event.endTime - event.startTime) / 60))
  if (!minutes) return 'Deadline'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`
}

