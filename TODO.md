# TODO

Working list for Neutriinoprojektio. Used alongside `CLAUDE.md` — at session
start, load both and work on whatever is under "Now". When a phase is fully
complete, collapse it to a single line referencing the commit range. Keep
the active surface of this file small; archive ruthlessly.

Last updated: Phase 2 complete — single-face (-Z) render verified visually. Phase 3 (all six faces) next.

## Now

→ Phase 3: render all six faces in a grid. Generalize the `useMemo`
projection in `App.jsx` to produce paths per face and lay them out as
six SVGs.

## Phase 1: Projection math — done (d4ffdcf..67d4d2e)

`vec.js`, `frames.js`, `faces.js`, `neutrino.projectPoint`,
`greatCircle.subdivide`. Verified manually via `_scratch.js`.

## Phase 2: Render one face, hardcoded — done (1230f51..c17ba66)

`useGeoData` loads the country TopoJSON; `App.jsx` renders the bottom
(-Z) face as inline SVG with observer hardcoded at Aalto. Antimeridian /
pole closure segments in the Natural Earth source filtered out so
Antarctica's outline is clean.

## Phase 3: All six faces

- [x] Render all six faces as separate SVGs in a simple grid layout
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
- [ ] Optional layers: country borders, lakes, rivers, graticule.
- [ ] Filled polygons / per-country colors. See parking lot — needs run
      stitching to produce closed paths that survive face crossings.
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
  observer position indicator, axes) — probably useful during Phase 3
  for visual debugging.
- Filled polygons (for colored fills, lakes, etc.) need a different run
  topology than the open polylines we currently emit. A polygon ring that
  visits faces in order A → B → A produces two separate runs on A; the
  fill would need them stitched into a single closed path with the edge
  crossings as connectors, plus per-face clipping so the fill doesn't
  bleed past face boundaries. Defer until we actually want fills.

## Session notes

Lessons from past sessions, distinct from the forward-looking parking lot.
Things worth remembering about how the work has gone.

- (none yet)
