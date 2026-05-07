// Top-level layout and shared state for the app.
//
// Owns the projection inputs (currently constants; Phase 4 lifts them into
// state), runs the projection pipeline through useMemo, and renders.

import { useMemo } from 'react'
import { useGeoData } from './hooks/useGeoData.js'
import { makeBoxFrame } from './projection/frames.js'
import { makeBox } from './projection/faces.js'
import { buildAllFacePaths, runToSvgPath } from './projection/featurePaths.js'
import { BoxPreview } from './components/BoxPreview.jsx'

const OBSERVER = { observerLat: 60.18, observerLon: 24.83, rotationDeg: 0 } // Aalto
const DIMS = { width: 100, depth: 100, height: 100 }

const App = () => {
  const { data, error } = useGeoData()

  const faceData = useMemo(() => {
    if (!data) return null
    const box = makeBox(DIMS)
    const frame = makeBoxFrame(OBSERVER)
    const facePaths = buildAllFacePaths(data, frame, box)
    return box.faces.map((face) => ({
      face,
      ds: facePaths[face.id].map((run) => runToSvgPath(run, face)),
    }))
  }, [data])

  if (error) return <div>Error loading geo data: {String(error.message || error)}</div>
  if (!faceData) return <div>Loading geo data…</div>

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <p style={{ fontSize: 13 }}>
        Observer at lat {OBSERVER.observerLat}, lon {OBSERVER.observerLon}, rotation{' '}
        {OBSERVER.rotationDeg}°. Box {DIMS.width}×{DIMS.depth}×{DIMS.height} mm.
      </p>
      <BoxPreview faceData={faceData} />
    </div>
  )
}

export default App
