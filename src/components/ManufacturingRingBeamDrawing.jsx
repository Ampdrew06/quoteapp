import React from "react";

const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const dim = (value, dp = 0) => finite(value).toFixed(dp);
const quantityText = (quantity) => `×${Math.max(0, Math.round(finite(quantity)))}`;

function LayerDrawing({ label, profile, markerId }) {
  const internalLengthMM = finite(profile?.internalEdgeLengthMM);
  const externalLengthMM = finite(profile?.externalEdgeLengthMM);
  const widthMM = finite(profile?.widthMM);
  const startInner = finite(profile?.startInnerExtensionMM);
  const startOuter = finite(profile?.startOuterExtensionMM);
  const endInner = finite(profile?.endInnerExtensionMM);
  const endOuter = finite(profile?.endOuterExtensionMM);
  const longest = Math.max(internalLengthMM, externalLengthMM, 1);
  const scale = 390 / longest;
  const outerX1 = 180;
  const outerX2 = outerX1 + externalLengthMM * scale;
  const visualInset = (extensionMM) => {
    if (extensionMM <= 0) return 0;
    return Math.max(14, extensionMM * scale);
  };
  const innerX1 =
    outerX1 + visualInset(Math.max(0, startOuter - startInner));
  const innerX2 =
    outerX2 - visualInset(Math.max(0, endOuter - endInner));

  const outline = profile?.outline;
  const minX = outline ? Math.min(...outline.map(p=>p.xMM)) : 0;
  const maxX = outline ? Math.max(...outline.map(p=>p.xMM)) : longest;
  const map = p => ({x:180+(p.xMM-minX)*390/Math.max(1,maxX-minX),y:35+p.yMM*47/Math.max(1,widthMM)});
  const path = outline ? outline.map((p,i)=>`${i?'L':'M'} ${map(p).x} ${map(p).y}`).join(' ')+' Z' : `M ${innerX1} 35 L ${innerX2} 35 L ${outerX2} 82 L ${outerX1} 82 Z`;
  const topStart=outline?map({xMM:0,yMM:0}).x:innerX1;
  const topEnd=outline?map({xMM:internalLengthMM,yMM:0}).x:innerX2;
  return (
    <svg
      viewBox="0 0 620 128"
      role="img"
      aria-label={`${label}: internal ${dim(internalLengthMM)} millimetres, external ${dim(externalLengthMM)} millimetres`}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <text x="12" y="67" fontSize="14" fontWeight="800">{label}</text>
      <path
        d={path}
        fill="#f8fafc"
        stroke="#1f2937"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <line x1={topStart} y1="20" x2={topEnd} y2="20" stroke="#64748b" markerStart={`url(#${markerId})`} markerEnd={`url(#${markerId})`} />
      <text x={(topStart + topEnd) / 2} y="15" textAnchor="middle" fontSize="15" fontWeight="700">
        Internal {dim(internalLengthMM)} mm
      </text>

      <line x1={outerX1} y1="99" x2={outerX2} y2="99" stroke="#64748b" markerStart={`url(#${markerId})`} markerEnd={`url(#${markerId})`} />
      <text x={(outerX1 + outerX2) / 2} y="118" textAnchor="middle" fontSize="15" fontWeight="700">
        External {dim(externalLengthMM)} mm
      </text>

      {outline && <text x="180" y="30" fontSize="12" fill="#dc2626" fontWeight="700">{profile.startMitreDeg ? '45°' : 'Square'}</text>}
      {outline && <text x="570" y="30" textAnchor="end" fontSize="12" fill="#dc2626" fontWeight="700">{profile.endMitreDeg ? '45°' : 'Square'}</text>}
      {outline && [
        { extension: startOuter, leg: profile.startSquareLegMM, x: 180, side: "start" },
        { extension: endOuter, leg: profile.endSquareLegMM, x: 570, side: "end" },
      ].filter(end => end.extension > 0 && finite(end.leg) > 0).map(end => {
        const top = 35 + end.extension * 47 / Math.max(1, widthMM);
        const dx = end.side === "start" ? 20 : -20;
        return <g key={end.side}>
          <line x1={end.x + dx} y1={top} x2={end.x + dx} y2="82" stroke="#64748b" />
          <line x1={end.x} y1={top} x2={end.x + dx + (dx > 0 ? 4 : -4)} y2={top} stroke="#64748b" />
          <line x1={end.x} y1="82" x2={end.x + dx + (dx > 0 ? 4 : -4)} y2="82" stroke="#64748b" />
          <text x={end.x + dx + (dx > 0 ? 6 : -6)} y={(top + 82) / 2 + 4} textAnchor={dx > 0 ? "start" : "end"} fontSize="13" fontWeight="800">{dim(end.leg)} mm</text>
        </g>;
      })}
      <line x1="164" y1="35" x2="164" y2="82" stroke="#64748b" />
      <line x1="157" y1="35" x2="171" y2="35" stroke="#64748b" />
      <line x1="157" y1="82" x2="171" y2="82" stroke="#64748b" />
      <text x="150" y="61" textAnchor="middle" fontSize="13" fontWeight="700" transform="rotate(-90 150 61)">
        {dim(widthMM, 1)} mm
      </text>
    </svg>
  );
}

function BaseLayoutDrawing({ cuts }) {
  const segments = cuts?.baseLayout || [];
  const totalMM = Math.max(1, finite(cuts?.baseLayoutLengthMM));
  const x = 28;
  const y = 28;
  const width = 564;
  const height = 48;
  let cursor = x;

  return (
    <div style={{ marginTop: 6, borderTop: "1px solid #dbe3ec", paddingTop: 7 }}>
      <div style={{ fontSize: 13, fontWeight: 800 }}>Base layout — internal edge</div>
      <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>
        Dark blocks are 48 mm member positions; numbered spaces are clear upstand bays.
      </div>
      <svg viewBox="0 0 620 112" role="img" aria-label="Ring-beam member positions and clear upstand bays" style={{ width: "100%", height: "auto", display: "block" }}>
        {segments.map((segment, index) => {
          const segmentWidth = (finite(segment.widthMM) / totalMM) * width;
          const segmentX = cursor;
          cursor += segmentWidth;
          const isSlot = segment.type === "member-slot";
          return (
            <g key={`${segment.type}-${index}`}>
              <rect
                x={segmentX}
                y={y}
                width={segmentWidth}
                height={height}
                fill={isSlot ? "#334155" : "#f8fafc"}
                stroke="#1f2937"
                strokeWidth="1"
              />
              {!isSlot && (
                <>
                  <text x={segmentX + segmentWidth / 2} y={y + 20} textAnchor="middle" fontSize="10" fontWeight="800">
                    {segment.bayLabel || `B${segment.bayNumber}`}
                  </text>
                  <text x={segmentX + segmentWidth / 2} y={y + 37} textAnchor="middle" fontSize="10" fontWeight="700">
                    {dim(segment.widthMM)}
                  </text>
                </>
              )}
            </g>
          );
        })}
        <line x1={x} y1="91" x2={x + width} y2="91" stroke="#64748b" />
        <line x1={x} y1="84" x2={x} y2="98" stroke="#64748b" />
        <line x1={x + width} y1="84" x2={x + width} y2="98" stroke="#64748b" />
        <text x={x + width / 2} y="108" textAnchor="middle" fontSize="13" fontWeight="700">
          Internal layout {dim(totalMM)} mm
        </text>
      </svg>
    </div>
  );
}

export default function ManufacturingRingBeamDrawing({ group }) {
  const cuts = group?.cuts || {};
  const beam = group?.ringBeam || {};
  const references = (group?.manufactureRefs || []).join(" / ");
  const sides = group?.sides || [];
  const label = sides.includes("front") ? "Front Ring-beam" : "Side Ring-beam";
  const mirroredPair =
    group?.quantity === 2 && sides.includes("left") && sides.includes("right");
  const markerId = `ring-beam-arrow-${references.replace(/\W/g, "")}`;

  return (
    <div
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: 6,
        padding: 12,
        background: "#fff",
        boxSizing: "border-box",
        breakInside: "avoid",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>{references}</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{label}</div>
        <div style={{ marginLeft: "auto", fontSize: 16, fontWeight: 800 }}>
          {quantityText(group?.quantity)}
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
        {mirroredPair
          ? "Make one left-hand and one mirrored right-hand. Cut quantities below are for each beam."
          : "Layered plan profiles. Cut quantities below are for each beam."}
      </div>

      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <marker id={markerId} markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
            <path d="M 0 0 L 7 3.5 L 0 7 z" fill="#64748b" />
          </marker>
        </defs>
      </svg>

      <LayerDrawing label="30×95 PSE" profile={cuts.continuous?.pse30x90} markerId={markerId} />
      <LayerDrawing label="9 mm ply base" profile={cuts.continuous?.ply9Base} markerId={markerId} />
      <LayerDrawing label="25×50 outer lath" profile={cuts.continuous?.outerLath25x50} markerId={markerId} />

      <div style={{ fontSize: 10, color: "#64748b", marginTop: -2 }}>
        Mitre shapes enlarged for clarity; always work to the printed dimensions.
      </div>

      {cuts.continuous?.ply9Base?.outline && <div style={{fontSize:12,margin:'5px 0'}}>
        Ply corner: {cuts.continuous.ply9Base.startMitreDeg ? `start 45° then ${dim(cuts.continuous.ply9Base.startSquareLegMM,1)} mm square leg` : 'start square'} · {cuts.continuous.ply9Base.endMitreDeg ? `end 45° then ${dim(cuts.continuous.ply9Base.endSquareLegMM,1)} mm square leg` : 'end square'}.
      </div>}
      <BaseLayoutDrawing cuts={cuts} />

      <div style={{ marginTop: 3, padding: "7px 9px", background: "#f8fafc", border: "1px solid #dbe3ec", borderRadius: 4, fontSize: 10 }}>
        <b>Assembly datums:</b> PSE flush to the internal ply edge · outer lath flush to the external ply edge · keep each dark 48 mm member position clear · fit one ply upstand and one finishing lath across every numbered bay · fit two PIR faces per bay.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 7,
          marginTop: 4,
        }}
      >
        {(cuts.bayGroups || []).map((part) => (
          <div key={part.widthMM} style={{ border: "1px solid #dbe3ec", borderRadius: 4, padding: 7 }}>
            <div style={{ fontSize: 12, fontWeight: 800 }}>{dim(part.widthMM)} mm bay</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>
              9 mm ply: {dim(part.widthMM)} × {dim(cuts.upstandHeightMM)} mm {quantityText(part.upstandQuantity)}
            </div>
            <div style={{ fontSize: 11, marginTop: 3 }}>
              25×50 lath: {dim(part.widthMM)} mm {quantityText(part.finishingLathQuantity)}
            </div>
            <div style={{ fontSize: 11, marginTop: 3 }}>
              50 mm PIR: {dim(part.widthMM)} × {dim(cuts.pirHeightMM)} mm {quantityText(part.pirQuantity)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, fontSize: 11, color: "#475569" }}>
        Pitch {dim(cuts.pitchDeg, 1)}° · manufactured soffit {dim(cuts.manufacturedSoffitMM)} mm · VFC {dim(cuts.verticalFootCutMM)} mm · {beam.upstandCount || 0} upstands
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: "#b45309", fontWeight: 700 }}>
        READ ONLY — manufacturing layout pending factory review
      </div>
    </div>
  );
}
