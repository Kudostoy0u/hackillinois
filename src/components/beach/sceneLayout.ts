import type { CrabObstacle, CrabPoint } from './pathfinding'

export type CrabSeed = CrabPoint & {
  scale: number
  speed: number
  heading: number
  walkPhase: number
  destinationCursor: number
  pauseUntil: number
  gait: 'forward' | 'sideways'
}

export const CRAB_SEEDS: CrabSeed[] = [
  { x: 0.49, y: 0.59, scale: 0.68, speed: 22, heading: 0.2, walkPhase: 0, destinationCursor: 0, pauseUntil: 0, gait: 'sideways' },
  { x: 0.84, y: 0.52, scale: 0.78, speed: 20, heading: -0.2, walkPhase: 1.4, destinationCursor: 1, pauseUntil: 500, gait: 'forward' },
  { x: 0.5, y: 0.74, scale: 0.74, speed: 24, heading: 0.15, walkPhase: 2.6, destinationCursor: 2, pauseUntil: 1000, gait: 'sideways' },
  { x: 0.85, y: 0.88, scale: 0.82, speed: 19, heading: -0.25, walkPhase: 3.8, destinationCursor: 0, pauseUntil: 1500, gait: 'forward' },
]

export const CRAB_DESTINATIONS: CrabPoint[][] = [
  [{ x: 0.49, y: 0.4 }, { x: 0.63, y: 0.41 }, { x: 0.66, y: 0.53 }, { x: 0.5, y: 0.58 }],
  [{ x: 0.75, y: 0.39 }, { x: 0.88, y: 0.42 }, { x: 0.83, y: 0.58 }, { x: 0.7, y: 0.55 }],
  [{ x: 0.48, y: 0.64 }, { x: 0.59, y: 0.7 }, { x: 0.49, y: 0.84 }, { x: 0.66, y: 0.78 }],
  [{ x: 0.73, y: 0.65 }, { x: 0.91, y: 0.67 }, { x: 0.86, y: 0.82 }, { x: 0.75, y: 0.94 }, { x: 0.9, y: 0.91 }],
]

export const CRAB_OBSTACLES: CrabObstacle[] = [
  { x: 0.52, y: 0.41, radius: 46 },
  { x: 0.63, y: 0.39, radius: 29 },
  { x: 0.51, y: 0.49, radius: 25 },
  { x: 0.64, y: 0.45, radius: 24 },
  { x: 0.59, y: 0.51, radius: 15 },
  { x: 0.57, y: 0.39, radius: 13 },
  { x: 0.68, y: 0.47, radius: 13 },
  { x: 0.93, y: 0.49, radius: 92 },
  { x: 0.79, y: 0.7, radius: 65 },
  { x: 0.55, y: 0.57, radius: 38 },
  { x: 0.965, y: 0.83, radius: 70 },
  { x: 0.67, y: 0.9, radius: 42 },
  { x: 0.88, y: 0.94, radius: 50 },
  { x: 0.72, y: 0.48, radius: 62 },
  { x: 0.985, y: 0.61, radius: 34 },
  { x: 0.6, y: 0.76, radius: 48 },
  { x: 0.83, y: 0.395, radius: 68 },
  { x: 0.79, y: 0.43, radius: 14 },
  { x: 0.875, y: 0.54, radius: 34 },
  { x: 0.98, y: 0.56, radius: 27 },
  { x: 0.735, y: 0.61, radius: 32 },
  { x: 0.91, y: 0.68, radius: 31 },
  { x: 0.62, y: 0.69, radius: 29 },
  { x: 0.965, y: 0.75, radius: 32 },
  { x: 0.82, y: 0.87, radius: 32 },
  { x: 0.94, y: 0.93, radius: 28 },
  { x: 0.56, y: 0.95, radius: 25 },
  { x: 0.86, y: 0.8, radius: 43 },
  { x: 0.51, y: 0.91, radius: 31 },
  { x: 0.96, y: 0.7, radius: 28 },
  { x: 0.94, y: 0.59, radius: 18 },
  { x: 0.73, y: 0.85, radius: 16 },
]

export const BEACH_SETS = [
  { x: 0.52, y: 0.41, radius: 18, chairs: 1, colors: ['#3f9f91', '#fff2d2'] as [string, string] },
  { x: 0.63, y: 0.39, radius: 16, chairs: 0, colors: ['#d96e86', '#fff3da'] as [string, string] },
  { x: 0.93, y: 0.49, radius: 35, chairs: 3, colors: ['#ef6f51', '#fff3d5'] as [string, string] },
  { x: 0.79, y: 0.7, radius: 31, chairs: 1, colors: ['#167f9a', '#f8e8bd'] as [string, string] },
  { x: 0.55, y: 0.57, radius: 23, chairs: 0, colors: ['#e4a442', '#fff5dc'] as [string, string] },
  { x: 0.9, y: 0.83, radius: 27, chairs: 2, colors: ['#725ac1', '#f7e7cc'] as [string, string] },
  { x: 0.67, y: 0.9, radius: 26, chairs: 0, colors: ['#e05680', '#fff1d1'] as [string, string] },
  { x: 0.88, y: 0.94, radius: 21, chairs: 1, colors: ['#37a88a', '#f8ecc9'] as [string, string] },
  { x: 0.72, y: 0.48, radius: 20, chairs: 2, colors: ['#de7b43', '#fff5dc'] as [string, string] },
  { x: 0.985, y: 0.61, radius: 20, chairs: 0, colors: ['#2387a4', '#fff1d6'] as [string, string] },
  { x: 0.6, y: 0.76, radius: 18, chairs: 1, colors: ['#8167c7', '#f8e8c8'] as [string, string] },
  { x: 0.83, y: 0.395, radius: 24, chairs: 2, colors: ['#e66c64', '#fff3d9'] as [string, string] },
]

export const TOWELS = [
  [0.51, 0.49, 18, '#4f9fb3', 0.2],
  [0.64, 0.45, 17, '#e77a63', -0.18],
  [0.7, 0.4, 16, '#e1aa45', 0.13],
  [0.875, 0.54, 28, '#55a6b8', 0.31],
  [0.98, 0.56, 20, '#e4ad4f', -0.15],
  [0.735, 0.61, 25, '#8b70c9', 0.18],
  [0.91, 0.68, 23, '#46aa8d', -0.34],
  [0.62, 0.69, 21, '#ea7e65', 0.26],
  [0.965, 0.75, 26, '#3d9db6', 0.14],
  [0.82, 0.87, 24, '#d9688e', -0.28],
  [0.56, 0.95, 18, '#3c9a84', -0.17],
] as const

export const DRINKS = [
  [0.57, 0.39, 0.65, '#e9a54e'],
  [0.68, 0.47, 0.62, '#62aea3'],
  [0.79, 0.43, 0.9, '#eaa957'],
  [0.89, 0.58, 0.8, '#e97876'],
  [0.975, 0.67, 0.72, '#6db5aa'],
  [0.77, 0.76, 0.82, '#efbd52'],
  [0.885, 0.9, 0.68, '#dc7688'],
  [0.64, 0.86, 0.7, '#75b7c2'],
] as const

export const BIRDS = [
  { speed: 0.028, offsetRatio: 0, yRatio: 0.17, scale: 0.75 },
  { speed: 0.019, offsetRatio: 0.45, yRatio: 0.24, scale: 0.52 },
  { speed: 0.034, offsetRatio: 0.72, yRatio: 0.11, scale: 0.42 },
]

export const BEACH_BALLS = [
  { x: 0.94, y: 0.59, radius: 11 },
  { x: 0.59, y: 0.51, radius: 8 },
  { x: 0.73, y: 0.85, radius: 9 },
]

export const SANDCASTLES = [
  { x: 0.86, y: 0.8, scale: 0.82 },
  { x: 0.51, y: 0.91, scale: 0.58 },
  { x: 0.96, y: 0.7, scale: 0.45 },
]

export const PEBBLE_GROUPS = [
  { x: 0.47, y: 0.72, scale: 0.9 },
  { x: 0.64, y: 0.55, scale: 0.72 },
  { x: 0.9, y: 0.9, scale: 0.65 },
  { x: 0.52, y: 0.42, scale: 0.55 },
]
