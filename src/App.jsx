// Top-level layout and shared state for the app.
//
// Phase 3 (in progress): render all six faces as a 3x2 grid of inline SVGs.
// Observer hardcoded at Aalto, 100mm cube. Box dimensions, observer, and
// rotation will lift into state in Phase 4. Edge-crossing splits come later
// in Phase 3.

import { useMemo } from 'react'
import { useGeoData } from './hooks/useGeoData.js'
import { makeBoxFrame } from './projection/frames.js'
import { makeBox } from './projection/faces.js'
import { projectPoint } from './projection/neutrino.js'
import { subdivide } from './projection/greatCircle.js'

const OBSERVER = { observerLat: 60.18, observerLon: 24.83, rotationDeg: 0 } // Aalto
const DIMS = { width: 100, depth: 100, height: 100 }
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

// Project every ring vertex once and bucket consecutive same-face points
// into runs, keyed by faceId. A run breaks at face changes, closure segments,
// or projection failures. Edge crossings drop a connector segment between
// the last on-face point and the first on-the-next-face point — the second
// Phase 3 task will split those cleanly.
const buildAllFacePaths = (featureCollection, frame, box) => {
  const facePaths = Object.fromEntries(box.faces.map((f) => [f.id, []]))

  const processRing = (ring) => {
    const projected = []
    for (let i = 0; i < ring.length - 1; i++) {
      const a = { lon: ring[i][0], lat: ring[i][1] }
      const b = { lon: ring[i + 1][0], lat: ring[i + 1][1] }
      if (isClosureSegment(a, b)) {
        projected.push(null)
        continue
      }
      const arc = subdivide(a, b, SUBDIV_PER_EDGE)
      const slice = i < ring.length - 2 ? arc.slice(0, -1) : arc
      for (const p of slice) projected.push(projectPoint(p, frame, box))
    }

    let run = []
    let runFace = null
    const flush = () => {
      if (run.length >= 2 && runFace) facePaths[runFace].push(run)
      run = []
      runFace = null
    }
    for (const p of projected) {
      if (!p) {
        flush()
        continue
      }
      if (p.faceId !== runFace) {
        flush()
        runFace = p.faceId
      }
      run.push(p)
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

  return facePaths
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

const FacePreview = ({ face, ds, sizePx }) => {
  const w = face.halfWidth * 2
  const h = face.halfHeight * 2
  return (
    <div>
      <div style={{ fontFamily: 'sans-serif', fontSize: 12, marginBottom: 4 }}>
        {face.id} · {ds.length} runs
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={sizePx}
        height={(sizePx * h) / w}
        style={{ border: '1px solid #888', background: '#fafafa', display: 'block' }}
      >
        <rect x={0} y={0} width={w} height={h} fill="none" stroke="#ddd" strokeWidth={0.2} />
        {ds.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#222" strokeWidth={0.3} strokeLinejoin="round" />
        ))}
      </svg>
    </div>
  )
}

const App = () => {
  const { data, error } = useGeoData()

  const faceData = useMemo(() => {
    if (!data) return null
    const box = makeBox(DIMS)
    const frame = makeBoxFrame(OBSERVER)
    const facePaths = buildAllFacePaths(data, frame, box)
    return box.faces.map((face) => ({
      face,
      ds: facePaths[face.id].map((run) => runToD(run, face)),
    }))
  }, [data])

  if (error) return <div>Error loading geo data: {String(error.message || error)}</div>
  if (!faceData) return <div>Loading geo data…</div>

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: 13 }}>
        Observer at lat {OBSERVER.observerLat}, lon {OBSERVER.observerLon}, rotation{' '}
        {OBSERVER.rotationDeg}°. Box {DIMS.width}×{DIMS.depth}×{DIMS.height} mm.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, max-content)',
          gap: 16,
        }}
      >
        {faceData.map(({ face, ds }) => (
          <FacePreview key={face.id} face={face} ds={ds} sizePx={260} />
        ))}
      </div>
    </div>
  )
}

export default App
