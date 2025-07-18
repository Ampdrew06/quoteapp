import React, { useState, useEffect } from 'react';

export default function GeometryPage() {
  // Inputs with default values (all in mm except pitch degrees)
  const [internalWidth, setInternalWidth] = useState(2805); // mm
  const [internalProjection, setInternalProjection] = useState(3875); // mm
  const [pitch, setPitch] = useState(25); // degrees
  const [ringBeamDepth, setRingBeamDepth] = useState(40); // mm
  const [frameThickness, setFrameThickness] = useState(70); // mm
  const [soffitSize, setSoffitSize] = useState(100); // mm
  const [rafterSpacing, setRafterSpacing] = useState(665); // mm (truss centres)
  const [trussThickness, setTrussThickness] = useState(47); // mm
  const [pricePerMeter, setPricePerMeter] = useState(6.12); // £ per meter

  // Calculated states
  const [trussLength, setTrussLength] = useState(0);
  const [numTrusses, setNumTrusses] = useState(0);
  const [totalJoistMeters, setTotalJoistMeters] = useState(0);
  const [stockLengths, setStockLengths] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);
  const [externalWidth, setExternalWidth] = useState(0);
  const [externalProjection, setExternalProjection] = useState(0);
  const [ridgeLength, setRidgeLength] = useState(0);

  // Helper: convert degrees to radians
  function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  // Truss length calculation (using external width and pitch)
  function calculateTrussLength(externalWidthMm, pitchDegrees) {
    const pitchRadians = degreesToRadians(pitchDegrees);
    const halfWidth = externalWidthMm / 2;
    return halfWidth / Math.cos(pitchRadians);
  }

  useEffect(() => {
    if (
      internalWidth > 0 &&
      internalProjection > 0 &&
      pitch > 0 &&
      rafterSpacing > 0 &&
      trussThickness > 0
    ) {
      // Calculate external sizes in mm
      const extWidth =
        internalWidth + 2 * frameThickness + 2 * soffitSize;
      const extProjection = internalProjection + ringBeamDepth + soffitSize;

      // Calculate truss length using external width and pitch
      const trussLen = calculateTrussLength(extWidth, pitch);

      // Calculate ridge length (effective projection for truss spacing)
      const ridgeLen = internalProjection - internalWidth / 2;

      // Calculate number of trusses along ridge length spaced at rafterSpacing centers,
      // accounting for truss thickness
      const trusses = Math.ceil((ridgeLen - trussThickness) / rafterSpacing) + 1;

      // Approximate hips/jack rafters & intermediate bars length (meters)
      const hipsJackRaftersLength = 5; // meters placeholder
      const intermediateBarsLength = 10; // meters placeholder

      // Total joist length in meters (convert truss length mm to meters)
      const totalMeters =
        trusses * (trussLen / 1000) + hipsJackRaftersLength + intermediateBarsLength;

      // Stock lengths needed (12m each)
      const stockNeeded = Math.ceil(totalMeters / 12);

      // Material cost
      const cost = totalMeters * pricePerMeter;

      // Update states
      setTrussLength(trussLen);
      setNumTrusses(trusses);
      setTotalJoistMeters(totalMeters);
      setStockLengths(stockNeeded);
      setMaterialCost(cost);
      setExternalWidth(extWidth);
      setExternalProjection(extProjection);
      setRidgeLength(ridgeLen);
    } else {
      setTrussLength(0);
      setNumTrusses(0);
      setTotalJoistMeters(0);
      setStockLengths(0);
      setMaterialCost(0);
      setExternalWidth(0);
      setExternalProjection(0);
      setRidgeLength(0);
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
    trussThickness,
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
          Truss Thickness (mm):{' '}
          <input
            type="number"
            min="0"
            value={trussThickness}
            onChange={(e) => setTrussThickness(parseInt(e.target.value) || 0)}
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
        <p>External Roof Width: {externalWidth} mm</p>
        <p>External Roof Projection: {externalProjection} mm</p>
        <p>Ridge Length (usable projection): {ridgeLength.toFixed(0)} mm</p>
        <p>Truss Length: {trussLength.toFixed(0)} mm</p>
        <p>Number of Trusses: {numTrusses}</p>
        <p>Total Joist Length: {totalJoistMeters.toFixed(2)} m</p>
        <p>Stock Lengths Needed (12m each): {stockLengths}</p>
        <p>Estimated Material Cost: £{materialCost.toFixed(2)}</p>
      </div>
    </div>
  );
}
