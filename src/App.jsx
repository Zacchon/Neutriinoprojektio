// Top-level layout and shared state for the app.
import { useGeoData } from './hooks/useGeoData.js'

const App = () => {
  const { data, error } = useGeoData()
  if (error) return <div>Error loading geo data: {String(error.message || error)}</div>
  if (!data) return <div>Loading geo data…</div>
  return <div>Loaded {data.features.length} features.</div>
}

export default App
