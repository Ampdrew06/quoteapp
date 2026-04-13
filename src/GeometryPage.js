import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function GeometryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize inputs from route state or defaults
  const initialState = location.state || {};

  const [internalWidth, setInternalWidth] = useState(initialState.internalWidth ?? 4450);
  const [internalProjection, setInternalProjection] = useState(initialState.internalProjection ?? 3900);
  const [roofPitch, setRoofPitch] = useState(initialState.pitch ?? 25);
  const [frameThickness, setFrameThickness] = useState(initialState.frameThickness ?? 70);
  const [soffitSize, setSoffitSize] = useState(initialState.soffitDepth ?? 150);
  const [ringBeamThickness, setRingBeamThickness] = useState(40); // fixed
  const [rafterSpacing, setRafterSpacing] = useState(665);
  const [trussThickness, setTrussThickness] = useState(47);
  const [maxHeight, setMaxHeight] = useState(initialState.maxHeight ?? "");
  const [hookLength, setHookLength] = useState(125);
  const [pricePerMeter, setPricePerMeter] = useState(initialState.pricePerMeter ?? 6.12);

  // --- NEW: Lean-to geometry & roof build-up inputs (kept simple, with sensible defaults)
  const [wallplateThk, setWallplateThk] = useState(63);   // t_wp
  const [hangerAllowance, setHangerAllowance] = useState(2); // t_h
  const [rafterDepth, setRafterDepth] = useState(220);    // d
  const [membraneThk, setMembraneThk] = useState(1);
  const [lathThk, setLathThk] = useState(25);
  const [tileThk, setTileThk] = useState(15);

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
  const [footCutLength, setFootCutLength] = useState(0);

  // --- NEW: expose lean-to metrics you asked for
  const [ltA, setLtA] = useState(0); // underside length A
  const [ltB, setLtB] = useState(0); // top-edge length B
  const [ltDOuter, setLtDOuter] = useState(0); // top of rafter @ wall (outer ref)
  const [ltFinishedOuter, setLtFinishedOuter] = useState(0); // finished to top of tiles (outer ref)
  const [ltFinishedInner, setLtFinishedInner] = useState(0); // finished to top of tiles (inner ref)

  // Constants
  const sparHookCutAngle = 19;
  const ridgeCapHeight = 60;

  // Helpers
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const calculateTrussLength = (extWidth, pitchDegrees) => {
    const theta = toRad(pitchDegrees);
    return (extWidth / 2) / Math.cos(theta);
    // Note: this "truss" bit is your existing gable/hip scratch logic; left intact.
  };

  const calculateVerticalTrussHeight = (trussLength, pitchDegrees) => {
    const theta = toRad(pitchDegrees);
    return Math.sin(theta) * trussLength;
  };

  const calculateRidgeLength = (internalProj, internalWidth) => {
    return internalProj - internalWidth / 2;
  };

  const calculateNumTrusses = (ridgeLen, trussThick, rafterSpacing) => {
    return Math.ceil((ridgeLen - trussThick) / rafterSpacing) + 1;
  };

  const calculateHipPitch = (roofPitchDegrees) => {
    const theta = toRad(roofPitchDegrees);
    const hipPitchRad = Math.atan(Math.tan(theta) * Math.cos(toRad(45)));
    return toDeg(hipPitchRad);
  };

  const calculateFootCutLength = (ringBeamWidth, soffitDepth, hipPitchDegrees) => {
    const diagonal = Math.sqrt(ringBeamWidth * ringBeamWidth + soffitDepth * soffitDepth);
    const hipPitchRad = toRad(hipPitchDegrees);
    return diagonal / Math.cos(hipPitchRad);
  };

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
    const footCut = calculateFootCutLength(ringBeamThickness + soffitSize, soffitSize, hipPitchDegrees);
    const finalHipLength = hipLen + footCut + hookLength;

    return { finalHipLength, hipPitchDegrees, footCut };
  };

  // Calculate external dims
  useEffect(() => {
    setExternalWidth(internalWidth + 2 * frameThickness + 2 * soffitSize);
    setExternalProjection(internalProjection + frameThickness + soffitSize);
  }, [internalWidth, internalProjection, frameThickness, soffitSize]);

  // Only recalc pitch if maxHeight set, else keep manual pitch
  useEffect(() => {
    if (maxHeight !== "") {
      const targetHeight = parseFloat(maxHeight);
      if (isNaN(targetHeight) || targetHeight <= 0) return;

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
      setRoofPitch(mid);
    } else {
      setHipPitch(roofPitch);
    }
  }, [maxHeight, roofPitch, externalWidth, frameThickness]);

  // Main calc useEffect
  useEffect(() => {
    if (
      internalWidth > 0 &&
      internalProjection > 0 &&
      roofPitch > 0 &&
      rafterSpacing > 0 &&
      trussThickness > 0
    ) {
      // Existing scratch calcs
      const tLength = calculateTrussLength(externalWidth, roofPitch);
      const vHeight = calculateVerticalTrussHeight(tLength, roofPitch);
      const fHeight = vHeight + ringBeamThickness + frameThickness + ridgeCapHeight;
      const rLength = calculateRidgeLength(internalProjection, internalWidth);
      const nTrusses = calculateNumTrusses(rLength, trussThickness, rafterSpacing);
      const totalMeters = nTrusses * (tLength / 1000) + 5 + 10; // placeholder kept
      const stocks = Math.ceil(totalMeters / 12);
      const cost = totalMeters * pricePerMeter;

      const { finalHipLength, hipPitchDegrees, footCut } = calculateHipLength({
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
      setFootCutLength(footCut);

      // --- NEW: Lean-to finished-height patch (outer & inner refs)
      // Matches the lean-to math we’re using elsewhere:
      // A = (internalProjection - t_wp - t_h) / cosθ
      // B = (internalProjection + soffit + frame_on) / cosθ
      // D_outer = 39 + (internalProjection - t_wp - t_h) * tanθ + d * cosθ
      // Finished_outer = D_outer + (membrane + lath + tile) * cosθ
      // Finished_inner = Finished_outer + frame_on * tanθ
      const theta = toRad(roofPitch);
      const cosT = Math.cos(theta);
      const tanT = Math.tan(theta);

      const R_under = internalProjection - wallplateThk - hangerAllowance;
      const A_mm = R_under / cosT;
      const R_top = internalProjection + soffitSize + frameThickness; // ext projection per your page
      const B_mm = R_top / cosT;

      const D_outer =
        39 + R_under * tanT + rafterDepth * Math.cos(theta);

      const buildUpVertical =
        (membraneThk + lathThk + tileThk) * Math.cos(theta);

      const finishedOuter = D_outer + buildUpVertical;
      const finishedInner = finishedOuter + frameThickness * tanT;

      setLtA(A_mm);
      setLtB(B_mm);
      setLtDOuter(D_outer);
      setLtFinishedOuter(finishedOuter);
      setLtFinishedInner(finishedInner);
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
      setFootCutLength(0);

      // reset lean-to readouts too
      setLtA(0);
      setLtB(0);
      setLtDOuter(0);
      setLtFinishedOuter(0);
      setLtFinishedInner(0);
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
    hookLength,
    // NEW deps:
    wallplateThk,
    hangerAllowance,
    rafterDepth,
    membraneThk,
    lathThk,
    tileThk,
    externalWidth,
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
          Soffit Depth (mm):
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
        <label title="Length of spar hook for fabrication (mm)">
          Hip Foot Cut Length (mm):
          <input
            type="number"
            min="0"
            value={footCutLength}
            readOnly
            style={{ width: 80, marginLeft: 10, backgroundColor: "#eee" }}
          />
          <span style={{ marginLeft: 5, fontStyle: "italic", fontSize: 12 }}>
            (calculated)
          </span>
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
          Max Finished Height (mm, optional):
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

      {/* --- NEW: Lean-to specific inputs (kept compact) --- */}
      <hr />
      <h4 style={{ marginTop: 16, marginBottom: 8 }}>Lean-To Geometry & Roof Build-up</h4>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <label>
          Wallplate t<sub>wp</sub> (mm)
          <input
            type="number"
            value={wallplateThk}
            onChange={(e) => setWallplateThk(parseInt(e.target.value) || 0)}
            style={{ width: "100%", marginTop: 4 }}
          />
        </label>
        <label>
          Hanger t<sub>h</sub> (mm)
          <input
            type="number"
            value={hangerAllowance}
            onChange={(e) => setHangerAllowance(parseInt(e.target.value) || 0)}
            style={{ width: "100%", marginTop: 4 }}
          />
        </label>
        <label>
          Rafter depth d (mm)
          <input
            type="number"
            value={rafterDepth}
            onChange={(e) => setRafterDepth(parseInt(e.target.value) || 0)}
            style={{ width: "100%", marginTop: 4 }}
          />
        </label>

        <label>
          Membrane (mm)
          <input
            type="number"
            value={membraneThk}
            onChange={(e) => setMembraneThk(parseInt(e.target.value) || 0)}
            style={{ width: "100%", marginTop: 4 }}
          />
        </label>
        <label>
          Lath (mm)
          <input
            type="number"
            value={lathThk}
            onChange={(e) => setLathThk(parseInt(e.target.value) || 0)}
            style={{ width: "100%", marginTop: 4 }}
          />
        </label>
        <label>
          Tile (mm)
          <input
            type="number"
            value={tileThk}
            onChange={(e) => setTileThk(parseInt(e.target.value) || 0)}
            style={{ width: "100%", marginTop: 4 }}
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
        <p>Hip Length (adjusted for foot cut & hook): {hipLength.toFixed(0)} mm</p>
        <p>Fixed Spar Hook Cut Angle (fabrication): {sparHookCutAngle}°</p>

        {/* --- NEW: lean-to readout you asked for --- */}
        <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #ddd" }}>
          <h4>Lean-To Derived (for verification & insulation/tile planning)</h4>
          <p>A (underside length): {ltA.toFixed(0)} mm</p>
          <p>B (top-edge length): {ltB.toFixed(0)} mm</p>
          <p>D (top of rafter @ wall, outer ref): {ltDOuter.toFixed(0)} mm</p>
          <p>
            Finished @ wall (to top of tiles, outer ref): {ltFinishedOuter.toFixed(0)} mm
            {" "}
            <span style={{ color: "#666" }}>
              (build-up {membraneThk}+{lathThk}+{tileThk} mm)
            </span>
          </p>
          <p style={{ color: "#666" }}>
            Finished @ wall (inner ref): {ltFinishedInner.toFixed(0)} mm
          </p>
        </div>
      </div>
    </div>
  );
}
