import { AnimatePresence, motion } from 'framer-motion'
import { FiChevronLeft } from 'react-icons/fi'
import type { Event } from '../../types'
import { EventCard } from './EventCard'

type EventsPanelProps = {
  events: Event[]
  hasLoadedEvents: boolean
  selectedDayLabel: { weekday: string; date: string } | null
  collapsed: boolean
  onCollapse: () => void
  onResetFilters: () => void
  onSelectEvent: (event: Event) => void
}

export function EventsPanel({
  events,
  hasLoadedEvents,
  selectedDayLabel,
  collapsed,
  onCollapse,
  onResetFilters,
  onSelectEvent,
}: EventsPanelProps) {
  return (
    <AnimatePresence initial={false}>
      {!collapsed && (
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
            onClick={onCollapse}
          >
            <FiChevronLeft aria-hidden="true" />
          </button>

          <div className="events-heading">
            <div>
              <span className="eyebrow">{selectedDayLabel?.date ?? 'Loading'}</span>
              <h2>{selectedDayLabel?.weekday ?? 'Finding the shoreline…'}</h2>
            </div>
            <span className="event-count">
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {!hasLoadedEvents ? (
            <div className="event-list loading-list">
              {[0, 1, 2, 3].map((item) => (
                <div className="event-skeleton" key={item} />
              ))}
            </div>
          ) : events.length ? (
            <div className="event-list">
              {events.map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  onSelect={() => onSelectEvent(event)}
                />
              ))}
            </div>
          ) : (
            <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3>No events washed ashore.</h3>
              <p>Try another search or turn on another event type.</p>
              <button type="button" onClick={onResetFilters}>
                Reset filters
              </button>
            </motion.div>
          )}
        </motion.section>
      )}
    </AnimatePresence>
  )
}
