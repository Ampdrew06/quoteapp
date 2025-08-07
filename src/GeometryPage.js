import React, { useState, useEffect } from 'react';

export default function GeometryPage() {
  // Inputs (mm, degrees)
  const [internalWidth, setInternalWidth] = useState(2805);
  const [internalProjection, setInternalProjection] = useState(3900);
  const [frameThickness, setFrameThickness] = useState(70);
  const [soffitDepth, setSoffitDepth] = useState(150);
  const [maxHeight, setMaxHeight] = useState(''); // Optional
  const [pitch, setPitch] = useState(25);

  // Constants
  const ridgeCapHeight = 60; // fixed ridge cap height (mm)
  const ringBeamThickness = 40; // fixed ring beam thickness (mm)

  // Calculated states
  const [externalWidth, setExternalWidth] = useState(0);
  const [externalProjection, setExternalProjection] = useState(0);
  const [trussLength, setTrussLength] = useState(0);
  const [verticalHeight, setVerticalHeight] = useState(0);
  const [finishedHeight, setFinishedHeight] = useState(0);
  const [calculatedPitch, setCalculatedPitch] = useState(pitch);

  // Helper to convert degrees to radians
  const degToRad = (deg) => (deg * Math.PI) / 180;

  // Helper to convert radians to degrees
  const radToDeg = (rad) => (rad * 180) / Math.PI;

  // Calculate external dimensions
  useEffect(() => {
    setExternalWidth(internalWidth + 2 * frameThickness + 2 * soffitDepth);
    setExternalProjection(internalProjection + frameThickness + soffitDepth);
  }, [internalWidth, internalProjection, frameThickness, soffitDepth]);

  // Calculate pitch if maxHeight is given, else use pitch input
  useEffect(() => {
    if (maxHeight !== '') {
      const targetHeight = parseFloat(maxHeight);
      if (isNaN(targetHeight) || targetHeight <= 0) return;

      // Binary search for pitch approx (0 to 60 degrees)
      let low = 0;
      let high = 60;
      let mid = pitch;
      for (let i = 0; i < 20; i++) {
        mid = (low + high) / 2;
        const pitchRad = degToRad(mid);
        const tLen = externalWidth / (2 * Math.cos(pitchRad));
        const vHeight = Math.sin(pitchRad) * tLen;
        const fHeight = vHeight + ringBeamThickness + frameThickness + ridgeCapHeight;
        if (fHeight > targetHeight) {
          high = mid;
        } else {
          low = mid;
        }
      }
      setCalculatedPitch(mid);
      setPitch(mid);
    } else {
      setCalculatedPitch(pitch);
    }
  }, [maxHeight, pitch, externalWidth, frameThickness]);

  // Calculate lengths and heights based on calculatedPitch
  useEffect(() => {
    const pitchRad = degToRad(calculatedPitch);
    if (externalWidth > 0) {
      const tLen = externalWidth / (2 * Math.cos(pitchRad));
      const vHeight = Math.sin(pitchRad) * tLen;
      const fHeight = vHeight + ringBeamThickness + frameThickness + ridgeCapHeight;

      setTrussLength(tLen);
      setVerticalHeight(vHeight);
      setFinishedHeight(fHeight);
    }
  }, [calculatedPitch, externalWidth, frameThickness]);

  return (
    <div style={{ maxWidth: 600, margin: '20px auto', fontFamily: 'Arial, sans-serif' }}>
      <h2>Geometry & Roof Height Calculator</h2>

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
          Soffit Depth (mm):{' '}
          <input
            type="number"
            min="0"
            value={soffitDepth}
            onChange={(e) => setSoffitDepth(parseInt(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          Max Finished Height (mm):{' '}
          <input
            type="number"
            min="0"
            placeholder="Optional"
            value={maxHeight}
            onChange={(e) => setMaxHeight(e.target.value)}
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
            max="60"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value) || 0)}
            style={{ width: 80 }}
          />
        </label>
      </div>

      <hr />

      <div>
        <p>External Width: {externalWidth.toFixed(1)} mm</p>
        <p>External Projection: {externalProjection.toFixed(1)} mm</p>
        <p>Truss Length: {trussLength.toFixed(1)} mm</p>
        <p>Vertical Height (ring beam underside to ridge): {verticalHeight.toFixed(1)} mm</p>
        <p>Finished Ridge Height (frame top to ridge cap): {finishedHeight.toFixed(1)} mm</p>
        <p>Calculated Pitch: {calculatedPitch.toFixed(2)}°</p>
      </div>
    </div>
  );
}
