export type EventLocation = {
  description: string
  latitude?: number
  longitude?: number
}

export type Event = {
  eventId: string
  name: string
  description: string
  startTime: number
  endTime: number
  eventType: string
  locations: EventLocation[]
  sponsor?: string
  points?: number
  isAsync?: boolean
}

export type Category = 'main' | 'workshop' | 'speaker' | 'activity' | 'food'

export type Ripple = {
  id: number
  x: number
  y: number
  kind: 'water' | 'sand'
}

export type DayWaveTransition = {
  targetDay: string
  phase: 'cover' | 'reveal'
}

