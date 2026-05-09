// Renders the five-face cross-unfold preview. Pure presentation: receives
// precomputed per-face SVG path strings via `faceData` and lays them out
// in a CSS grid sized in mm × pxPerMm, so each face's pixel dimensions
// are proportional to its physical dimensions.
//
// Layout:
//   [-X]    [+Y]    [+X]    [-Y]
//             [-Z]
//
// +Z is omitted because the observer sits at its center and no rays land
// on it — it would always be empty.
// Adjacent cells share an edge in 3D space and their content lines up
// across the gap.

const PX_PER_MM = 2.5

const CELL = {
  '-X': { gridRow: 1, gridColumn: 1 },
  '+Y': { gridRow: 1, gridColumn: 2 },
  '+X': { gridRow: 1, gridColumn: 3 },
  '-Y': { gridRow: 1, gridColumn: 4 },
  '-Z': { gridRow: 2, gridColumn: 2 },
}

const FacePreview = ({ face, ds, pxPerMm }) => {
  const w = face.halfWidth * 2
  const h = face.halfHeight * 2
  return (
    <div style={{ position: 'relative', ...CELL[face.id] }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w * pxPerMm}
        height={h * pxPerMm}
        style={{ border: '1px solid #888', background: '#fafafa', display: 'block' }}
      >
        <rect x={0} y={0} width={w} height={h} fill="none" stroke="#ddd" strokeWidth={0.2} />
        {ds.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#222" strokeWidth={0.3} strokeLinejoin="round" />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: 4,
          fontSize: 10,
          fontFamily: 'sans-serif',
          background: 'rgba(255, 255, 255, 0.75)',
          padding: '0 3px',
          borderRadius: 2,
        }}
      >
        {face.id} · {ds.length}
      </div>
    </div>
  )
}

export const BoxPreview = ({ faceData, pxPerMm = PX_PER_MM }) => {
  // Pull dimensions from any face (all faces in the same box share dims).
  const byId = Object.fromEntries(faceData.map((fd) => [fd.face.id, fd.face]))
  const hx = byId['-Z'].halfWidth // box width / 2
  const hy = byId['-Z'].halfHeight // box depth / 2
  const hz = byId['+X'].halfHeight // box height / 2

  // Column widths (mm): -X depth | +Y/-Z width | +X depth | -Y width.
  const cols = [2 * hy, 2 * hx, 2 * hy, 2 * hx]
  // Row heights (mm): side height | -Z depth.
  const rows = [2 * hz, 2 * hy]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: cols.map((w) => `${w * pxPerMm}px`).join(' '),
        gridTemplateRows: rows.map((h) => `${h * pxPerMm}px`).join(' '),
        gap: 6,
        width: 'max-content',
      }}
    >
      {faceData
        .filter(({ face }) => CELL[face.id])
        .map(({ face, ds }) => (
          <FacePreview key={face.id} face={face} ds={ds} pxPerMm={pxPerMm} />
        ))}
    </div>
  )
}
