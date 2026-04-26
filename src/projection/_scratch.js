// Manual verification of frames.js and faces.js.
// Run with: node src/projection/_scratch.js
// Not part of the build. Read printed values against the expected comments.

import { latLonToEcef, makeBoxFrame, ecefDirectionToBoxLocal } from './frames.js'
import { makeBox } from './faces.js'
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
