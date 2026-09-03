# Codebase guide

The app is organized by responsibility so each file answers one question.

## Start here

1. `src/App.tsx` maps URLs to pages.
2. `src/pages/SchedulePage.tsx` owns schedule state and composes the interface.
3. `src/hooks/useEvents.ts` loads API data and falls back safely.
4. `src/components/schedule/` contains focused schedule UI.
5. `src/components/beach/` contains the decorative scene and interactions.

## Data flow

```text
Adonix API
    |
useEvents
    |
SchedulePage
    |-- filters events by day, category, and query
    |-- EventCard opens EventModal
    |-- DayWave masks day changes
    `-- CoastalScene and ShellToss render background interactions
```

## Folder map

- `config.ts`: URLs, timezone, and event-category presentation.
- `types.ts`: shared domain and UI types.
- `data/fallbackEvents.ts`: offline schedule data.
- `utils/eventFormatters.ts`: pure event classification/date formatting.
- `hooks/useEvents.ts`: the only event-fetching code.
- `hooks/useRipples.ts`: pointer-to-surface detection and ripple lifetime.
- `components/Header.tsx`: shared navigation.
- `components/schedule/`: sidebar, event panel, cards, modal, and day transition.
- `components/beach/drawing.ts`: pure canvas drawing functions.
- `components/beach/pathfinding.ts`: pure A* pathfinding.
- `components/beach/canvasDragLayer.ts`: hit testing and drag offsets for canvas objects.
- `components/beach/sceneLayout.ts`: declarative positions for beach decor and crabs.
- `components/beach/OceanCanvas.tsx`: scene lifecycle and animation.
- `components/beach/ShellToss.tsx`: draggable shell physics.
- `pages/`: page-level state and composition.
- `styles.css`: ordered CSS entry point; `styles/` groups rules by feature.

## Design rules

- Pages own state; leaf components receive data through props.
- API access lives in hooks, not visual components.
- Formatting and pathfinding are pure functions, so they can be explained and tested independently.
- Shared constants and types have one source of truth.
- Canvas primitives draw one object each; `OceanCanvas` only arranges and animates them.

## Core interactions

### Loading and filtering events

`useEvents` requests the Adonix endpoint. A successful response is sorted once; a failed
response uses `fallbackEvents.ts`. `SchedulePage` derives the visible list from three
inputs: active day, selected category, and search text. No component mutates event data.

### Changing days

The page starts `DayWave` in its `cover` phase. Once the wave covers the event panel,
the page changes the selected day and switches the wave to `reveal`. The cards therefore
change only while covered. Completing `reveal` clears the transition state.

### Collapsing the schedule

`eventsCollapsed` lives in `SchedulePage`. `EventsPanel` fades out when it is true,
and `ScheduleSidebar` shows the expand control. Both controls update the same state.

### Drawing and moving crabs

`sceneLayout.ts` defines normalized positions, destinations, and obstacles. On each
animation frame, `OceanCanvas` asks `pathfinding.ts` for an A* route when a crab needs
a new destination, advances it toward the next waypoint, then calls the single-purpose
`drawCrab` primitive.

### Shells and ripples

`ShellToss` uses pointer capture so dragging remains stable outside a shell's bounds.
On release, velocity decays with different damping over sand and water. Entering the
water calls `addRipple`; `useRipples` also creates water ripples on hover and sand
ripples while pressing.
