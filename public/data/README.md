# Geographic data

The app loads `countries.json` at runtime. That filename is intentionally
generic so the code path stays stable as the underlying dataset is
re-simplified or replaced. Provenance for the *current* file lives here.

If you keep multiple variants on disk (e.g. for a side-by-side comparison),
name them descriptively (`countries-s10.json`, `countries-s15.json`, etc.)
and have `countries.json` be whichever one is active.

## Current file

- **Source**: [Natural Earth](https://www.naturalearthdata.com/) 1:50m
  cultural, layer `admin_0_countries`.
- **Simplification**: [mapshaper.org](https://mapshaper.org/),
  Visvalingam / weighted area, 10% retention.
- **Output format**: TopoJSON (single layer, key `ne_50m_admin_0_countries`).
- **Last updated**: 2026-05-07.
- **Size**: ~99 KB.

## Re-running the simplification

1. Open mapshaper.org.
2. Drag in the Natural Earth source (1:50m cultural admin_0_countries).
3. Simplify → Visvalingam / weighted area → set retention.
4. Export → TopoJSON.
5. Replace `countries.json` here, update this README's "Last updated" and
   any changed parameters.
