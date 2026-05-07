// Neutrino projection: lat/lon -> face + face-local 2D coordinates.
//
// The "neutrino ray" goes from the observer's surface position toward the
// target point on Earth's surface. It exits the box through some face;
// that's where the target gets painted.

import { add, dot, scale, sub } from './vec.js'
import { latLonToEcef, ecefDirectionToBoxLocal } from './frames.js'

/**
 * Project a geographic point onto the box.
 *
 * @returns {{faceId: string, x: number, y: number} | null}
 *   x ∈ [-face.halfWidth, +face.halfWidth],
 *   y ∈ [-face.halfHeight, +face.halfHeight].
 *   Returns null only on degenerate input (target ~= observer).
 */
export const projectPoint = (target, boxFrame, box) => {
  const targetEcef = latLonToEcef(target)
  const ray = sub(targetEcef, boxFrame.origin)
  const rayLen = Math.sqrt(dot(ray, ray))
  if (rayLen < 1e-9) return null

  const dirEcef = scale(ray, 1 / rayLen)
  const dirBox = ecefDirectionToBoxLocal(dirEcef, boxFrame)

  // Observer stands at the center of the top (+Z) face, not at the box's
  // geometric center. This is what makes nearly-horizontal rays exit near
  // the top edge of a side face, per CLAUDE.md's projection convention.
  const start = [0, 0, box.dimensions.height / 2]

  // Walk each face's plane and find which one the ray pierces first.
  // t is how far along dirBox (from start) you travel to reach that plane;
  // the smallest positive t is the exit face. denom <= 0 means the ray is
  // parallel to or pointing away from the face — can't exit through it.
  let bestT = Infinity
  let bestFace = null
  for (const face of box.faces) {
    const denom = dot(dirBox, face.normal)
    if (denom <= 1e-12) continue
    const t = dot(sub(face.center, start), face.normal) / denom
    if (t > 0 && t < bestT) {
      bestT = t
      bestFace = face
    }
  }
  if (!bestFace) return null

  const hit = add(start, scale(dirBox, bestT))
  const relative = sub(hit, bestFace.center)
  return {
    faceId: bestFace.id,
    x: dot(relative, bestFace.u),
    y: dot(relative, bestFace.v),
  }
}
