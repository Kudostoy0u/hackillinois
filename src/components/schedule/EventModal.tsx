import { useEffect, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiClock, FiMapPin, FiStar, FiX } from 'react-icons/fi'
import { categories, categoryMap } from '../../config'
import type { Event } from '../../types'
import { eventCategory, formatRange } from '../../utils/eventFormatters'

export function EventModal({ event, onClose }: { event: Event | null; onClose: () => void }) {
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
            style={{ '--event-color': category.color } as CSSProperties}
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

