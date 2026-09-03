import type { Category } from './types'

export const API_URL = '/api/adonix'
export const LOGO_URL = 'https://2022.hackillinois.org/static/media/logo.340b1373.svg'
export const EVENT_TIME_ZONE = 'America/Chicago'

export const categories: Array<{ id: Category; label: string; color: string }> = [
  { id: 'main', label: 'Main events', color: '#ef6f51' },
  { id: 'workshop', label: 'Workshops', color: '#725ac1' },
  { id: 'speaker', label: 'Talks & Q&A', color: '#e9a23b' },
  { id: 'activity', label: 'Activities', color: '#34a88a' },
  { id: 'food', label: 'Food', color: '#e05680' },
]

export const categoryMap = new Map(categories.map((category) => [category.id, category]))

