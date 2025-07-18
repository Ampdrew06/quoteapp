import React, { useState, useEffect } from 'react';

export default function GeometryPage() {
  // Inputs with default values
  const [internalWidth, setInternalWidth] = useState(3000); // mm
  const [internalProjection, setInternalProjection] = useState(3000); // mm
  const [pitch, setPitch] = useState(25); // degrees
  const [ringBeamDepth, setRingBeamDepth] = useState(40); // mm (40mm)
  const [frameThickness, setFrameThickness] = useState(70); // mm
  const [soffitSize, setSoffitSize] = useState(150); // mm
  const [rafterSpacing, setRafterSpacing] = useState(665); // mm
  const [pricePerMeter, setPricePerMeter] = useState(6.12); // £ per meter

  // Calculated states
  const [trussLength, setTrussLength] = useState(0);
  const [numTrusses, setNumTrusses] = useState(0);
  const [totalJoistMeters, setTotalJoistMeters] = useState(0);
  const [stockLengths, setStockLengths] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);
  const [externalWidth, setExternalWidth] = useState(0);
  const [externalProjection, setExternalProjection] = useState(0);

  // Helper function: calculate truss length in mm
  function calculateTrussLength(widthMm, pitchDegrees, verticalCutHeightMm) {
    const run = widthMm / 2;
    const pitchRadians = (pitchDegrees * Math.PI) / 180;
    const rise = run * Math.tan(pitchRadians);
    const verticalTrussHeight = rise - verticalCutHeightMm;
    return Math.sqrt(run * run + verticalTrussHeight * verticalTrussHeight);
  }

  useEffect(() => {
    if (
      internalWidth > 0 &&
      internalProjection > 0 &&
      pitch > 0 &&
      rafterSpacing > 0
    ) {
      const verticalCutHeight = 165; // mm, truss vertical cut spar height

      // Truss length in mm
      const trussLen = calculateTrussLength(
        internalWidth,
        pitch,
        verticalCutHeight
      );

      // Number of trusses, rounded up (+1 to include end)
      const trusses = Math.ceil(internalWidth / rafterSpacing) + 1;

      // Approximate hips/jack rafters & intermediate bars length (meters)
      const hipsJackRaftersLength = 5; // meters (placeholder)
      const intermediateBarsLength = 10; // meters (placeholder)

      // Total joist length in meters (trussLen is in mm, convert to meters)
      const totalMeters =
        trusses * (trussLen / 1000) + hipsJackRaftersLength + intermediateBarsLength;

      // Number of 12m stock lengths needed
      const stockNeeded = Math.ceil(totalMeters / 12);

      // Calculate material cost
      const cost = totalMeters * pricePerMeter;

      // Calculate external sizes (mm)
      const extWidth =
        internalWidth + 2 * frameThickness + 2 * soffitSize;
      const extProjection = internalProjection + ringBeamDepth + soffitSize;

      setTrussLength(trussLen);
      setNumTrusses(trusses);
      setTotalJoistMeters(totalMeters);
      setStockLengths(stockNeeded);
      setMaterialCost(cost);
      setExternalWidth(extWidth);
      setExternalProjection(extProjection);
    } else {
      setTrussLength(0);
      setNumTrusses(0);
      setTotalJoistMeters(0);
      setStockLengths(0);
      setMaterialCost(0);
      setExternalWidth(0);
      setExternalProjection(0);
    }
  }, [
    internalWidth,
    internalProjection,
    pitch,
    rafterSpacing,
    pricePerMeter,
    ringBeamDepth,
    frameThickness,
    soffitSize,
  ]);

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '20px auto',
        padding: 20,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h2>Geometry & Material Calculator</h2>

      <div style={{ marginBottom: 10 }}>
        <label>
          Internal Width (mm):{' '}
          <input
            type="number"
            min="0"
            value={internalWidth}
            onChange={(e) => setInternalWidth(parseInt(e.target.value) || 0)}
            style={{ width: 100 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Internal Projection (mm):{' '}
          <input
            type="number"
            min="0"
            value={internalProjection}
            onChange={(e) => setInternalProjection(parseInt(e.target.value) || 0)}
            style={{ width: 100 }}
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
          Ring-Beam Depth (mm):{' '}
          <input
            type="number"
            min="0"
            value={ringBeamDepth}
            onChange={(e) => setRingBeamDepth(parseInt(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Frame Thickness (mm):{' '}
          <input
            type="number"
            min="0"
            value={frameThickness}
            onChange={(e) => setFrameThickness(parseInt(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Soffit Size (mm):{' '}
          <input
            type="number"
            min="0"
            value={soffitSize}
            onChange={(e) => setSoffitSize(parseInt(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Rafter Spacing (mm):{' '}
          <input
            type="number"
            min="0"
            value={rafterSpacing}
            onChange={(e) => setRafterSpacing(parseInt(e.target.value) || 0)}
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
        <p>Truss Length: {(trussLength / 1000).toFixed(3)} m</p>
        <p>Number of Trusses: {numTrusses}</p>
        <p>Total Joist Length: {totalJoistMeters.toFixed(2)} m</p>
        <p>Stock Lengths Needed (12m each): {stockLengths}</p>
        <p>Estimated Material Cost: £{materialCost.toFixed(2)}</p>
        <p>External Roof Width: {externalWidth} mm</p>
        <p>External Roof Projection: {externalProjection} mm</p>
      </div>
    </div>
  );
}
