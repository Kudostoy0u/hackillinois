import { AnimatePresence, motion } from 'framer-motion'
import { FiChevronLeft } from 'react-icons/fi'
import { GiNautilusShell } from 'react-icons/gi'
import type { DayWaveTransition, Event } from '../../types'
import { DayWave } from './DayWave'
import { EventCard } from './EventCard'

type EventsPanelProps = {
  events: Event[]
  hasLoadedEvents: boolean
  selectedDayLabel: { weekday: string; date: string } | null
  dayWave: DayWaveTransition | null
  collapsed: boolean
  onCollapse: () => void
  onResetFilters: () => void
  onSelectEvent: (event: Event) => void
  onWavePhaseComplete: () => void
}

export function EventsPanel({
  events,
  hasLoadedEvents,
  selectedDayLabel,
  dayWave,
  collapsed,
  onCollapse,
  onResetFilters,
  onSelectEvent,
  onWavePhaseComplete,
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
            <motion.div className="event-list" layout={!dayWave}>
              <AnimatePresence mode="popLayout" initial={false}>
                {events.map((event, index) => (
                  <EventCard
                    key={event.eventId}
                    event={event}
                    index={index}
                    skipEntrance={dayWave?.phase === 'reveal'}
                    onSelect={() => onSelectEvent(event)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GiNautilusShell />
              <h3>No events washed ashore.</h3>
              <p>Try another search or turn on another event type.</p>
              <button type="button" onClick={onResetFilters}>
                Reset filters
              </button>
            </motion.div>
          )}

          <AnimatePresence>
            {dayWave && (
              <DayWave phase={dayWave.phase} onPhaseComplete={onWavePhaseComplete} />
            )}
          </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
