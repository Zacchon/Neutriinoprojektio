// Box geometry: six faces in box-local coordinates.
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
// Convention: viewing each face from *outside* the box, +u is rightward and
// +v is upward in the printed image, so face prints are right-reading when
// applied to the physical box.
//
// The bottom face (-Z) has v flipped relative to the top — without this,
// geography south of the antipode would print mirrored.
//
// Claude's note:
// There are multiple defensible orientations for the bottom face print
// depending on which axis you imagine flipping around to wrap it onto the box;
// this is one. Adjust here if it's wrong for your physical-print workflow.

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
      u: [0, 1, 0], // box +Y (north)
      v: [0, 0, 1], // box +Z (up)
      halfWidth: hy,
      halfHeight: hz,
    },
    {
      id: '-X',
      center: [-hx, 0, 0],
      normal: [-1, 0, 0],
      u: [0, -1, 0], // box -Y (south)
      v: [0, 0, 1],
      halfWidth: hy,
      halfHeight: hz,
    },
    {
      id: '+Y',
      center: [0, hy, 0],
      normal: [0, 1, 0],
      u: [-1, 0, 0], // box -X (west)
      v: [0, 0, 1],
      halfWidth: hx,
      halfHeight: hz,
    },
    {
      id: '-Y',
      center: [0, -hy, 0],
      normal: [0, -1, 0],
      u: [1, 0, 0], // box +X (east)
      v: [0, 0, 1],
      halfWidth: hx,
      halfHeight: hz,
    },
    {
      id: '+Z',
      center: [0, 0, hz],
      normal: [0, 0, 1],
      u: [1, 0, 0], // box +X (east)
      v: [0, 1, 0], // box +Y (north)
      halfWidth: hx,
      halfHeight: hy,
    },
    {
      id: '-Z',
      center: [0, 0, -hz],
      normal: [0, 0, -1],
      u: [1, 0, 0], // box +X (east)
      v: [0, -1, 0], // box -Y (south) — flipped, see top-of-file note
      halfWidth: hx,
      halfHeight: hy,
    },
  ]

  return { dimensions: { width, depth, height }, faces }
}
