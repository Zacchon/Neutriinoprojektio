## Project structure
neutriinoprojektio/
├── public/
│   ├── .nojekyll               # tells GitHub Pages to skip Jekyll
│   └── data/
│       └── countries.json      # TopoJSON, copied as-is into dist/
├── src/
│   ├── main.jsx                # entry, renders <App />
│   ├── App.jsx                 # top-level layout + state
│   ├── components/             # presentational
│   │   ├── Controls.jsx
│   │   ├── BoxPreview.jsx
│   │   └── ExportPanel.jsx
│   ├── hooks/
│   │   └── useGeoData.js       # fetches + decodes topojson once
│   ├── projection/             # pure functions, no React
│   │   ├── neutrino.js         # ray math: lat/lon → face/(x,y)
│   │   ├── faces.js            # face geometry, normals, basis vectors
│   │   └── greatCircle.js      # subdivision helper
│   └── styles.css
├── index.html
├── vite.config.js
└── package.json