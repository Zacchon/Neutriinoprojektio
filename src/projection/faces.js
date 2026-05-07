// Box geometry: six faces in box-local coordinates, plus face-related
// helpers (face-local basis projection, shared-edge snapping).
//
// Box geometry is defined here in a canonical (unrotated) box-local frame.
// The user's rotation lives in the *frame* (frames.js), not the box itself —
// this separation prevents a class of "did I rotate twice?" bugs.
//
// Each face has:
//   id:         '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z'
//   center:     face center, in box-local coords
//   normal:     outward unit normal, in box-local coords
//   u, v:       in-plane orthonormal basis; (u, v) define the face-local 2D
//               coordinate system used for SVG output and printing
//   halfWidth:  extent along u (face spans u ∈ [-halfWidth, +halfWidth])
//   halfHeight: extent along v
//
// Convention: prints are applied to the *inside* of the box, so an observer
// inside the box reads them right-side-up. (u, v) is therefore right/up
// from the inside viewer's POV, not the outside. For the side faces this
// means u points the opposite direction from the outside-view convention;
// for the top and bottom it means v flips.
//
// Top/bottom orientation depends on which way the inside viewer is facing
// when they tilt their head up or down. We pick body-facing-+Y (north) as
// canonical: head-tilt-back to look up makes "south" the top of the view
// (so +Z face has v = -Y), and head-tilt-down to look at the floor makes
// "north" the top of the view (so -Z face has v = +Y). u stays +X (east)
// on both because rotating around the ear-to-ear axis doesn't change it.

import { dot, scale, sub } from './vec.js'

/**
 * @param {{width: number, depth: number, height: number}} dims - in mm
 *   width  = box extent along +X (east-west)
 *   depth  = box extent along +Y (north-south)
 *   height = box extent along +Z (up-down)
 */
export const makeBox = ({ width, depth, height }) => {
  const hx = width / 2
  const hy = depth / 2
  const hz = height / 2

  const faces = [
    {
      id: '+X',
      center: [hx, 0, 0],
      normal: [1, 0, 0],
      u: [0, -1, 0], // box -Y (south) — right for inside viewer facing +X
      v: [0, 0, 1], // box +Z (up)
      halfWidth: hy,
      halfHeight: hz,
    },
    {
      id: '-X',
      center: [-hx, 0, 0],
      normal: [-1, 0, 0],
      u: [0, 1, 0], // box +Y (north) — right for inside viewer facing -X
      v: [0, 0, 1],
      halfWidth: hy,
      halfHeight: hz,
    },
    {
      id: '+Y',
      center: [0, hy, 0],
      normal: [0, 1, 0],
      u: [1, 0, 0], // box +X (east) — right for inside viewer facing +Y
      v: [0, 0, 1],
      halfWidth: hx,
      halfHeight: hz,
    },
    {
      id: '-Y',
      center: [0, -hy, 0],
      normal: [0, -1, 0],
      u: [-1, 0, 0], // box -X (west) — right for inside viewer facing -Y
      v: [0, 0, 1],
      halfWidth: hx,
      halfHeight: hz,
    },
    {
      id: '+Z',
      center: [0, 0, hz],
      normal: [0, 0, 1],
      u: [1, 0, 0], // box +X (east)
      v: [0, -1, 0], // box -Y (south) — top of view when tilting head back
      halfWidth: hx,
      halfHeight: hy,
    },
    {
      id: '-Z',
      center: [0, 0, -hz],
      normal: [0, 0, -1],
      u: [1, 0, 0], // box +X (east)
      v: [0, 1, 0], // box +Y (north) — top of view when tilting head down
      halfWidth: hx,
      halfHeight: hy,
    },
  ]

  return { dimensions: { width, depth, height }, faces }
}

/**
 * Express a 3D box-local point in a face's (u, v) basis.
 * Returns { x, y } in face-local 2D coords (mm), the same convention as
 * projectPoint's output.
 */
export const toFaceLocal = (point3d, face) => {
  const rel = sub(point3d, face.center)
  return { x: dot(rel, face.u), y: dot(rel, face.v) }
}

/**
 * Snap a 3D box-local point onto the shared edge of two adjacent faces.
 * Two faces share an edge iff their normals are perpendicular (true for
 * any pair of distinct cube faces except opposite ones, e.g. +X / -X).
 *
 * Method: subtract the point's offset from each face's plane along that
 * face's normal. Because the normals are perpendicular, removing the
 * B-normal component doesn't disturb the A-normal component, so the result
 * lies on both planes — i.e., on their shared edge.
 *
 * Returns null for parallel-normal (opposite) face pairs.
 */
export const snapToSharedEdge = (point3d, faceA, faceB) => {
  if (Math.abs(dot(faceA.normal, faceB.normal)) > 1e-9) return null
  const offsetA = dot(point3d, faceA.normal) - dot(faceA.center, faceA.normal)
  const offsetB = dot(point3d, faceB.normal) - dot(faceB.center, faceB.normal)
  return sub(sub(point3d, scale(faceA.normal, offsetA)), scale(faceB.normal, offsetB))
}
