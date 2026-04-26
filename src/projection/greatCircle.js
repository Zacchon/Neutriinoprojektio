// Great-circle interpolation between two geographic points.
//
// Used to subdivide polyline edges before projecting, so long segments
// curve correctly in box-local space and so segments crossing face
// boundaries can be split cleanly during rendering.

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
  // Spherical linear interpolation (slerp) on the unit sphere:
  //   1. a_ecef = latLonToEcef(a); b_ecef = latLonToEcef(b)
  //   2. ω = acos(clamp(dot(a_ecef, b_ecef), -1, 1))
  //   3. For i in 0..n, t = i / n:
  //        p_i = (sin((1-t)·ω)/sin(ω)) · a_ecef + (sin(t·ω)/sin(ω)) · b_ecef
  //   4. Convert each p_i back to {lat, lon} via:
  //        lat = asin(p.z); lon = atan2(p.y, p.x)
  //
  // Edge cases:
  //   - ω ≈ 0 (a ≈ b): just return [a, ..., b] with linear lat/lon interp,
  //     or even just [a, b] — the points are essentially identical.
  //   - antipodal (ω ≈ π): the great circle isn't unique. Unlikely in
  //     practice for adjacent vertices in geographic data; can ignore.
  //
  // ecefToLatLon helper can live here or move to frames.js if used elsewhere.
  //
  // TODO: implement.
}
