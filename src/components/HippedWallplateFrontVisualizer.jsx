import React from "react";

/** Uses the same finished assembly as the manufacture book. */
export default function HippedWallplateFrontVisualizer({ geometry }) {
  const assembly = geometry?.wallplateAssembly;
  if (!assembly?.valid) {
    return <div role="alert">Wallplate assembly cannot be verified from the current geometry. Check the wallbar feet, pitches and height.</div>;
  }
  const sides = [
    { name: "Left", side: assembly.left, plan: geometry.resolvedLeftHipWidthMM },
    { name: "Right", side: assembly.right, plan: geometry.resolvedRightHipWidthMM },
  ].filter(({ side }) => side);
  const minX = assembly.left?.externalFoot.xMM ?? 0;
  const maxX = assembly.right?.externalFoot.xMM ?? assembly.internalWidthMM;
  const scale = Math.min(1000 / (maxX - minX), 270 / assembly.topHeightMM);
  const floorY = 355;
  const map = ({ xMM, yMM }) => ({ x: 50 + (xMM - minX) * scale, y: floorY - yMM * scale });
  const polygon = (points) => points.map((p) => { const q = map(p); return `${q.x},${q.y}`; }).join(" ");
  const h = assembly.horizontal;
  const tl = map(h.topLeft), tr = map(h.topRight);
  const bl = map(h.bottomLeft), br = map(h.bottomRight);
  const dimension = (x1, x2, y, label, colour) => (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={colour} strokeWidth="2" />
      {[x1, x2].map((x, i) => <line key={i} x1={x} y1={y - 6} x2={x} y2={y + 6} stroke={colour} strokeWidth="2" />)}
      <text x={(x1 + x2) / 2} y={y - 9} textAnchor="middle" fill={colour} fontSize="18" fontWeight="700">{label}</text>
    </g>
  );
  const cell = { padding: "7px 10px", borderBottom: "1px solid #cbd5e1", textAlign: "left" };
  return (
    <section style={{ border: "1px solid #10b981", background: "#ecfdf5", padding: 12, marginTop: 12 }}>
      <h3 style={{ margin: "0 0 6px" }}>Hipped wallplate — finished assembly</h3>
      <div>Shared with the manufacture book. Heights are measured from the factory floor; wallbar feet sit on the {assembly.ringBeamHeightMM.toFixed(0)}mm ring-beam.</div>
      <svg viewBox="0 0 1100 435" role="img" aria-label="Finished wallplate assembly with joint endpoints A and C and boss centre B" style={{ width: "100%", background: "white", marginTop: 10 }}>
        <line x1="30" y1={floorY} x2="1070" y2={floorY} stroke="#64748b" />
        <text x="30" y={floorY + 20} fontSize="15" fill="#475569">Factory floor datum</text>
        <polygon points={polygon([h.topLeft, h.topRight, h.bottomRight, h.bottomLeft])} fill="#fef08a" stroke="#334155" strokeWidth="2" />
        {sides.map(({ name, side }) => {
          const a = map(side.A), b = map(side.B), c = map(side.C);
          const f = map(side.externalFoot), i = map(side.internalFoot);
          const outsideBottom = { xMM: side.externalFoot.xMM, yMM: assembly.ringBeamHeightMM };
          return <g key={name}>
            <polygon points={polygon([side.externalFoot, side.A, side.C, side.internalFoot, outsideBottom])} fill="#bef264" stroke="#334155" strokeWidth="2" />
            <rect x={b.x - 15} y={b.y - 14} width="30" height="28" fill="#c4b5fd" fillOpacity="0.75" stroke="#7c3aed" />
            <circle cx={a.x} cy={a.y} r="3" /><circle cx={c.x} cy={c.y} r="3" />
            <text x={a.x - 12} y={a.y - 6} textAnchor="end" fontSize="17" fontWeight="700">A</text>
            <text x={b.x} y={b.y + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill="#5b21b6">B</text>
            <text x={c.x + 12} y={c.y + 18} fontSize="17" fontWeight="700">C</text>
            <text x={(f.x + a.x) / 2} y={(f.y + a.y) / 2 - 12} textAnchor="middle" fontSize="17" fontWeight="700">EWBS {side.externalSlopeMM.toFixed(1)}mm</text>
            <text x={(i.x + c.x) / 2} y={(i.y + c.y) / 2 + 22} textAnchor="middle" fontSize="17">IWBS {side.internalSlopeMM.toFixed(1)}mm</text>
          </g>;
        })}
        {dimension(tl.x, tr.x, tl.y - 32, `EWPL ${assembly.externalLengthMM.toFixed(1)}mm`, "#92400e")}
        {dimension(bl.x, br.x, bl.y + 48, `IWPL ${assembly.internalLengthMM.toFixed(1)}mm`, "#6d28d9")}
        <text x="550" y="412" textAnchor="middle" fontSize="17">Top height {assembly.topHeightMM.toFixed(1)}mm · Underside {assembly.bottomHeightMM.toFixed(1)}mm</text>
      </svg>
      <div style={{ overflowX: "auto", background: "white" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead><tr>{["Side", "A — joint top", "B — boss centre", "C — joint bottom", "Plan boss centre (B)"].map((title) => <th key={title} style={cell}>{title}</th>)}</tr></thead>
          <tbody>{sides.map(({ name, side, plan }) => <tr key={name}>
            <th style={cell}>{name}</th>
            {[side.topPositionMM, side.bossCentrePositionMM, side.bottomPositionMM, plan].map((value, i) => <td key={i} style={cell}>{Number(value).toFixed(1)}mm</td>)}
          </tr>)}</tbody>
        </table>
      </div>
      <div style={{ marginTop: 8 }}>{sides.map(({ name, side }) =>
        <div key={name}>{name}: pitch {side.pitchDeg.toFixed(2)}°;
          HFC {Math.abs(side.externalFoot.xMM - side.internalFoot.xMM).toFixed(1)}mm;
          VFC {(side.externalFoot.yMM - assembly.ringBeamHeightMM).toFixed(1)}mm.</div>
      )}</div>
      <p style={{ marginBottom: 0 }}>A, B and C are measured horizontally inward from each internal side-frame line. B is the midpoint of the timber joint. The plan boss position uses that same centre. An explicit side-pitch override moves B.</p>
    </section>
  );
}
