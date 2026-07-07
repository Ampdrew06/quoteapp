// src/components/HippedLeanToOptions.jsx
import React from "react";

export default function HippedLeanToOptions({
  leftHip,
  setLeftHip,
  rightHip,
  setRightHip,
  leftHipWidthMM,
  setLeftHipWidthMM,
  rightHipWidthMM,
  setRightHipWidthMM,
  setLeftHipWidthManual,
  setRightHipWidthManual,
  leftWall,
  setLeftWall,
  rightWall,
  setRightWall,
  tileSystem,
  minTilePitchDeg,
  leftSidePitchDeg,
  rightSidePitchDeg,
  leftHipPitchTooLow,
  rightHipPitchTooLow,
  persist,
}) {
  return (
  <div
    style={{
      marginTop: 16,
      padding: 12,
      border: "1px solid #ddd",
      borderRadius: 8,
      background: "#f9fafb",
      width: "100%",
      boxSizing: "border-box",
    }}
  >
    <h3 style={{ margin: "0 0 10px 0" }}>Hip Configuration</h3>

   <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    alignItems: "center",
  }}
>
  <label>
    <input
      type="checkbox"
      checked={leftHip}
      onChange={(e) => setLeftHip(e.target.checked)}
    />{" "}
    Left Hip{" "}
    {leftHip && (
      <input
        type="number"
        value={leftHipWidthMM}
        onChange={(e) => {
  setLeftHipWidthMM(e.target.value);
  setLeftHipWidthManual(true);
}}
        style={{ marginLeft: 8, width: 80 }}
      />
    )}
  </label>

  <label>
    <input
      type="checkbox"
      checked={rightHip}
      onChange={(e) => setRightHip(e.target.checked)}
    />{" "}
    Right Hip{" "}
    {rightHip && (
      <input
        type="number"
        value={rightHipWidthMM}
        onChange={(e) => {
  setRightHipWidthMM(e.target.value);
  setRightHipWidthManual(true);
}}
        style={{ marginLeft: 8, width: 80 }}
      />
    )}
  </label>

  <label>
    <input
      type="checkbox"
      checked={leftWall}
      onChange={(e) => {
        const v = e.target.checked;
        setLeftWall(v);
        persist({ left_wall_present: v, left_exposed: !v });
      }}
    />{" "}
    Left Wall Present
  </label>

  <label>
    <input
      type="checkbox"
      checked={rightWall}
      onChange={(e) => {
        const v = e.target.checked;
        setRightWall(v);
        persist({ right_wall_present: v, right_exposed: !v });
      }}
    />{" "}
    Right Wall Present
  </label>
</div>
{(leftHipPitchTooLow || rightHipPitchTooLow) && (
  <div
    style={{
      marginTop: 10,
      padding: 10,
      border: "1px solid #fca5a5",
      borderRadius: 6,
      background: "#fef2f2",
      color: "#991b1b",
      fontSize: 13,
    }}
  >
    {leftHipPitchTooLow && (
      <div>
        ⚠ Left side pitch is {leftSidePitchDeg.toFixed(1)}°, below the minimum{" "}
        {minTilePitchDeg}° for {tileSystem === "liteslate" ? "LiteSlate" : "Britmet"}.
        Increase the left hip width or raise the front pitch.
      </div>
    )}

    {rightHipPitchTooLow && (
      <div>
        ⚠ Right side pitch is {rightSidePitchDeg.toFixed(1)}°, below the minimum{" "}
        {minTilePitchDeg}° for {tileSystem === "liteslate" ? "LiteSlate" : "Britmet"}.
        Increase the right hip width or raise the front pitch.
      </div>
    )}
  </div>
)}
    {!leftHip && !rightHip && (
      <p style={{ color: "#b91c1c", margin: "10px 0 0" }}>
        Select at least one hip side.
      </p>
    )}
  </div>
);
}