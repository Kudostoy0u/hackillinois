import type { CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiChevronRight } from 'react-icons/fi'
import { categories } from '../../config'
import type { Category } from '../../types'
import { dayLabel } from '../../utils/eventFormatters'

type ScheduleSidebarProps = {
  days: string[]
  requestedDay: string
  selectedCategory: Category | null
  eventsCollapsed: boolean
  onChangeDay: (day: string) => void
  onChangeCategory: (category: Category | null) => void
  onExpandEvents: () => void
}

export function ScheduleSidebar({
  days,
  requestedDay,
  selectedCategory,
  eventsCollapsed,
  onChangeDay,
  onChangeCategory,
  onExpandEvents,
}: ScheduleSidebarProps) {
  return (
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
                onClick={onExpandEvents}
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
                onClick={() => onChangeDay(day)}
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
            onClick={() => onChangeCategory(null)}
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
              onClick={() => onChangeCategory(category.id)}
              aria-pressed={selectedCategory === category.id}
            >
              <span style={{ '--category-color': category.color } as CSSProperties} />
              {category.label}
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
