// Top-level layout and shared state for the app.
//
// Phase 2: render the bottom (-Z) face only, with observer hardcoded at
// Aalto and a 100mm cube. Box dimensions, observer, and rotation will lift
// into state in Phase 4.

import { useMemo } from 'react'
import { useGeoData } from './hooks/useGeoData.js'
import { makeBoxFrame } from './projection/frames.js'
import { makeBox } from './projection/faces.js'
import { projectPoint } from './projection/neutrino.js'
import { subdivide } from './projection/greatCircle.js'

const OBSERVER = { observerLat: 60.18, observerLon: 24.83, rotationDeg: 0 } // Aalto
const DIMS = { width: 100, depth: 100, height: 100 }
const FACE_ID = '-Z'
const SUBDIV_PER_EDGE = 8 // tune later; coarse enough to be fast, fine enough to look smooth
// Drop segments that sit entirely on the antimeridian or touch a pole.
// Natural Earth closes Antarctica's southern boundary by running down lon=180
// to the pole, across, and back up lon=-180 — about a dozen segments — which
// would otherwise project as radial lines from the coast to the bottom face
// center. Real coastlines don't run along |lon|=180 or reach |lat|>89, so
// these filters are safe.
const ANTIMERIDIAN_EPS = 0.001 // degrees from |lon|=180
const POLE_SKIP_LAT = 89

const onAntimeridian = (p) => Math.abs(Math.abs(p.lon) - 180) < ANTIMERIDIAN_EPS
const atPole = (p) => Math.abs(p.lat) > POLE_SKIP_LAT
const isClosureSegment = (a, b) =>
  (onAntimeridian(a) && onAntimeridian(b)) || atPole(a) || atPole(b)

const buildFacePaths = (featureCollection, frame, box, faceId) => {
  const paths = []

  const processRing = (ring) => {
    // Project every subdivided vertex along the ring, in order.
    const projected = []
    for (let i = 0; i < ring.length - 1; i++) {
      const a = { lon: ring[i][0], lat: ring[i][1] }
      const b = { lon: ring[i + 1][0], lat: ring[i + 1][1] }
      if (isClosureSegment(a, b)) {
        projected.push(null) // break the run across the skipped segment
        continue
      }
      const arc = subdivide(a, b, SUBDIV_PER_EDGE)
      // Drop the trailing duplicate so segments share endpoints exactly once
      // (except the very last segment, which keeps its endpoint).
      const slice = i < ring.length - 2 ? arc.slice(0, -1) : arc
      for (const p of slice) projected.push(projectPoint(p, frame, box))
    }

    // Group consecutive on-face points into runs; each run becomes a path.
    // Edge crossings are dropped here (Phase 3 will split them cleanly).
    let run = []
    const flush = () => {
      if (run.length >= 2) paths.push(run)
      run = []
    }
    for (const p of projected) {
      if (p && p.faceId === faceId) run.push(p)
      else flush()
    }
    flush()
  }

  for (const feature of featureCollection.features) {
    const g = feature.geometry
    if (!g) continue
    if (g.type === 'Polygon') {
      for (const ring of g.coordinates) processRing(ring)
    } else if (g.type === 'MultiPolygon') {
      for (const poly of g.coordinates) for (const ring of poly) processRing(ring)
    }
  }

  return paths
}

// Convert a run of face-local points into an SVG path string, flipping v so
// +v (up in print) maps to SVG's -y. Origin shifted so face center is at
// (halfWidth, halfHeight) in SVG coords.
const runToD = (run, face) =>
  run
    .map((p, i) => {
      const sx = p.x + face.halfWidth
      const sy = face.halfHeight - p.y
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(3)},${sy.toFixed(3)}`
    })
    .join(' ')

const App = () => {
  const { data, error } = useGeoData()

  const { face, ds } = useMemo(() => {
    if (!data) return { face: null, ds: [] }
    const box = makeBox(DIMS)
    const frame = makeBoxFrame(OBSERVER)
    const face = box.faces.find((f) => f.id === FACE_ID)
    const runs = buildFacePaths(data, frame, box, FACE_ID)
    return { face, ds: runs.map((run) => runToD(run, face)) }
  }, [data])

  if (error) return <div>Error loading geo data: {String(error.message || error)}</div>
  if (!data) return <div>Loading geo data…</div>

  const w = face.halfWidth * 2
  const h = face.halfHeight * 2

  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontFamily: 'sans-serif', fontSize: 13 }}>
        {FACE_ID} face from observer at lat {OBSERVER.observerLat}, lon {OBSERVER.observerLon}.{' '}
        {ds.length} polyline runs.
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={500}
        height={500}
        style={{ border: '1px solid #888', background: '#fafafa' }}
      >
        <rect x={0} y={0} width={w} height={h} fill="none" stroke="#ddd" strokeWidth={0.2} />
        {ds.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#222" strokeWidth={0.3} strokeLinejoin="round" />
        ))}
      </svg>
    </div>
  )
}

export default App
