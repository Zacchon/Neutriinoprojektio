# Neutriinoprojektio

A static web app that projects Earth's geography onto the six faces of a box,
as if the Earth were transparent and you were looking outward through it from
the box's location. Intended for printed physical assembly and, later, an
artistic room-scale installation.

This is a clean rebuild from scratch. An earlier prototype exists but should
not be referenced — it accumulated bugs that this rebuild is designed to avoid.

**Current state**: Phase 1 (projection math) in progress. Components, hooks,
data pipeline, and UI are not yet implemented. Sections below labeled
"Planned" describe target architecture and should not be assumed to exist.

## Conventions

These are the most important part of this file. Most bugs in this project
come from violating one of these.

### Coordinate frames

Three 3D frames plus one 2D frame.

- **Geographic**: `{ lat, lon }` in degrees. North = +lat, East = +lon.
- **ECEF**: 3D Cartesian, origin at Earth's center, Earth treated as a unit
  sphere. +X through (lat 0, lon 0). +Y through (0, 90). +Z through the north
  pole. Right-handed.
- **Box-local**: 3D Cartesian, origin at the observer's surface position.
  +Z = local up (radial direction). +X and +Y are in the local horizontal
  plane, rotated about +Z by the user's `rotationDeg`. At `rotationDeg = 0`,
  +X = geographic east and +Y = geographic north at the observer.
- **Face-local 2D**: per-face, origin at face center. Defined by each face's
  `u` (rightward in printed image) and `v` (upward in printed image) basis
  vectors. Lives in face objects, computed in `neutrino.js`.

### Projection convention

The "neutrino ray" goes *from the observer toward the target point*, then
extends to wherever it exits the box. The face it exits through is where
the target gets painted. A point at the observer's antipode produces a
ray pointing straight down → bottom face center. A point near the observer
on Earth's surface produces a nearly horizontal ray → side face, near the
top edge.

### Units and types

- Lat/lon at module boundaries: **always degrees**. Convert to radians inside
  functions, never expose radians across boundaries.
- 3D vectors: plain `[x, y, z]` arrays, not objects.
- Lat/lon: `{ lat, lon }` objects, not arrays. (GeoJSON uses `[lon, lat]`
  arrays — convert at the boundary, don't propagate.)
- Box dimensions and face-local 2D coordinates: **millimeters**. Pick mm so
  export dimensions match physical print sizes directly.
- Rotation: degrees, positive = counterclockwise viewed from above (box-east
  rotates toward box-north).

### Edge cases

- Observer at |lat| > 89.9°: "east" is undefined at the poles. The UI should
  clamp the observer latitude before passing it to `makeBoxFrame`.
- Target point coincident with observer: degenerate zero-length ray.
  `projectPoint` returns `null` in this case. (Planned, in `neutrino.js`.)

### Face conventions

Prints are applied to the *inside* of the box and read by an observer
inside it (the same observer the projection is built around). So +u is
rightward and +v is upward from the inside viewer's POV facing each face,
not the outside viewer's. For the four side faces this means u is the
opposite direction from the outside-view convention; for top and bottom,
v is the one that flips.

Top and bottom orientation depends on which way the inside viewer is
facing when they tilt their head up or down. The canonical choice is
body-facing-+Y (north): tilting the head back to look up makes box-south
(-Y) the top of the view, and tilting it down to look at the floor makes
box-north (+Y) the top. Both top and bottom keep u = +X (east) because
rotating around the ear-to-ear axis doesn't change it.

The full u/v table lives in the comment at the top of `faces.js`. Consult
it when implementing or modifying any per-face SVG output.

### React patterns (Planned)

To be applied as components and hooks come online:

- All projection computations go through `useMemo`, keyed on the inputs
  that affect them (observer position, box dimensions, rotation, geo data).
  Never call projection functions inline in render bodies.
- Heavy work (subdivision, per-vertex projection) happens in the memo, not
  in `useEffect`. Effects are for side effects, not derived data.

## Architecture

Vite + React project deployed to GitHub Pages.

### Folder layout

```
public/
  data/                  # pre-processed TopoJSON (see "Geographic data" below)
  .nojekyll              # required for GitHub Pages
src/
  projection/            # pure JS projection math, no React imports
    vec.js               # 3D vector helpers
    frames.js            # coordinate frames
    faces.js             # box face geometry
    neutrino.js          # the projection itself (skeleton only)
    greatCircle.js       # great-circle subdivision (skeleton only)
    _scratch.js          # manual verification, not part of the build
  components/            # presentational React components (stubs only)
    BoxPreview.jsx
    Controls.jsx
    ExportPanel.jsx
  hooks/                 # data-fetching and state hooks (stubs only)
    useGeoData.js
  main.jsx               # entry point (Vite default; minimal so far)
  App.jsx                # top-level state and layout (placeholder)
```

### Boundary rule

Anything in `src/projection/` is pure JavaScript with no React imports. This
keeps the math testable in isolation and prevents a class of bugs where
projection results depend on render state.

### Geographic data

`public/data/countries.json`: Natural Earth 1:50m cultural `admin_0_countries`,
simplified to 10% retention with mapshaper, exported as TopoJSON (~99 KB).
Pre-processed once at data-prep time and committed to the repo. The app does
not regenerate or simplify at runtime; if the data needs changing, redo the
mapshaper step and replace the file.

### Data flow (Planned)

This describes the target pipeline. None of it is wired up yet.

1. `useGeoData` hook fetches `public/data/countries.json` and decodes via
   `topojson-client`.
2. The user's box parameters (observer lat/lon, box dimensions, rotation) live
   in `App.jsx` state.
3. The projection (`useMemo`-cached) walks geographic features, subdivides
   along great circles, projects each vertex through `neutrino.projectPoint`,
   and groups results by face.
4. Per-face SVG path strings are passed to face components for rendering and
   to the export panel for download.

## Verification and testing

Verification is currently manual via `src/projection/_scratch.js` — run it
with `node src/projection/_scratch.js` and read the printed values against
the expected comments. No test runner is set up; this is intentional for the
project's current scope. If automated tests are added later, they should
target `src/projection/` modules in isolation, not React components.

Note: `_scratch.js` will fail to run until all functions it imports are
implemented (or stubbed). If it errors during Phase 1, that's expected — it
means the next function to implement is the one whose import is failing.

## Commands

```bash
npm run dev        # local dev server with HMR
npm run build      # produce dist/ for deployment
npm run lint       # ESLint
npm run format     # Prettier (writes in place)
node src/projection/_scratch.js   # manual frames/faces verification
```

## Deployment

GitHub Pages via `.github/workflows/deploy.yml`. Pushes to `main` trigger a
build and deploy. Vite `base` is set to `/neutriinoprojektio/` in
`vite.config.js` — must match the repo name. `public/.nojekyll` is required
so GitHub Pages doesn't strip files starting with underscores.

The repo is currently private and not yet published; deployment will be
enabled once there's meaningful content.

## Things not to do

Lessons from past mistakes or known traps. Add to this list when a correction
comes up repeatedly during a session — the goal is to capture tacit knowledge
before it has to be re-learned.

- Don't add React imports to anything in `src/projection/`.
- Don't compute projections inline in render bodies — use `useMemo`.
- Don't use direction vectors from Earth's center for the projection ray;
  use direction vectors *from the observer*. (This was the central bug in
  the earlier prototype.)
- Don't pass radians across module boundaries; degrees only.
- Don't put GeoJSON `[lon, lat]` arrays into projection functions; convert
  to `{ lat, lon }` at the boundary.
- Don't suggest adding a test runner unprompted; manual verification via
  `_scratch.js` is the chosen approach for now.
- Don't reference or import code from the earlier prototype.
