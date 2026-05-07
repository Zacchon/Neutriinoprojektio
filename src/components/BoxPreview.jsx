// Renders the six-face grid preview. Pure presentation: receives precomputed
// per-face SVG path strings via `faceData` and lays them out as inline SVGs.

const FacePreview = ({ face, ds, sizePx }) => {
  const w = face.halfWidth * 2
  const h = face.halfHeight * 2
  return (
    <div>
      <div style={{ fontFamily: 'sans-serif', fontSize: 12, marginBottom: 4 }}>
        {face.id} · {ds.length} runs
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={sizePx}
        height={(sizePx * h) / w}
        style={{ border: '1px solid #888', background: '#fafafa', display: 'block' }}
      >
        <rect x={0} y={0} width={w} height={h} fill="none" stroke="#ddd" strokeWidth={0.2} />
        {ds.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#222" strokeWidth={0.3} strokeLinejoin="round" />
        ))}
      </svg>
    </div>
  )
}

export const BoxPreview = ({ faceData, sizePx = 260 }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, max-content)',
      gap: 16,
    }}
  >
    {faceData.map(({ face, ds }) => (
      <FacePreview key={face.id} face={face} ds={ds} sizePx={sizePx} />
    ))}
  </div>
)
