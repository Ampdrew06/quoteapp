import React, { useState, useEffect } from 'react';

export default function GeometryPage() {
  // Inputs with default values (all in mm except pitch degrees)
  const [internalWidth, setInternalWidth] = useState(2805); // mm
  const [internalProjection, setInternalProjection] = useState(3875); // mm
  const [pitch, setPitch] = useState(25); // degrees
  const [ringBeamThickness, setRingBeamThickness] = useState(40); // mm
  const [undersideHeight, setUndersideHeight] = useState(306); // mm (floor to bottom of ring-beam)
  const [frameThickness, setFrameThickness] = useState(70); // mm
  const [soffitSize, setSoffitSize] = useState(100); // mm
  const [rafterSpacing, setRafterSpacing] = useState(665); // mm (truss centres)
  const [trussThickness, setTrussThickness] = useState(47); // mm
  const [pricePerMeter, setPricePerMeter] = useState(6.12); // £ per meter

  // Calculated states
  const [externalWidth, setExternalWidth] = useState(0);
  const [externalProjection, setExternalProjection] = useState(0);
  const [ridgeLength, setRidgeLength] = useState(0);
  const [trussLength, setTrussLength] = useState(0);
  const [verticalTrussHeight, setVerticalTrussHeight] = useState(0);
  const [finishedHeight, setFinishedHeight] = useState(0);
  const [numTrusses, setNumTrusses] = useState(0);
  const [totalJoistMeters, setTotalJoistMeters] = useState(0);
  const [stockLengths, setStockLengths] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);

  // Placeholder for hips and jack rafters lengths (meters)
  const hipsJackRaftersLength = 5;
  const intermediateBarsLength = 10;

  // Helper: convert degrees to radians
  function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  // Calculate truss length using external width and pitch (spreadsheet formula)
  function calculateTrussLength(externalWidthMm, pitchDegrees) {
    const pitchRadians = degreesToRadians(pitchDegrees);
    const halfWidth = externalWidthMm / 2;
    return halfWidth / Math.cos(pitchRadians);
  }

  // Calculate vertical truss height (underside to ridge)
  function calculateVerticalTrussHeight(trussLengthMm, pitchDegrees) {
    const pitchRadians = degreesToRadians(pitchDegrees);
    return Math.sin(pitchRadians) * trussLengthMm;
  }

  // Calculate ridge length (effective projection for truss spacing)
  function calculateRidgeLength(internalProjectionMm, internalWidthMm) {
    return internalProjectionMm - internalWidthMm / 2;
  }

  // Calculate number of trusses spaced along ridge length
  function calculateNumTrusses(ridgeLengthMm, trussThicknessMm, rafterSpacingMm) {
    return Math.ceil((ridgeLengthMm - trussThicknessMm) / rafterSpacingMm) + 1;
  }

  useEffect(() => {
    if (
      internalWidth > 0 &&
      internalProjection > 0 &&
      pitch > 0 &&
      rafterSpacing > 0 &&
      trussThickness > 0
    ) {
      // Calculate external sizes
      const extWidth =
        internalWidth + 2 * frameThickness + 2 * soffitSize;
      const extProjection = internalProjection + ringBeamThickness + soffitSize;

      // Calculate truss length (mm)
      const tLength = calculateTrussLength(extWidth, pitch);

      // Calculate vertical truss height (underside to ridge)
      const vHeight = calculateVerticalTrussHeight(tLength, pitch);

      // Calculate finished height (floor to ridge)
      const fHeight = vHeight + ringBeamThickness + undersideHeight;

      // Calculate ridge length (mm)
      const rLength = calculateRidgeLength(internalProjection, internalWidth);

      // Calculate number of trusses
      const nTrusses = calculateNumTrusses(rLength, trussThickness, rafterSpacing);

      // Calculate total joist length in meters (truss length mm to meters)
      const totalMeters =
        nTrusses * (tLength / 1000) + hipsJackRaftersLength + intermediateBarsLength;

      // Calculate stock lengths needed
      const stocks = Math.ceil(totalMeters / 12);

      // Calculate material cost
      const cost = totalMeters * pricePerMeter;

      // Update states
      setExternalWidth(extWidth);
      setExternalProjection(extProjection);
      setTrussLength(tLength);
      setVerticalTrussHeight(vHeight);
      setFinishedHeight(fHeight);
      setRidgeLength(rLength);
      setNumTrusses(nTrusses);
      setTotalJoistMeters(totalMeters);
      setStockLengths(stocks);
      setMaterialCost(cost);
    } else {
      // Reset all values if inputs invalid
      setExternalWidth(0);
      setExternalProjection(0);
      setTrussLength(0);
      setVerticalTrussHeight(0);
      setFinishedHeight(0);
      setRidgeLength(0);
      setNumTrusses(0);
      setTotalJoistMeters(0);
      setStockLengths(0);
      setMaterialCost(0);
    }
  }, [
    internalWidth,
    internalProjection,
    pitch,
    rafterSpacing,
    pricePerMeter,
    ringBeamThickness,
    frameThickness,
    soffitSize,
    trussThickness,
    undersideHeight,
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

      {/* Input fields */}
      <div style={{ marginBottom: 10 }}>
        <label>
          Internal Width (mm):
          <input
            type="number"
            min="0"
            value={internalWidth}
            onChange={(e) => setInternalWidth(parseInt(e.target.value) || 0)}
            style={{ width: 100, marginLeft: 10 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Internal Projection (mm):
          <input
            type="number"
            min="0"
            value={internalProjection}
            onChange={(e) => setInternalProjection(parseInt(e.target.value) || 0)}
            style={{ width: 100, marginLeft: 10 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Roof Pitch (degrees):
          <input
            type="number"
            step="0.1"
            min="0"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value) || 0)}
            style={{ width: 80, marginLeft: 10 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Ring-Beam Thickness (mm):
          <input
            type="number"
            min="0"
            value={ringBeamThickness}
            onChange={(e) =>
              setRingBeamThickness(parseInt(e.target.value) || 0)
            }
            style={{ width: 80, marginLeft: 10 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Underside Height (floor to bottom of ring-beam) (mm):
          <input
            type="number"
            min="0"
            value={undersideHeight}
            onChange={(e) => setUndersideHeight(parseInt(e.target.value) || 0)}
            style={{ width: 80, marginLeft: 10 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Frame Thickness (mm):
          <input
            type="number"
            min="0"
            value={frameThickness}
            onChange={(e) => setFrameThickness(parseInt(e.target.value) || 0)}
            style={{ width: 80, marginLeft: 10 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Soffit Size (mm):
          <input
            type="number"
            min="0"
            value={soffitSize}
            onChange={(e) => setSoffitSize(parseInt(e.target.value) || 0)}
            style={{ width: 80, marginLeft: 10 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Rafter Spacing (mm):
          <input
            type="number"
            min="0"
            value={rafterSpacing}
            onChange={(e) => setRafterSpacing(parseInt(e.target.value) || 0)}
            style={{ width: 80, marginLeft: 10 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Truss Thickness (mm):
          <input
            type="number"
            min="0"
            value={trussThickness}
            onChange={(e) => setTrussThickness(parseInt(e.target.value) || 0)}
            style={{ width: 80, marginLeft: 10 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Price per Meter (£):
          <input
            type="number"
            step="0.01"
            min="0"
            value={pricePerMeter}
            onChange={(e) => setPricePerMeter(parseFloat(e.target.value) || 0)}
            style={{ width: 80, marginLeft: 10 }}
          />
        </label>
      </div>

      <hr />

      {/* Display results */}
      <div>
        <p>External Roof Width: {externalWidth.toFixed(0)} mm</p>
        <p>External Roof Projection: {externalProjection.toFixed(0)} mm</p>
        <p>Ridge Length (usable projection): {ridgeLength.toFixed(0)} mm</p>
        <p>Truss Length: {trussLength.toFixed(0)} mm</p>
        <p>Vertical Truss Height (underside to ridge): {verticalTrussHeight.toFixed(0)} mm</p>
        <p>Finished Ridge Height (floor to ridge cap): {finishedHeight.toFixed(0)} mm</p>
        <p>Number of Trusses: {numTrusses}</p>
        <p>Total Joist Length: {totalJoistMeters.toFixed(2)} m</p>
        <p>Stock Lengths Needed (12m each): {stockLengths}</p>
        <p>Estimated Material Cost: £{materialCost.toFixed(2)}</p>
      </div>
    </div>
  );
}
