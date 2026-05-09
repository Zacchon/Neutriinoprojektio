// Export controls for saving the projection output. Each button builds an
// SVG sized in millimetres (so the print matches the box face exactly) and
// triggers a browser download. The "All faces" button packages every
// non-empty face into a single zip via fflate.

import { strToU8, zipSync } from 'fflate'
import { buildFaceSvg } from '../projection/featurePaths.js'

const triggerDownload = (filename, blob) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadSvg = (filename, svg) =>
  triggerDownload(filename, new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))

const downloadAllZip = (entries) => {
  const files = Object.fromEntries(
    entries.map(({ filename, svg }) => [filename, strToU8(svg)])
  )
  const zipped = zipSync(files, { level: 6 })
  triggerDownload('faces.zip', new Blob([zipped], { type: 'application/zip' }))
}

export const ExportPanel = ({ faceData }) => {
  const exportable = faceData.filter(({ face }) => face.id !== '+Z')
  return (
    <fieldset
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 8,
        maxWidth: 420,
        fontFamily: 'sans-serif',
      }}
    >
      <legend style={{ fontSize: 12 }}>Export</legend>
      <div style={{ fontSize: 11, color: '#555' }}>
        Per-face SVG sized in mm — print at 100% scale.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {exportable.map(({ face, ds }) => (
          <button
            key={face.id}
            onClick={() => downloadSvg(`face_${face.id}.svg`, buildFaceSvg(face, ds))}
            style={{ fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}
          >
            {face.id}
          </button>
        ))}
        <button
          onClick={() =>
            downloadAllZip(
              exportable.map(({ face, ds }) => ({
                filename: `face_${face.id}.svg`,
                svg: buildFaceSvg(face, ds),
              }))
            )
          }
          style={{ fontSize: 12, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}
        >
          All faces (zip)
        </button>
      </div>
    </fieldset>
  )
}
