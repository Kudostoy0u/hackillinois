# HackIllinois Schedule

An ocean-themed schedule experience for HackIllinois. The site reads event data from the HackIllinois Adonix API, supports day/category/text filtering, and places the schedule over an interactive, code-drawn beach scene.

## Technology

| Technology | Role |
| --- | --- |
| React 19 | Component model and application state |
| TypeScript 5.8 | Static types for events, UI state, and canvas systems |
| Vite 7 | Development server, API proxy, and production bundling |
| React Router 7 | Schedule and credits routes |
| Framer Motion 12 | Modal, credits, and ripple animations |
| React Icons 5 | Interface iconography |
| Canvas 2D | Ocean, shoreline, beach decor, birds, and crab rendering |
| CSS | Responsive layout, visual styling, and lightweight transitions |
| Oxlint | Source linting |
| Vercel | SPA hosting and production API rewrite |

The beach illustration is generated entirely in the browser. It does not depend on a game engine, physics library, or raster background asset.

## Running locally

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Vite serves the app locally and proxies `/api/adonix` to `https://adonix.hackillinois.org/event/`, avoiding browser cross-origin restrictions during development.

Available commands:

```bash
npm run dev      # Start the Vite development server
npm run build    # Type-check and create the production bundle
npm run lint     # Lint the repository with Oxlint
npm run preview  # Preview the production bundle locally
```

## Application structure

```text
.
├── index.html                    # Document metadata, fonts, and app mount point
├── package.json                  # Dependencies and developer commands
├── package-lock.json             # Reproducible npm dependency versions
├── tsconfig.json                 # TypeScript project references
├── tsconfig.app.json             # Browser application compiler settings
├── tsconfig.node.json            # Vite configuration compiler settings
├── vercel.json                   # API and SPA production rewrites
├── vite.config.ts                # React plugin and local Adonix proxy
└── src
    ├── main.tsx                  # React root, router, and global stylesheet import
    ├── App.tsx                   # Top-level route table
    ├── config.ts                 # API, branding, timezone, and category configuration
    ├── types.ts                  # Shared event and ripple types
    ├── data
    │   └── fallbackEvents.ts     # Offline event data used if Adonix is unavailable
    ├── hooks
    │   ├── useEvents.ts          # Event request, sorting, status, and fallback logic
    │   └── useRipples.ts         # Pointer-driven water and sand ripple lifecycle
    ├── pages
    │   ├── SchedulePage.tsx      # Schedule state and primary page composition
    │   └── CreditsPage.tsx       # Credits route and source attribution
    ├── components
    │   ├── Header.tsx            # Shared logo and navigation
    │   ├── schedule
    │   │   ├── ScheduleSidebar.tsx # Day and category controls
    │   │   ├── EventsPanel.tsx     # Event list, empty state, and collapse control
    │   │   ├── EventCard.tsx       # Individual schedule entry
    │   │   └── EventModal.tsx      # Expanded event details
    │   └── beach
    │       ├── CoastalScene.tsx       # Canvas and ripple-layer composition
    │       ├── OceanCanvas.tsx        # Canvas lifecycle and renderer coordination
    │       ├── beachGeometry.ts       # Shared horizon and shoreline calculations
    │       ├── environmentRenderer.ts # Sky, sun, sand, water, waves, and birds
    │       ├── decorRenderer.ts       # Beach decor drawing and drag registration
    │       ├── drawing.ts             # Reusable canvas drawing primitives
    │       ├── sceneLayout.ts         # Named decor placements and crab route data
    │       ├── canvasDragLayer.ts     # Hit testing, bounds, offsets, and obstacles
    │       ├── crabController.ts      # Crab steering, gait, pauses, and route updates
    │       └── pathfinding.ts         # A* pathfinding and route simplification
    ├── utils
    │   ├── eventFilters.ts          # Pure day, category, and text filtering
    │   └── eventFormatters.ts       # Event category and date/time formatting
    ├── styles.css                   # Ordered stylesheet entry point
    └── styles
        ├── base.css                 # Reset, typography, tokens, and accessibility
        ├── scene.css                # Canvas, sky, sand, water, and ripple layers
        ├── header.css               # Navigation bar
        ├── schedule.css             # Imports the three schedule stylesheets below
        ├── schedule-layout.css      # Page heading, search, and schedule grid
        ├── schedule-sidebar.css     # Day and filter panels
        ├── event-cards.css          # Event panel, cards, and title sweep
        ├── modal.css                # Event modal and backdrop
        ├── credits.css              # Credits postcard page
        └── responsive.css           # Tablet, mobile, and reduced-motion rules
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Interactive schedule |
| `/credits` | Project credits and asset attribution |
| Any unmatched path | Schedule fallback |

`BrowserRouter` owns client-side navigation. The final Vercel rewrite in `vercel.json` sends non-API requests to `index.html`, allowing direct visits to `/credits`.

## Event data flow

```text
Adonix API
    ↓
useEvents
    ↓
SchedulePage
    ├── filterEvents(day, category, query)
    ├── ScheduleSidebar selects day/category
    ├── EventsPanel renders EventCard entries
    └── EventCard selection opens EventModal
```

`useEvents` is the only module that fetches schedule data. It requests the endpoint in `config.ts`, validates that the response contains events, and sorts them by start time. If the request fails or returns no events, the hook switches to `fallbackEvents.ts`. An `AbortController` cancels the request if the page unmounts.

`SchedulePage` owns all schedule state: active day, category, search query, selected event, and collapsed state. The visible event array is derived with `filterEvents`; components never mutate API data. Dates and times are rendered in `America/Chicago` using the functions in `eventFormatters.ts`.

Day changes are intentionally immediate. Cards remain in place without an overlay or page transition. Event-title hover color is a CSS-only left-to-right sweep.

## Beach rendering architecture

The environment uses a full-viewport Canvas 2D layer. `OceanCanvas` owns only lifecycle concerns: resizing for device pixel ratio, scheduling animation frames, ordering renderers, and routing pointer events.

Each frame is composed in this order:

1. `environmentRenderer` draws the sky, sand, ocean, shoreline, and waves.
2. `decorRenderer` draws and registers umbrellas, chairs, towels, drinks, balls, shells, and fixed sandcastles.
3. `crabController` updates and draws the crab.
4. `environmentRenderer` draws birds above the scene.

`drawing.ts` contains individual canvas primitives, while `sceneLayout.ts` contains declarative positions and visual options. Keeping artwork separate from placement data makes the scene easier to tune without changing rendering logic.

### Shared shoreline geometry

`beachGeometry.ts` is the single source of truth for the horizon and shoreline. Environment rendering, ripple detection, drag bounds, and crab pathfinding all use the same geometry helpers, so visual and interactive boundaries agree.

### Dragging and obstacles

`canvasDragLayer.ts` registers hit targets as decor is drawn. It resolves topmost selection, records persistent offsets, clamps objects below the sky, and exposes current decor as navigation obstacles. Sandcastles opt out of dragging; the other registered beach objects can be repositioned.

While decor is being dragged, crab motion pauses. Once the drag ends, the crab discards its stale route and calculates a new one around the updated obstacle positions.

### Crab movement

`crabController.ts` owns the crab's mutable movement state. It chooses destinations from `sceneLayout.ts`, requests routes from `pathfinding.ts`, smoothly steers between waypoints, alternates forward and lateral gaits, and normalizes its angle so it never appears upside down.

`pathfinding.ts` uses A* over a normalized grid. Cells in the ocean, near the shoreline, outside the beach bounds, or inside registered obstacles are not walkable. The resulting grid path is simplified into longer unobstructed segments before animation.

### Shells and ripples

Shells use the same canvas drag layer as the other beach decor. `useRipples` handles environmental pointer effects: moving over water produces ripples, while sand requires the pointer to be pressed. Ripple records expire automatically and are rendered by `CoastalScene`.

## Styling organization

`src/styles.css` imports feature stylesheets in a deliberate cascade order. Schedule styling is further split into layout, sidebar, and event-card concerns through `styles/schedule.css`. Shared colors, typography, focus behavior, and selection rules live in `base.css`; viewport-specific overrides stay in `responsive.css`.

The interface uses DM Sans for UI text and Fraunces for display headings. Reduced-motion preferences disable continuous scene motion and nonessential transitions.

## Deployment

The production build is generated in `dist/` with `npm run build`. On Vercel:

- `/api/adonix` is rewritten to the HackIllinois event endpoint.
- all other paths are rewritten to `index.html` for client-side routing.

Before deploying, run:

```bash
npm run build
npm run lint
```

## Design principles

- Pages own feature state; leaf components receive values and callbacks through props.
- API access belongs in hooks, not visual components.
- Pure calculations live in utilities or focused domain modules.
- Shared types, configuration, and geometry each have one source of truth.
- Canvas primitives draw one object; renderers compose related visual layers.
- Layout data is represented with named objects instead of positional tuples.
- Interactive behavior respects reduced-motion and keyboard-accessibility needs where applicable.

## Credits

The beach, ocean, waves, shells, birds, and interactions are original code-native artwork by Kundan Baliga. Additional branding and library attribution is available on the in-app `/credits` page.
