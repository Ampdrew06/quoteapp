import React, { useState, useEffect } from "react";

export default function GeometryPage() {
  // Inputs (mm except pitch degrees)
  const [internalWidth, setInternalWidth] = useState(4450);
  const [internalProjection, setInternalProjection] = useState(3900);
  const [roofPitch, setRoofPitch] = useState(23); // degrees
  const [frameThickness, setFrameThickness] = useState(70);
  const [soffitSize, setSoffitSize] = useState(150);
  const [ringBeamThickness, setRingBeamThickness] = useState(40);
  const [undersideHeight, setUndersideHeight] = useState(306);
  const [rafterSpacing, setRafterSpacing] = useState(665);
  const [trussThickness, setTrussThickness] = useState(47);
  const [hookOffset, setHookOffset] = useState(190); // mm
  const [pricePerMeter, setPricePerMeter] = useState(6.12);

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
  const [hipLength, setHipLength] = useState(0);
  const [hipPitch, setHipPitch] = useState(0);

  // Helper functions
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  // Calculate truss length from external width and roof pitch
  const calculateTrussLength = (extWidth, pitchDegrees) => {
    const theta = toRad(pitchDegrees);
    return (extWidth / 2) / Math.cos(theta);
  };

  // Calculate vertical truss height (underside to ridge)
  const calculateVerticalTrussHeight = (trussLength, pitchDegrees) => {
    const theta = toRad(pitchDegrees);
    return Math.sin(theta) * trussLength;
  };

  // Calculate ridge length (projection to ridge center)
  const calculateRidgeLength = (internalProj, internalWidth) => {
    return internalProj - internalWidth / 2;
  };

  // Calculate number of trusses spaced along ridge length
  const calculateNumTrusses = (ridgeLen, trussThick, rafterSpacing) => {
    return Math.ceil((ridgeLen - trussThick) / rafterSpacing) + 1;
  };

  // Calculate hip pitch from roof pitch using compound angle formula
  const calculateHipPitch = (roofPitchDegrees) => {
    const theta = toRad(roofPitchDegrees);
    // Hip runs at 45 degrees horizontally (corner)
    const hipPitchRad = Math.atan(Math.tan(theta) * Math.cos(toRad(45)));
    return toDeg(hipPitchRad);
  };

  // Calculate hip length using hip pitch and hook offset
  const calculateHipLength = ({
    internalWidth,
    internalProjection,
    roofPitchDegrees,
    frameThickness,
    soffitSize,
    hookOffset,
  }) => {
    // Calculate external width
    const externalWidth = internalWidth + 2 * frameThickness + 2 * soffitSize;

    // Calculate ridge length
    const ridgeLength = internalProjection - internalWidth / 2;

    // Calculate horizontal run adjusted for hook offset
    const adjustedRidgeLength = ridgeLength - hookOffset;

    // Horizontal distance from corner to hip connection point
    const horizontalRun = Math.sqrt(
      adjustedRidgeLength * adjustedRidgeLength + (externalWidth / 2) * (externalWidth / 2)
    );

    // Calculate hip pitch
    const hipPitchDegrees = calculateHipPitch(roofPitchDegrees);
    const hipPitchRad = toRad(hipPitchDegrees);

    // Calculate hip length
    const hipLen = horizontalRun / Math.cos(hipPitchRad);

    return { hipLen, hipPitchDegrees };
  };

  useEffect(() => {
    if (
      internalWidth > 0 &&
      internalProjection > 0 &&
      roofPitch > 0 &&
      rafterSpacing > 0 &&
      trussThickness > 0
    ) {
      const extWidth = internalWidth + 2 * frameThickness + 2 * soffitSize;
      const extProjection = internalProjection + ringBeamThickness + soffitSize;

      const tLength = calculateTrussLength(extWidth, roofPitch);
      const vHeight = calculateVerticalTrussHeight(tLength, roofPitch);
      const fHeight = vHeight + ringBeamThickness + undersideHeight;
      const rLength = calculateRidgeLength(internalProjection, internalWidth);
      const nTrusses = calculateNumTrusses(rLength, trussThickness, rafterSpacing);
      const totalMeters =
        nTrusses * (tLength / 1000) + 5 + 10; // hipsJackRafters + intermediateBars placeholder
      const stocks = Math.ceil(totalMeters / 12);
      const cost = totalMeters * pricePerMeter;
      const { hipLen, hipPitchDegrees } = calculateHipLength({
        internalWidth,
        internalProjection,
        roofPitchDegrees: roofPitch,
        frameThickness,
        soffitSize,
        hookOffset,
      });

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
      setHipLength(hipLen);
      setHipPitch(hipPitchDegrees);
    } else {
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
      setHipLength(0);
      setHipPitch(0);
    }
  }, [
    internalWidth,
    internalProjection,
    roofPitch,
    rafterSpacing,
    pricePerMeter,
    ringBeamThickness,
    frameThickness,
    soffitSize,
    trussThickness,
    undersideHeight,
    hookOffset,
  ]);

  return (
    <div style={{ maxWidth: 700, margin: "20px auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h2>Geometry & Material Calculator</h2>

      {/* Inputs */}
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
            value={roofPitch}
            onChange={(e) => setRoofPitch(parseFloat(e.target.value) || 0)}
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
          Hook Offset (mm):
          <input
            type="number"
            min="0"
            value={hookOffset}
            onChange={(e) => setHookOffset(parseInt(e.target.value) || 0)}
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

      {/* Display Results */}
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
        <p>Hip Pitch: {hipPitch.toFixed(2)}°</p>
        <p>Hip Length (adjusted for hook): {hipLength.toFixed(0)} mm</p>
      </div>
    </div>
  );
}
