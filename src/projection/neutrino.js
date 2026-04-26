// Neutrino projection: lat/lon -> face + face-local 2D coordinates.
//
// The "neutrino ray" goes from the observer's surface position toward the
// target point on Earth's surface. It exits the box through some face;
// that's where the target gets painted.

import { dot, normalize, scale, sub } from './vec.js'
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
  // 1. Ray direction.
  //      P_ecef   = latLonToEcef(target)
  //      dir_ecef = normalize(P_ecef - boxFrame.origin)
  //      dir_box  = ecefDirectionToBoxLocal(dir_ecef, boxFrame)
  //
  // 2. Find which face the ray hits. The ray originates at box center
  //    (= observer in box-local), so parameterize as t · dir_box.
  //    Each face plane: { P : dot(P, normal) = dot(center, normal) }.
  //    Solve: t = dot(center, normal) / dot(dir_box, normal).
  //
  //    Skip faces where dot(dir_box, normal) <= 0 (ray points away).
  //    Among the rest, pick the smallest positive t whose hit point falls
  //    within the face rectangle. For a box with the observer at center,
  //    exactly one face will satisfy this.
  //
  //    NB: the "biggest dot product with normal" shortcut is wrong for
  //    non-cube boxes — use the explicit ray-plane test.
  //
  // 3. Face-local 2D:
  //      hit      = scale(dir_box, t)
  //      relative = sub(hit, face.center)
  //      x = dot(relative, face.u)
  //      y = dot(relative, face.v)
  //
  // TODO: implement.
}
