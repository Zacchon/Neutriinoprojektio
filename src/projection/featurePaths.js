// Pipeline that turns a GeoJSON FeatureCollection into per-face polylines
// in face-local 2D, ready for SVG / export. Pure JS; depends on the rest of
// projection/ but no React.
//
// Stages:
//   1. Walk each Polygon / MultiPolygon ring's vertex pairs.
//   2. Subdivide the great-circle arc between each pair (slerp).
//   3. Project each subdivided vertex through projectPoint.
//   4. Bucket consecutive same-face points into runs, keyed by faceId.
//   5. On a face change, snap the midpoint of the two 3D hits onto the
//      shared edge so neighbouring runs meet exactly at the boundary.
//   6. Drop "closure" segments that are artefacts of how source data
//      represents polygons crossing the antimeridian or touching a pole.

import { projectPoint } from './neutrino.js'
import { subdivide } from './greatCircle.js'
import { snapToSharedEdge, toFaceLocal } from './faces.js'

const SUBDIV_PER_EDGE = 8

// Source-data closure detection. Natural Earth closes Antarctica's southern
// boundary by running down lon=180 to the pole, across, and back up lon=-180
// — about a dozen segments — which would otherwise project as radial lines
// from the coast to the bottom face center. Real coastlines don't run along
// |lon|=180 or reach |lat|>89, so these filters are safe.
const ANTIMERIDIAN_EPS = 0.001 // degrees from |lon|=180
const POLE_SKIP_LAT = 89

const onAntimeridian = (p) => Math.abs(Math.abs(p.lon) - 180) < ANTIMERIDIAN_EPS
const atPole = (p) => Math.abs(p.lat) > POLE_SKIP_LAT
const isClosureSegment = (a, b) =>
  (onAntimeridian(a) && onAntimeridian(b)) || atPole(a) || atPole(b)

/**
 * Build per-face polyline runs from a GeoJSON FeatureCollection.
 *
 * @returns {{ [faceId: string]: Array<Array<{x: number, y: number}>> }}
 *   Each run is an ordered list of face-local 2D points; each face has zero
 *   or more runs. Runs are open polylines (first ≠ last vertex in general).
 */
export const buildAllFacePaths = (featureCollection, frame, box) => {
  const facePaths = Object.fromEntries(box.faces.map((f) => [f.id, []]))
  const faceById = Object.fromEntries(box.faces.map((f) => [f.id, f]))

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
    let lastProj = null
    const flush = () => {
      if (run.length >= 2 && runFace) facePaths[runFace].push(run)
      run = []
      runFace = null
    }
    for (const p of projected) {
      if (!p) {
        flush()
        lastProj = null
        continue
      }
      if (runFace && p.faceId !== runFace && lastProj) {
        const faceA = faceById[runFace]
        const faceB = faceById[p.faceId]
        const mid = [
          (lastProj.hit[0] + p.hit[0]) / 2,
          (lastProj.hit[1] + p.hit[1]) / 2,
          (lastProj.hit[2] + p.hit[2]) / 2,
        ]
        const edge3d = snapToSharedEdge(mid, faceA, faceB)
        if (edge3d) {
          run.push(toFaceLocal(edge3d, faceA))
          if (run.length >= 2) facePaths[runFace].push(run)
          run = [toFaceLocal(edge3d, faceB)]
          runFace = p.faceId
        } else {
          flush()
          runFace = p.faceId
        }
      } else if (!runFace) {
        runFace = p.faceId
      }
      run.push({ x: p.x, y: p.y })
      lastProj = p
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

/**
 * Convert a run of face-local 2D points into an SVG path "d" attribute,
 * with the face's center placed at (halfWidth, halfHeight) in SVG coords
 * and v flipped so +v (up in print) maps to SVG's -y.
 */
export const runToSvgPath = (run, face) =>
  run
    .map((p, i) => {
      const sx = p.x + face.halfWidth
      const sy = face.halfHeight - p.y
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(3)},${sy.toFixed(3)}`
    })
    .join(' ')

/**
 * Build a standalone SVG document for a single face, sized in millimetres.
 * The width/height attributes carry the `mm` unit and the viewBox uses
 * 1 user-unit = 1mm, so when printed at 100% scale the print matches the
 * physical face dimensions exactly. Includes a thin border rectangle as a
 * cut-line guide.
 */
export const buildFaceSvg = (face, ds) => {
  const w = face.halfWidth * 2
  const h = face.halfHeight * 2
  const paths = ds
    .map((d) => `  <path d="${d}" fill="none" stroke="black" stroke-width="0.3"/>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">
  <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="black" stroke-width="0.1"/>
${paths}
</svg>
`
}
