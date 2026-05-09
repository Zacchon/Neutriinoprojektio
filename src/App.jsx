// Top-level layout and shared state for the app.
//
// Owns the projection inputs (observer + box dims) as state, runs the
// projection pipeline through useMemo, and lays out controls + preview.

import { useMemo, useState } from 'react'
import { useGeoData } from './hooks/useGeoData.js'
import { makeBoxFrame } from './projection/frames.js'
import { makeBox } from './projection/faces.js'
import { buildAllFacePaths, runToSvgPath } from './projection/featurePaths.js'
import { BoxPreview } from './components/BoxPreview.jsx'
import { Controls } from './components/Controls.jsx'
import { ExportPanel } from './components/ExportPanel.jsx'

const INITIAL_OBSERVER = { observerLat: 60.18, observerLon: 24.83, rotationDeg: 0 } // Aalto
const INITIAL_DIMS = { width: 100, depth: 100, height: 100 }

const App = () => {
  const { data, error } = useGeoData()
  const [observer, setObserver] = useState(INITIAL_OBSERVER)
  const [dims, setDims] = useState(INITIAL_DIMS)

  const faceData = useMemo(() => {
    if (!data) return null
    const box = makeBox(dims)
    const frame = makeBoxFrame(observer)
    const facePaths = buildAllFacePaths(data, frame, box)
    return box.faces.map((face) => ({
      face,
      ds: facePaths[face.id].map((run) => runToSvgPath(run, face)),
    }))
  }, [data, observer, dims])

  if (error) return <div>Error loading geo data: {String(error.message || error)}</div>
  if (!faceData) return <div>Loading geo data…</div>

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Controls
        observer={observer}
        setObserver={setObserver}
        dims={dims}
        setDims={setDims}
      />
      <ExportPanel faceData={faceData} />
      <BoxPreview faceData={faceData} />
    </div>
  )
}

export default App
