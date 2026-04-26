// Coordinate frames and conversions for the neutrino projection.
//
// This module covers the 3D frames; face-local 2D is defined per-face in faces.js and computed in neutrino.js.
//
// Frames in play:
//   - Geographic: { lat, lon } in degrees.
//   - ECEF (Earth-Centered, Earth-Fixed): 3D Cartesian, origin at Earth's center, unit sphere
//     +X axis goes through (lat 0, lon 0), +Y through (0, 90), +Z through north pole.
//   - Box-local: 3D Cartesian, origin at the observer's surface position,
//     +Z = local up, +X/+Y in the local horizontal plane,
//     rotated about local up by the user's box rotation.
//
// All angles at module boundaries are in degrees.

import { cross, dot, normalize } from './vec.js'

const DEG = Math.PI / 180

/**
 * Convert geographic coordinates to a unit ECEF vector.
 * @param {{lat: number, lon: number}} latLon - degrees
 * @returns {[number, number, number]}
 */
export const latLonToEcef = ({ lat, lon }) => {
  const phi = lat * DEG
  const lambda = lon * DEG
  const cosPhi = Math.cos(phi)
  return [cosPhi * Math.cos(lambda), cosPhi * Math.sin(lambda), Math.sin(phi)]
}

/**
 * Build the box's coordinate frame at the observer's surface location.
 *
 * Returns the following unit vectors:
 *   origin  — observer's ECEF position
 *   basis.x — "box east"  (after rotation), expressed in ECEF
 *   basis.y — "box north" (after rotation), expressed in ECEF
 *   basis.z — "up", radial; unaffected by rotation about the vertical axis
 *
 * Rotation convention: positive rotationDeg rotates the box counterclockwise
 * viewed from above (i.e., box-east rotates toward box-north).
 *
 * Edge case: at |lat| > 89.9°, "east" is undefined. Caller should validate.
 */
export const makeBoxFrame = ({ observerLat, observerLon, rotationDeg }) => {
  // Unrotated ENU (East-North-Up) basis
  const up = latLonToEcef({ lat: observerLat, lon: observerLon })

  // Z_ecef = [0, 0, 1] points through the north pole
  const east = normalize(cross([0, 0, 1], up))
  const north = cross(up, east)

  // Rotate "east" and "north" about vector "up" by rotationDeg
  const theta = rotationDeg * DEG
  const c = Math.cos(theta)
  const s = Math.sin(theta)

  const boxX = [c * east[0] + s * north[0], c * east[1] + s * north[1], c * east[2] + s * north[2]]
  const boxY = [
    -s * east[0] + c * north[0],
    -s * east[1] + c * north[1],
    -s * east[2] + c * north[2],
  ]
  const boxZ = up

  return {
    origin: up,
    basis: { x: boxX, y: boxY, z: boxZ },
  }
}

/**
 * Rotation: express an ECEF *direction* vector in box-local coordinates.
 * For directions only — does not subtract origin. (For points: subtract
 * boxFrame.origin from the point first, then call this.)
 */
export const ecefDirectionToBoxLocal = (dirEcef, boxFrame) => {
  return [
    dot(dirEcef, boxFrame.basis.x),
    dot(dirEcef, boxFrame.basis.y),
    dot(dirEcef, boxFrame.basis.z),
  ]
}
