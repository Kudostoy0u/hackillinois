import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiClock, FiMapPin } from 'react-icons/fi'
import { categories, categoryMap } from '../../config'
import type { Event } from '../../types'
import { duration, eventCategory, formatTime } from '../../utils/eventFormatters'

export function EventCard({
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
      style={{ '--event-color': category.color } as CSSProperties}
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

