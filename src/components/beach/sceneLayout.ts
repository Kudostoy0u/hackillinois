import type { CrabPoint } from './pathfinding'

export type CrabSeed = CrabPoint & {
  scale: number
  speed: number
  heading: number
  walkPhase: number
  destinationCursor: number
  pauseUntil: number
  gait: 'forward' | 'sideways'
}

export type BeachSetup = {
  x: number
  y: number
  radius: number
  chairs: number
  canopy: {
    primary: string
    secondary: string
  }
}

export type TowelPlacement = {
  x: number
  y: number
  width: number
  color: string
  rotation: number
}

export type DrinkPlacement = {
  x: number
  y: number
  scale: number
  color: string
}

export type ShellPlacement = {
  x: number
  y: number
  scale: number
  color: string
  rotation: number
}

// Layout coordinates are normalized viewport positions from 0 to 1.
export const CRAB_SEEDS: CrabSeed[] = [
  {
    x: 0.78,
    y: 0.62,
    scale: 0.78,
    speed: 22,
    heading: 0.2,
    walkPhase: 0,
    destinationCursor: 0,
    pauseUntil: 0,
    gait: 'sideways',
  },
]

export const CRAB_DESTINATIONS: CrabPoint[][] = [
  [
    { x: 0.56, y: 0.43 },
    { x: 0.77, y: 0.46 },
    { x: 0.9, y: 0.62 },
    { x: 0.82, y: 0.86 },
    { x: 0.59, y: 0.79 },
  ],
]

export const BEACH_SETUPS: BeachSetup[] = [
  {
    x: 0.52,
    y: 0.41,
    radius: 18,
    chairs: 1,
    canopy: { primary: '#3f9f91', secondary: '#fff2d2' },
  },
  {
    x: 0.63,
    y: 0.39,
    radius: 16,
    chairs: 0,
    canopy: { primary: '#d96e86', secondary: '#fff3da' },
  },
  {
    x: 0.93,
    y: 0.49,
    radius: 35,
    chairs: 3,
    canopy: { primary: '#ef6f51', secondary: '#fff3d5' },
  },
  {
    x: 0.79,
    y: 0.7,
    radius: 31,
    chairs: 1,
    canopy: { primary: '#167f9a', secondary: '#f8e8bd' },
  },
  {
    x: 0.55,
    y: 0.57,
    radius: 23,
    chairs: 0,
    canopy: { primary: '#e4a442', secondary: '#fff5dc' },
  },
  {
    x: 0.9,
    y: 0.83,
    radius: 27,
    chairs: 2,
    canopy: { primary: '#725ac1', secondary: '#f7e7cc' },
  },
  {
    x: 0.67,
    y: 0.9,
    radius: 26,
    chairs: 0,
    canopy: { primary: '#e05680', secondary: '#fff1d1' },
  },
  {
    x: 0.88,
    y: 0.94,
    radius: 21,
    chairs: 1,
    canopy: { primary: '#37a88a', secondary: '#f8ecc9' },
  },
  {
    x: 0.72,
    y: 0.48,
    radius: 20,
    chairs: 2,
    canopy: { primary: '#de7b43', secondary: '#fff5dc' },
  },
  {
    x: 0.985,
    y: 0.61,
    radius: 20,
    chairs: 0,
    canopy: { primary: '#2387a4', secondary: '#fff1d6' },
  },
  {
    x: 0.6,
    y: 0.76,
    radius: 18,
    chairs: 1,
    canopy: { primary: '#8167c7', secondary: '#f8e8c8' },
  },
  {
    x: 0.83,
    y: 0.395,
    radius: 24,
    chairs: 2,
    canopy: { primary: '#e66c64', secondary: '#fff3d9' },
  },
]

export const TOWELS: TowelPlacement[] = [
  { x: 0.51, y: 0.49, width: 18, color: '#4f9fb3', rotation: 0.2 },
  { x: 0.64, y: 0.45, width: 17, color: '#e77a63', rotation: -0.18 },
  { x: 0.7, y: 0.4, width: 16, color: '#e1aa45', rotation: 0.13 },
  { x: 0.875, y: 0.54, width: 28, color: '#55a6b8', rotation: 0.31 },
  { x: 0.98, y: 0.56, width: 20, color: '#e4ad4f', rotation: -0.15 },
  { x: 0.735, y: 0.61, width: 25, color: '#8b70c9', rotation: 0.18 },
  { x: 0.91, y: 0.68, width: 23, color: '#46aa8d', rotation: -0.34 },
  { x: 0.62, y: 0.69, width: 21, color: '#ea7e65', rotation: 0.26 },
  { x: 0.965, y: 0.75, width: 26, color: '#3d9db6', rotation: 0.14 },
  { x: 0.82, y: 0.87, width: 24, color: '#d9688e', rotation: -0.28 },
  { x: 0.56, y: 0.95, width: 18, color: '#3c9a84', rotation: -0.17 },
]

export const DRINKS: DrinkPlacement[] = [
  { x: 0.57, y: 0.39, scale: 0.65, color: '#e9a54e' },
  { x: 0.68, y: 0.47, scale: 0.62, color: '#62aea3' },
  { x: 0.79, y: 0.43, scale: 0.9, color: '#eaa957' },
  { x: 0.89, y: 0.58, scale: 0.8, color: '#e97876' },
  { x: 0.975, y: 0.67, scale: 0.72, color: '#6db5aa' },
  { x: 0.77, y: 0.76, scale: 0.82, color: '#efbd52' },
  { x: 0.885, y: 0.9, scale: 0.68, color: '#dc7688' },
  { x: 0.64, y: 0.86, scale: 0.7, color: '#75b7c2' },
]

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

export const SHELLS: ShellPlacement[] = [
  { x: 0.49, y: 0.68, scale: 1, color: '#e97876', rotation: -0.31 },
  { x: 0.83, y: 0.9, scale: 0.92, color: '#a06446', rotation: 0.14 },
  { x: 0.96, y: 0.78, scale: 0.72, color: '#f3a958', rotation: 0.61 },
  { x: 0.972, y: 0.39, scale: 0.82, color: '#e9cda5', rotation: -0.21 },
  { x: 0.948, y: 0.46, scale: 0.72, color: '#a06446', rotation: 0.31 },
  { x: 0.962, y: 0.6, scale: 0.68, color: '#e97876', rotation: 0.19 },
  { x: 0.981, y: 0.69, scale: 0.74, color: '#e9cda5', rotation: 0.45 },
  { x: 0.951, y: 0.86, scale: 0.66, color: '#f3a958', rotation: -0.33 },
]

export const SANDCASTLES = [
  { x: 0.86, y: 0.8, scale: 0.82 },
  { x: 0.51, y: 0.91, scale: 0.58 },
  { x: 0.96, y: 0.7, scale: 0.45 },
]
