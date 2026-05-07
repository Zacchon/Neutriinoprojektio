// Hook that fetches and decodes the TopoJSON country data once.

import { useEffect, useState } from 'react'
import { feature } from 'topojson-client'

const URL = `${import.meta.env.BASE_URL}data/countries.json`

/**
 * Returns { data, error }.
 *   data:  GeoJSON FeatureCollection once loaded, otherwise null.
 *   error: Error if the fetch or decode failed, otherwise null.
 */
export const useGeoData = () => {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(URL)
      .then((r) => {
        if (!r.ok) throw new Error(`fetch ${URL}: ${r.status}`)
        return r.json()
      })
      .then((topology) => {
        if (cancelled) return
        // Single-layer TopoJSON; pick whatever the layer is called so the
        // hook stays valid if the source layer is renamed during re-export.
        const objectName = Object.keys(topology.objects)[0]
        const fc = feature(topology, topology.objects[objectName])
        console.log(`useGeoData: loaded ${fc.features.length} features`)
        setData(fc)
      })
      .catch((e) => {
        if (!cancelled) setError(e)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { data, error }
}
