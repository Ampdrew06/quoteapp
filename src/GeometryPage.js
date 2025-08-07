import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
  const [maxHeight, setMaxHeight] = useState(""); // New optional max height input
  const [hookLength, setHookLength] = useState(125); // mm
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
  const [footCutSparLength, setFootCutSparLength] = useState(0);

  // Fixed spar hook cut angle for fabrication notes only
  const sparHookCutAngle = 19;
  // Fixed ridge cap height (added here for clarity)
  const ridgeCapHeight = 60;

  // React Router navigation hook for Back button
  const navigate = useNavigate();

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

  // Calculate hip pitch from roof pitch using compound angle formula (without 19° cut)
  const calculateHipPitch = (roofPitchDegrees) => {
    const theta = toRad(roofPitchDegrees);
    const hipPitchRad = Math.atan(Math.tan(theta) * Math.cos(toRad(45)));
    return toDeg(hipPitchRad);
  };

  // Calculate foot cut spar length automatically from ring-beam and soffit diagonal
  const calculateFootCutSparLength = (ringBeamWidth, soffitDepth, hipPitchDegrees) => {
    const diagonal = Math.sqrt(ringBeamWidth * ringBeamWidth + soffitDepth * soffitDepth);
    const hipPitchRad = toRad(hipPitchDegrees);
    return diagonal / Math.cos(hipPitchRad);
  };

  // Calculate hip length including foot cut spar length and hook length
  const calculateHipLength = ({
    internalWidth,
    internalProjection,
    roofPitchDegrees,
    frameThickness,
    soffitSize,
    ringBeamThickness,
    hookLength,
  }) => {
    const externalWidth = internalWidth + 2 * frameThickness + 2 * soffitSize;
    const ridgeLength = internalProjection - internalWidth / 2;

    const horizontalRun = Math.sqrt(
      Math.pow(internalProjection + frameThickness - ridgeLength, 2) +
        Math.pow(externalWidth / 2, 2)
    );

    const hipPitchDegrees = calculateHipPitch(roofPitchDegrees);
    const hipPitchRad = toRad(hipPitchDegrees);

    const hipLen = horizontalRun / Math.cos(hipPitchRad);

    const footCutSparLength = calculateFootCutSparLength(ringBeamThickness + soffitSize, soffitSize, hipPitchDegrees);

    const finalHipLength = hipLen + footCutSparLength + hookLength;

    return { finalHipLength, hipPitchDegrees, footCutSparLength };
  };

  // Calculate external dimensions on input change
  useEffect(() => {
    setExternalWidth(internalWidth + 2 * frameThickness + 2 * soffitSize);
    setExternalProjection(internalProjection + frameThickness + soffitSize);
  }, [internalWidth, internalProjection, frameThickness, soffitSize]);

  // Calculate pitch if maxHeight is given, else use roofPitch input
  useEffect(() => {
    if (maxHeight !== "") {
      const targetHeight = parseFloat(maxHeight);
      if (isNaN(targetHeight) || targetHeight <= 0) return;

      // Binary search pitch between 0-60 degrees to match target finished height
      let low = 0;
      let high = 60;
      let mid = roofPitch;
      for (let i = 0; i < 20; i++) {
        mid = (low + high) / 2;
        const pitchRad = toRad(mid);
        const tLen = externalWidth / (2 * Math.cos(pitchRad));
        const vHeight = Math.sin(pitchRad) * tLen;
        const fHeight = vHeight + ringBeamThickness + frameThickness + ridgeCapHeight;
        if (fHeight > targetHeight) {
          high = mid;
        } else {
          low = mid;
        }
      }
      setHipPitch(mid);
      setRoofPitch(mid); // sync roofPitch input to calculated pitch
    } else {
      setHipPitch(roofPitch);
    }
  }, [maxHeight, roofPitch, externalWidth, frameThickness]);

  // Calculate truss lengths, heights, ridge, hips, etc.
  useEffect(() => {
    if (
      internalWidth > 0 &&
      internalProjection > 0 &&
      roofPitch > 0 &&
      rafterSpacing > 0 &&
      trussThickness > 0
    ) {
      const tLength = calculateTrussLength(externalWidth, roofPitch);
      const vHeight = calculateVerticalTrussHeight(tLength, roofPitch);
      const fHeight = vHeight + ringBeamThickness + frameThickness + ridgeCapHeight;
      const rLength = calculateRidgeLength(internalProjection, internalWidth);
      const nTrusses = calculateNumTrusses(rLength, trussThickness, rafterSpacing);
      const totalMeters =
        nTrusses * (tLength / 1000) + 5 + 10; // placeholder for hips and jack rafters
      const stocks = Math.ceil(totalMeters / 12);
      const cost = totalMeters * pricePerMeter;

      const { finalHipLength, hipPitchDegrees, footCutSparLength } = calculateHipLength({
        internalWidth,
        internalProjection,
        roofPitchDegrees: roofPitch,
        frameThickness,
        soffitSize,
        ringBeamThickness,
        hookLength,
      });

      setTrussLength(tLength);
      setVerticalTrussHeight(vHeight);
      setFinishedHeight(fHeight);
      setRidgeLength(rLength);
      setNumTrusses(nTrusses);
      setTotalJoistMeters(totalMeters);
      setStockLengths(stocks);
      setMaterialCost(cost);
      setHipLength(finalHipLength);
      setHipPitch(hipPitchDegrees);
      setFootCutSparLength(footCutSparLength);
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
    hookLength,
  ]);

  return (
    <div style={{ maxWidth: 700, margin: "20px auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <button onClick={() => navigate("/")} style={{ marginBottom: 20 }}>
        &larr; Back to Main Page
      </button>

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
            max="60"
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
          Hook Length (mm):
          <input
            type="number"
            min="0"
            value={hookLength}
            onChange={(e) => setHookLength(parseInt(e.target.value) || 0)}
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

      <div style={{ marginBottom: 10 }}>
        <label>
          Max Finished Height (mm):
          <input
            type="number"
            min="0"
            placeholder="Optional"
            value={maxHeight}
            onChange={(e) => setMaxHeight(e.target.value)}
            style={{ width: 100, marginLeft: 10 }}
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
        <p>Foot Cut Spar Length (calculated): {footCutSparLength.toFixed(0)} mm</p>
        <p>Hip Length (adjusted for foot cut & hook): {hipLength.toFixed(0)} mm</p>
        <p>Fixed Spar Hook Cut Angle (fabrication): {sparHookCutAngle}°</p>
      </div>
    </div>
  );
}
