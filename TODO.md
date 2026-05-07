# TODO

Working list for Neutriinoprojektio. Used alongside `CLAUDE.md` — at session
start, load both and work on whatever is under "Now". When a phase is fully
complete, collapse it to a single line referencing the commit range. Keep
the active surface of this file small; archive ruthlessly.

Last updated: Phase 2 in progress — `useGeoData` complete (242 features). Single-face render next.

## Now

→ Phase 2: render the bottom (-Z) face as inline SVG in `App.jsx`, observer
hardcoded at Aalto, 100mm cube. Subdivide each ring, project each vertex,
drop off-face points, build path strings. (-Z chosen over +Z because the
observer sits at the +Z face center — no rays land there.)

## Phase 1: Projection math

Already done: `vec.js`, `faces.js` (skeletons with full implementations of
`makeBox`).

- [x] `frames.js`: implement `latLonToEcef`
      _Done when: scratch section 1 prints values matching the comments._
- [x] `frames.js`: implement `makeBoxFrame`
      _Done when: scratch section 2 shows orthogonal basis at Aalto and
      rotation 90° rotates east/north correctly._
      _Blocked by: latLonToEcef._
- [x] `frames.js`: implement `ecefDirectionToBoxLocal`
      _Done when: scratch section 3 shows antipode direction ~ [0, 0, -1]
      and far-north direction has the expected sign pattern._
      _Blocked by: makeBoxFrame._
- [x] `neutrino.js`: implement `projectPoint` with ray-face intersection
      _Done when: a hand-picked test point (Aalto antipode, point due north
      on surface, etc.) produces face id and (x, y) consistent with intuition._
      _Blocked by: frames.js complete._
- [x] `greatCircle.js`: implement `subdivide`
      _Done when: subdivide between two known points produces a smooth arc
      (intermediate points lie on the great circle, lengths roughly equal)._

## Phase 2: Render one face, hardcoded

- [x] `useGeoData` hook fetches the country TopoJSON and decodes via
      `topojson-client`. Logs feature count to verify load. (242 features.)
- [ ] Render a single face (bottom, -Z) as inline `<svg>` in `App.jsx`, with
      hardcoded box dimensions and observer at Aalto. Subdivide each ring,
      project each vertex, drop off-face points, build path strings.
      (Note: with the observer at the +Z face center, no rays land on +Z, so
      that face is always empty. -Z is the meaningful "look-through-Earth"
      face — projects the antipodal hemisphere.)
- [ ] Visual sanity check: bottom face from Aalto should show roughly the
      Antarctic / Southern Ocean region. If it doesn't, the projection
      is wrong, not the rendering.

## Phase 3: All six faces

- [ ] Render all six faces as separate SVGs in a simple grid layout
      (cube unfold comes later in polish).
- [ ] Handle face-edge crossings: when a subdivided polyline segment
      crosses from one face to another, split it cleanly so each face
      shows its own portion.

## Phase 4: Interactivity

- [ ] Lift box dimensions, rotation, observer lat/lon into `App.jsx` state.
      Wrap projection in `useMemo` keyed on those + geo data.
- [ ] Build `Controls.jsx` with sliders / number inputs for the parameters.
- [ ] Verify performance during slider drag. If janky: reduce subdivision
      density during interaction, increase on release. (Don't pre-optimize.)

## Phase 5: Export

- [ ] Single-face SVG download, sized in mm to match physical print.
- [ ] All-faces export as a zip via JSZip (or similar).

## Phase 6: Polish — loose backlog, not committed

These are candidates, not commitments. Re-evaluate after Phase 5.

- [ ] Cube-unfold layout for face previews instead of grid.
- [ ] Optional layers: country borders, lakes, graticule.
- [ ] Visual styling pass on the page itself.
- [ ] Explanatory writing and visuals about the projection concept.

## Notes / parking lot

Forward-looking ideas, deferred decisions, things to reconsider later.
Not tasks; promote to a phase when ready, or delete if no longer relevant.

- Decide whether to keep `_scratch.js` long-term or migrate to a real test
  runner. Currently intentional per CLAUDE.md.
- 10% simplification may look too blocky on-screen even if fine for printed
  box. If so, try 15–20% with Visvalingam-weighted, or a separate
  on-screen-detail file.
- If subdivision becomes a performance hot spot during slider interaction,
  consider Web Workers or a coarser-during-drag strategy. Probably not
  needed at expected feature counts.
- Bottom face u/v orientation has multiple defensible choices depending on
  how the print is wrapped onto the box. Revisit when first physical
  prototype is assembled.
- Consider whether to expose a "show debug overlay" mode (face boundaries,
  observer position indicator, axes) — probably useful during Phase 2–3
  for visual debugging.

## Session notes

Lessons from past sessions, distinct from the forward-looking parking lot.
Things worth remembering about how the work has gone.

- (none yet)
