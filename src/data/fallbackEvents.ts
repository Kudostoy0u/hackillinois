import type { Event } from '../types'

export const FALLBACK_EVENTS: Event[] = [
  {
    eventId: 'fallback-checkin',
    name: 'Attendee Check-In',
    description:
      'Check in, pick up your badge, and get ready for a weekend of building.',
    startTime: 1772222400,
    endTime: 1772233200,
    eventType: 'OTHER',
    locations: [{ description: 'Siebel CS 1st Floor Lobby' }],
  },
  {
    eventId: 'fallback-opening',
    name: 'Opening Ceremony',
    description: 'Welcome to HackIllinois! Meet the team and begin the weekend.',
    startTime: 1772233200,
    endTime: 1772236800,
    eventType: 'OTHER',
    locations: [{ description: 'Siebel CS 1404' }],
  },
  {
    eventId: 'fallback-team',
    name: 'Team Matching',
    description: 'Find your crew, pick a track, and start building together.',
    startTime: 1772245800,
    endTime: 1772249400,
    eventType: 'WORKSHOP',
    locations: [{ description: 'Siebel CS 0218' }],
  },
  {
    eventId: 'fallback-breakfast',
    name: 'Breakfast',
    description: 'Fuel up for a full day of hacking.',
    startTime: 1772285400,
    endTime: 1772289000,
    eventType: 'MEAL',
    locations: [{ description: 'Siebel CS 2nd Floor Atrium' }],
  },
  {
    eventId: 'fallback-showcase',
    name: 'Project Showcase',
    description: 'Share what you built and celebrate the weekend with the community.',
    startTime: 1772377200,
    endTime: 1772386200,
    eventType: 'OTHER',
    locations: [{ description: 'Siebel Center for Computer Science' }],
  },
  {
    eventId: 'fallback-closing',
    name: 'Closing Ceremonies',
    description: 'One last gathering to celebrate the hackers and winning projects.',
    startTime: 1772396100,
    endTime: 1772399700,
    eventType: 'OTHER',
    locations: [{ description: 'Siebel CS 1404' }],
  },
]

