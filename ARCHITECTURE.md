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
    |-- day tabs swap the derived event list immediately
    `-- CoastalScene and ShellToss render background interactions
```

## Folder map

- `config.ts`: URLs, timezone, and event-category presentation.
- `types.ts`: shared domain and UI types.
- `data/fallbackEvents.ts`: offline schedule data.
- `utils/eventFormatters.ts`: pure event classification/date formatting.
- `utils/eventFilters.ts`: pure day, category, and text filtering.
- `hooks/useEvents.ts`: the only event-fetching code.
- `hooks/useRipples.ts`: pointer-to-surface detection and ripple lifetime.
- `components/Header.tsx`: shared navigation.
- `components/schedule/`: sidebar, event panel, cards, and modal.
- `components/beach/beachGeometry.ts`: the shared horizon and shoreline model.
- `components/beach/drawing.ts`: pure canvas drawing functions.
- `components/beach/pathfinding.ts`: pure A* pathfinding.
- `components/beach/canvasDragLayer.ts`: hit testing and drag offsets for canvas objects.
- `components/beach/sceneLayout.ts`: declarative positions for beach decor and crabs.
- `components/beach/environmentRenderer.ts`: sky, sand, water, waves, and birds.
- `components/beach/decorRenderer.ts`: decor drawing and drag-target registration.
- `components/beach/crabController.ts`: crab movement, pathfinding, and drag pauses.
- `components/beach/OceanCanvas.tsx`: canvas lifecycle and renderer coordination.
- `components/beach/useShellPhysics.ts`: shell dragging and surface-glide physics.
- `components/beach/ShellToss.tsx`: shell definitions and presentation.
- `pages/`: page-level state and composition.
- `styles.css`: ordered CSS entry point; `styles/` groups rules by feature.
- `tests/core.test.mjs`: behavior tests loaded through Vite and run by Node.

## Design rules

- Pages own state; leaf components receive data through props.
- API access lives in hooks, not visual components.
- Formatting and pathfinding are pure functions, so they can be explained and tested independently.
- Shared constants and types have one source of truth.
- Canvas primitives draw one object each; renderers compose related visual layers.
- Beach geometry has one source of truth shared by rendering, physics, ripples, and pathfinding.

## Core interactions

### Loading and filtering events

`useEvents` requests the Adonix endpoint. A successful response is sorted once; a failed
response uses `fallbackEvents.ts`. `SchedulePage` derives the visible list from three
inputs: active day, selected category, and search text. No component mutates event data.

### Changing days

The active day is ordinary page state. Selecting a tab updates it immediately, and the
derived event list renders synchronously without a transition layer.

### Collapsing the schedule

`eventsCollapsed` lives in `SchedulePage`. `EventsPanel` fades out when it is true,
and `ScheduleSidebar` shows the expand control. Both controls update the same state.

### Drawing and moving crabs

`sceneLayout.ts` defines normalized positions and destinations. The drag layer turns
the current positions of chairs and other decor into live obstacles. When an object
moves, `OceanCanvas` discards the crab's old route and asks `pathfinding.ts` for a new
A* route before advancing toward the next waypoint.

### Shells and ripples

`ShellToss` uses pointer capture so dragging remains stable outside a shell's bounds.
On release, velocity decays with different damping over sand and water. Entering the
water calls `addRipple`; `useRipples` also creates water ripples on hover and sand
ripples while pressing.

## Verification

- `npm run build`: type-check and create the production bundle.
- `npm run lint`: run the repository linter.
- `npm test`: run the nine core behavior tests.
