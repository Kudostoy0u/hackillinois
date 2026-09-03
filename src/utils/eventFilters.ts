import type { Category, Event } from '../types'
import { eventCategory, toDateKey } from './eventFormatters'

export type EventFilters = {
  day: string
  category: Category | null
  query: string
}

export function scheduleDays(events: Event[]) {
  return [...new Set(events.map((event) => toDateKey(event.startTime)))].sort().slice(0, 3)
}

export function filterEvents(events: Event[], filters: EventFilters) {
  const search = filters.query.trim().toLowerCase()

  return events.filter((event) => {
    const searchableText = [
      event.name,
      event.description,
      event.sponsor ?? '',
      ...event.locations.map((location) => location.description),
    ]
      .join(' ')
      .toLowerCase()

    return (
      toDateKey(event.startTime) === filters.day &&
      (!filters.category || filters.category === eventCategory(event.eventType)) &&
      (!search || searchableText.includes(search))
    )
  })
}
