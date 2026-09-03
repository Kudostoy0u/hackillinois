import type { CSSProperties } from 'react'
import { FiArrowLeft, FiClock, FiMapPin } from 'react-icons/fi'
import { categories, categoryMap } from '../../config'
import type { Event } from '../../types'
import { duration, eventCategory, formatTime } from '../../utils/eventFormatters'

export function EventCard({
  event,
  onSelect,
}: {
  event: Event
  onSelect: () => void
}) {
  const category = categoryMap.get(eventCategory(event.eventType)) ?? categories[0]
  const location = event.locations[0]?.description || 'Location TBA'

  return (
    <button
      type="button"
      className="event-card"
      style={{ '--event-color': category.color } as CSSProperties}
      onClick={onSelect}
    >
      <span className="card-accent" />
      <span className="event-time">{formatTime(event.startTime)}</span>
      <span className="event-card-body">
        <span className="event-topline">
          <span className="event-category">{category.label}</span>
          {event.sponsor && <span className="sponsor">with {event.sponsor}</span>}
        </span>
        <strong className="event-title">{event.name}</strong>
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
    </button>
  )
}
