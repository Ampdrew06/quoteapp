import React, { useState, useEffect } from 'react';

export default function GeometryPage() {
  // Inputs with default values
  const [width, setWidth] = useState(3); // meters
  const [projection, setProjection] = useState(4); // meters
  const [pitch, setPitch] = useState(25); // degrees
  const [ringBeamDepth, setRingBeamDepth] = useState(0.04); // meters (40mm)
  const [joistHeight, setJoistHeight] = useState(0.22); // meters (220mm)
  const [joistThickness, setJoistThickness] = useState(0.047); // meters (47mm)
  const [rafterSpacing, setRafterSpacing] = useState(0.665); // meters
  const [pricePerMeter, setPricePerMeter] = useState(6.12); // £ per meter

  // Calculated states
  const [trussLength, setTrussLength] = useState(0);
  const [numTrusses, setNumTrusses] = useState(0);
  const [totalJoistMeters, setTotalJoistMeters] = useState(0);
  const [stockLengths, setStockLengths] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);

  // Helper function: calculate truss length
  function calculateTrussLength(width, pitchDegrees, ringBeamHeight) {
    const run = width / 2;
    const pitchRadians = (pitchDegrees * Math.PI) / 180;
    const rise = run * Math.tan(pitchRadians);
    return Math.sqrt(run * run + (rise + ringBeamHeight) * (rise + ringBeamHeight));
  }

  useEffect(() => {
    if (width > 0 && pitch > 0 && rafterSpacing > 0) {
      const length = calculateTrussLength(width, pitch, ringBeamDepth);
      const trusses = Math.ceil(width / rafterSpacing) + 1; // +1 for last truss
      // Placeholder: simple approximation for hips/jack rafters & intermediate bars
      const hipsJackRaftersLength = 5; // meters (adjust later)
      const intermediateBarsLength = 10; // meters (adjust later)

      const totalMeters = trusses * length + hipsJackRaftersLength + intermediateBarsLength;
      const stockNeeded = Math.ceil(totalMeters / 12);

      setTrussLength(length);
      setNumTrusses(trusses);
      setTotalJoistMeters(totalMeters);
      setStockLengths(stockNeeded);
      setMaterialCost(totalMeters * pricePerMeter);
    } else {
      setTrussLength(0);
      setNumTrusses(0);
      setTotalJoistMeters(0);
      setStockLengths(0);
      setMaterialCost(0);
    }
  }, [width, pitch, ringBeamDepth, rafterSpacing, pricePerMeter]);

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h2>Geometry & Material Calculator</h2>

      <div style={{ marginBottom: 10 }}>
        <label>
          Width (m):{' '}
          <input
            type="number"
            step="0.01"
            min="0"
            value={width}
            onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Projection (m):{' '}
          <input
            type="number"
            step="0.01"
            min="0"
            value={projection}
            onChange={(e) => setProjection(parseFloat(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Roof Pitch (degrees):{' '}
          <input
            type="number"
            step="0.1"
            min="0"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Ring-Beam Depth (m):{' '}
          <input
            type="number"
            step="0.001"
            min="0"
            value={ringBeamDepth}
            onChange={(e) => setRingBeamDepth(parseFloat(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Rafter Spacing (m):{' '}
          <input
            type="number"
            step="0.001"
            min="0"
            value={rafterSpacing}
            onChange={(e) => setRafterSpacing(parseFloat(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Price per Meter (£):{' '}
          <input
            type="number"
            step="0.01"
            min="0"
            value={pricePerMeter}
            onChange={(e) => setPricePerMeter(parseFloat(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <hr />

      <div>
        <p>Truss Length: {trussLength.toFixed(2)} m</p>
        <p>Number of Trusses: {numTrusses}</p>
        <p>Total Joist Length: {totalJoistMeters.toFixed(2)} m</p>
        <p>Stock Lengths Needed (12m each): {stockLengths}</p>
        <p>Estimated Material Cost: £{materialCost.toFixed(2)}</p>
      </div>
    </div>
  );
}
