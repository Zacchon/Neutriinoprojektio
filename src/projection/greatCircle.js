// Great-circle interpolation between two geographic points.
//
// Used to subdivide polyline edges before projecting, so long segments
// curve correctly in box-local space and so segments crossing face
// boundaries can be split cleanly during rendering.

import { dot } from './vec.js'
import { latLonToEcef } from './frames.js'

const RAD = 180 / Math.PI

const ecefToLatLon = (p) => ({
  lat: Math.asin(p[2]) * RAD,
  lon: Math.atan2(p[1], p[0]) * RAD,
})

/**
 * Subdivide the great-circle arc from a to b into n segments.
 * Returns n+1 points including both endpoints.
 *
 * @param {{lat: number, lon: number}} a
 * @param {{lat: number, lon: number}} b
 * @param {number} n - number of segments (n >= 1)
 * @returns {{lat: number, lon: number}[]}
 */
export const subdivide = (a, b, n) => {
  const aE = latLonToEcef(a)
  const bE = latLonToEcef(b)
  // ω: angle between aE and bE on the unit sphere — equivalently, the
  // great-circle arc length from a to b in radians.
  const omega = Math.acos(Math.max(-1, Math.min(1, dot(aE, bE))))

  // Coincident points: slerp degenerates (sin ω = 0). Linear lat/lon interp
  // is fine because the points are essentially the same.
  if (omega < 1e-9) {
    const out = []
    for (let i = 0; i <= n; i++) {
      const t = i / n
      out.push({ lat: a.lat + t * (b.lat - a.lat), lon: a.lon + t * (b.lon - a.lon) })
    }
    return out
  }

  // Slerp: equal-angle steps along the great circle → equal arc lengths.
  const sinOmega = Math.sin(omega)
  const out = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const c1 = Math.sin((1 - t) * omega) / sinOmega
    const c2 = Math.sin(t * omega) / sinOmega
    out.push(ecefToLatLon([
      c1 * aE[0] + c2 * bE[0],
      c1 * aE[1] + c2 * bE[1],
      c1 * aE[2] + c2 * bE[2],
    ]))
  }
  return out
}
