// Manual verification of frames.js and faces.js.
// Run with: node src/projection/_scratch.js
// Not part of the build. Read printed values against the expected comments.

import { latLonToEcef, makeBoxFrame, ecefDirectionToBoxLocal } from './frames.js'
import { makeBox } from './faces.js'
import { projectPoint } from './neutrino.js'
import { subdivide } from './greatCircle.js'
import { dot, normalize, sub } from './vec.js'

// ----- 1. lat/lon -> ECEF -----
console.log('--- ECEF sanity ---')
console.log('North pole:        ', latLonToEcef({ lat: 90, lon: 0 }))
//   expect ~ [0, 0, 1]
console.log('Equator/Greenwich: ', latLonToEcef({ lat: 0, lon: 0 }))
//   expect ~ [1, 0, 0]
console.log('Equator/lon 90:    ', latLonToEcef({ lat: 0, lon: 90 }))
//   expect ~ [0, 1, 0]
console.log('Aalto-ish:         ', latLonToEcef({ lat: 60.18, lon: 24.83 }))
//   expect ~ [0.45, 0.21, 0.87] — NE quadrant, far north

// ----- 2. Box frame at Aalto, no rotation -----
console.log('\n--- Box frame, rotation 0° ---')
const frame = makeBoxFrame({ observerLat: 60.18, observerLon: 24.83, rotationDeg: 0 })
console.log('origin:        ', frame.origin) // ~ Aalto-ish above
console.log('up · origin:   ', dot(frame.basis.z, frame.origin)) // ~ 1
console.log('east · up:     ', dot(frame.basis.x, frame.basis.z)) // ~ 0
console.log('north · up:    ', dot(frame.basis.y, frame.basis.z)) // ~ 0
console.log('east · Z_ecef: ', dot(frame.basis.x, [0, 0, 1])) // ~ 0

// ----- 3. Direction-to-box-local -----
console.log('\n--- Ray directions ---')
const antipode = latLonToEcef({ lat: -60.18, lon: 24.83 - 180 })
const dirAnti = normalize(sub(antipode, frame.origin))
console.log('Antipode dir (box):  ', ecefDirectionToBoxLocal(dirAnti, frame))
//   expect ~ [0, 0, -1] — straight down

const north = latLonToEcef({ lat: 70, lon: 24.83 })
const dirNorth = normalize(sub(north, frame.origin))
console.log('Far-north dir (box): ', ecefDirectionToBoxLocal(dirNorth, frame))
//   expect [~0, positive, slightly negative] — mostly box-north, tilted down

// ----- 4. Box geometry -----
console.log('\n--- Box geometry ---')
const box = makeBox({ width: 100, depth: 100, height: 100 })
for (const f of box.faces) {
  console.log(
    `${f.id}: center=${f.center}  u·n=${dot(f.u, f.normal).toFixed(3)}  ` +
      `v·n=${dot(f.v, f.normal).toFixed(3)}  u·v=${dot(f.u, f.v).toFixed(3)}`
  )
}
//   all dot products should be ~0

// ----- 5. Rotation sanity -----
console.log('\n--- Box frame, rotation 90° ---')
const frameRot = makeBoxFrame({ observerLat: 60.18, observerLon: 24.83, rotationDeg: 90 })
console.log('Antipode dir (rot 90): ', ecefDirectionToBoxLocal(dirAnti, frameRot))
//   still ~ [0, 0, -1] — vertical-axis rotation doesn't move "down"
console.log('Far-north dir (rot 90):', ecefDirectionToBoxLocal(dirNorth, frameRot))
//   should now be mostly along box-X (positive), since "north" rotated
//   to where "east" was. Expect [positive, ~0, slightly negative].

// ----- 6. projectPoint -----
// Observer stands at the center of the top (+Z) face. Chord direction from
// observer to target sits θ/2 below local horizontal, where θ is the angular
// separation between observer and target on the unit sphere.
console.log('\n--- projectPoint, observer at Aalto, 100mm cube, rotation 0° ---')
const obsAalto = { observerLat: 60.18, observerLon: 24.83, rotationDeg: 0 }
const aaltoFrame = makeBoxFrame(obsAalto)
const cube = makeBox({ width: 100, depth: 100, height: 100 })

console.log('Antipode of Aalto:    ', projectPoint({ lat: -60.18, lon: 24.83 - 180 }, aaltoFrame, cube))
//   θ=180°, ray straight down → '-Z' center, x ~ 0, y ~ 0.
console.log('Far north (lat 70):   ', projectPoint({ lat: 70, lon: 24.83 }, aaltoFrame, cube))
//   θ ≈ 9.8°, ray ~5° below horizontal pointing box-north → '+Y' side,
//   y near +halfHeight=+50 (top edge).
console.log('Equator/lon 24.83:    ', projectPoint({ lat: 0, lon: 24.83 }, aaltoFrame, cube))
//   θ ≈ 60°, ray 30° below horizontal pointing box-south → '-Y' side,
//   y positive but well below top edge (upper half of side face).
console.log('Aalto itself (target = observer): ', projectPoint({ lat: 60.18, lon: 24.83 }, aaltoFrame, cube))
//   degenerate → null.

console.log('\n--- projectPoint, observer at lat 0 lon 0 ---')
const eqFrame = makeBoxFrame({ observerLat: 0, observerLon: 0, rotationDeg: 0 })
console.log('North pole:           ', projectPoint({ lat: 90, lon: 0 }, eqFrame, cube))
//   θ=90°, ray exactly 45° below horizontal pointing box-north → '+Y' side,
//   y ~ 0 (face center: ray descends from top to box-vertical-center while
//   crossing to the side wall).
console.log('Antipode (lat 0 lon 180):', projectPoint({ lat: 0, lon: 180 }, eqFrame, cube))
//   θ=180°, straight down → '-Z' center.

// ----- 7. great-circle subdivide -----
console.log('\n--- subdivide ---')

console.log('Pole to equator/Greenwich, n=4:')
console.log(subdivide({ lat: 90, lon: 0 }, { lat: 0, lon: 0 }, 4))
//   expect lats 90, 67.5, 45, 22.5, 0; lon 0 throughout (lon at pole is
//   ill-defined but atan2(0, ~0) returns 0 here).

console.log('\nEquator (lon 0) to (lon 90), n=3:')
console.log(subdivide({ lat: 0, lon: 0 }, { lat: 0, lon: 90 }, 3))
//   expect lat 0, lons 0, 30, 60, 90 — equator is itself a great circle.

console.log('\nDiagonal (0,0) to (60,60), n=4 — equal-arc check:')
const arc = subdivide({ lat: 0, lon: 0 }, { lat: 60, lon: 60 }, 4)
console.log(arc)
const ecefArc = arc.map(latLonToEcef)
console.log(
  'consecutive dot products (should all be equal):',
  ecefArc.slice(0, -1).map((p, i) => dot(p, ecefArc[i + 1]).toFixed(6))
)
//   equal dot products ⇒ equal angular spacing ⇒ equal arc lengths.

console.log('\nCoincident endpoints (degenerate), n=2:')
console.log(subdivide({ lat: 12, lon: 34 }, { lat: 12, lon: 34 }, 2))
//   expect 3 copies of {lat: 12, lon: 34}; no NaN.
