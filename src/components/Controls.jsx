// UI controls for adjusting projection parameters.

const Row = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>{children}</div>
)

const Label = ({ children }) => <label style={{ width: 80 }}>{children}</label>

const Readout = ({ children }) => (
  <span style={{ width: 60, textAlign: 'right', fontFamily: 'monospace' }}>{children}</span>
)

const Slider = ({ label, value, min, max, step, onChange, suffix = '' }) => (
  <Row>
    <Label>{label}</Label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ flex: 1 }}
    />
    <Readout>
      {value.toFixed(step < 1 ? 1 : 0)}
      {suffix}
    </Readout>
  </Row>
)

const NumberInput = ({ label, value, min, max, step, onChange, suffix = '' }) => (
  <Row>
    <Label>{label}</Label>
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => {
        const n = parseFloat(e.target.value)
        if (!Number.isNaN(n)) onChange(n)
      }}
      style={{ width: 80 }}
    />
    <span>{suffix}</span>
  </Row>
)

export const Controls = ({ observer, setObserver, dims, setDims }) => {
  const updateObserver = (key, value) => setObserver({ ...observer, [key]: value })
  const updateDims = (key, value) => setDims({ ...dims, [key]: value })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 420,
        fontFamily: 'sans-serif',
      }}
    >
      <fieldset style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>
        <legend style={{ fontSize: 12 }}>Observer</legend>
        <Slider
          label="Latitude"
          value={observer.observerLat}
          min={-89.9}
          max={89.9}
          step={0.1}
          suffix="°"
          onChange={(v) => updateObserver('observerLat', v)}
        />
        <Slider
          label="Longitude"
          value={observer.observerLon}
          min={-180}
          max={180}
          step={0.1}
          suffix="°"
          onChange={(v) => updateObserver('observerLon', v)}
        />
        <Slider
          label="Rotation"
          value={observer.rotationDeg}
          min={-180}
          max={180}
          step={1}
          suffix="°"
          onChange={(v) => updateObserver('rotationDeg', v)}
        />
      </fieldset>
      <fieldset style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 8 }}>
        <legend style={{ fontSize: 12 }}>Box dimensions</legend>
        <NumberInput
          label="Width"
          value={dims.width}
          min={10}
          max={500}
          step={1}
          suffix="mm"
          onChange={(v) => updateDims('width', v)}
        />
        <NumberInput
          label="Depth"
          value={dims.depth}
          min={10}
          max={500}
          step={1}
          suffix="mm"
          onChange={(v) => updateDims('depth', v)}
        />
        <NumberInput
          label="Height"
          value={dims.height}
          min={10}
          max={500}
          step={1}
          suffix="mm"
          onChange={(v) => updateDims('height', v)}
        />
      </fieldset>
    </div>
  )
}
