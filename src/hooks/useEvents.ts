import { useEffect, useState } from 'react'
import { API_URL } from '../config'
import { FALLBACK_EVENTS } from '../data/fallbackEvents'
import type { Event } from '../types'

export function useEvents() {
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

