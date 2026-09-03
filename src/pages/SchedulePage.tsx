import { useEffect, useMemo, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'
import { Header } from '../components/Header'
import { CoastalScene } from '../components/beach/CoastalScene'
import { ShellToss } from '../components/beach/ShellToss'
import { EventsPanel } from '../components/schedule/EventsPanel'
import { EventModal } from '../components/schedule/EventModal'
import { ScheduleSidebar } from '../components/schedule/ScheduleSidebar'
import { useEvents } from '../hooks/useEvents'
import { useRipples } from '../hooks/useRipples'
import type { Category, Event } from '../types'
import { filterEvents, scheduleDays } from '../utils/eventFilters'
import { dayLabel } from '../utils/eventFormatters'

export function SchedulePage() {
  const { events, status } = useEvents()
  const { ripples, addRipple } = useRipples()
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [query, setQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventsCollapsed, setEventsCollapsed] = useState(false)

  useEffect(() => {
    document.title = 'HackIllinois | Schedule'
  }, [])

  const days = useMemo(
    () => scheduleDays(events),
    [events],
  )
  const activeDay = selectedDay && days.includes(selectedDay) ? selectedDay : (days[0] ?? '')

  const visibleEvents = useMemo(() => {
    return filterEvents(events, {
      day: activeDay,
      category: selectedCategory,
      query,
    })
  }, [activeDay, events, query, selectedCategory])

  const changeDay = (day: string) => {
    if (day !== activeDay) setSelectedDay(day)
  }

  const resetFilters = () => {
    setQuery('')
    setSelectedCategory(null)
  }

  const selectedDayLabel = activeDay ? dayLabel(activeDay) : null

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
          <ScheduleSidebar
            days={days}
            requestedDay={activeDay}
            selectedCategory={selectedCategory}
            eventsCollapsed={eventsCollapsed}
            onChangeDay={changeDay}
            onChangeCategory={setSelectedCategory}
            onExpandEvents={() => setEventsCollapsed(false)}
          />
          <EventsPanel
            events={visibleEvents}
            hasLoadedEvents={status !== 'loading' || events.length > 0}
            selectedDayLabel={selectedDayLabel}
            collapsed={eventsCollapsed}
            onCollapse={() => setEventsCollapsed(true)}
            onResetFilters={resetFilters}
            onSelectEvent={setSelectedEvent}
          />
        </div>
      </main>

      <ShellToss onSplash={addRipple} />
      <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  )
}
