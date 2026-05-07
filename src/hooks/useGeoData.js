// Hook that fetches and decodes the TopoJSON country data once.

import { useEffect, useState } from 'react'
import { feature } from 'topojson-client'

const URL = `${import.meta.env.BASE_URL}data/ne_50m_admin_0_countries_simplify10.json`
const OBJECT_NAME = 'ne_50m_admin_0_countries'

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
        const fc = feature(topology, topology.objects[OBJECT_NAME])
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
