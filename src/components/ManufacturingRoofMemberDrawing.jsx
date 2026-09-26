import React from "react";

const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const dim = (value, dp = 0) => finite(value).toFixed(dp);

export default function ManufacturingRoofMemberDrawing({ group }) {
  const profile = group?.profile || {};
  const isJack = group?.type === "jack-rafter";
  const isBossRafter = group?.type === "boss-rafter";
  const isRegularRafter = group?.type === "rafter";
  const references = (group?.manufactureRefs || []).join(" / ");
  const pitchDeg = profile.hipPitchDeg ?? profile.facetPitchDeg;

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
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          {isJack
            ? "Jack Rafter"
            : isBossRafter
              ? "Boss Rafter"
              : isRegularRafter
                ? "Rafter"
                : "Hip"}
        </div>
        {group?.quantity > 1 && (
          <div style={{ marginLeft: "auto", fontSize: 20, fontWeight: 800 }}>
            ×{group.quantity}
          </div>
        )}
      </div>

      <svg
        viewBox="0 0 520 245"
        role="img"
        aria-label={`${references} ${isJack ? "jack rafter" : "hip"} manufacture profile`}
        style={{ display: "block", width: "100%", height: "auto" }}
      >
        <defs>
          <marker id={`arrow-${references.replace(/\W/g, "")}`} markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
            <path d="M 0 0 L 7 3.5 L 0 7 z" fill="#64748b" />
          </marker>
        </defs>

        <path
          d="M 72 133 L 72 174 L 143 174 L 422 91 L 422 43 Z"
          fill="#f8fafc"
          stroke="#1f2937"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        <text x="236" y="65" textAnchor="middle" fontSize="13" fontWeight="700">
          {dim(profile.externalSlopeLengthMM)} mm
        </text>
        <text x="286" y="151" textAnchor="middle" fontSize="13" fontWeight="700">
          {dim(profile.internalSlopeLengthMM)} mm
        </text>

        <line x1="72" y1="194" x2="143" y2="194" stroke="#64748b" strokeWidth="1.3" />
        <line x1="72" y1="184" x2="72" y2="204" stroke="#64748b" />
        <line x1="143" y1="184" x2="143" y2="204" stroke="#64748b" />
        <text x="107" y="216" textAnchor="middle" fontSize="12" fontWeight="700">
          {dim(profile.horizontalFootCutMM)} mm
        </text>

        <line x1="51" y1="133" x2="51" y2="174" stroke="#64748b" strokeWidth="1.3" />
        <line x1="43" y1="133" x2="60" y2="133" stroke="#64748b" />
        <line x1="43" y1="174" x2="60" y2="174" stroke="#64748b" />
        <text x="39" y="158" textAnchor="middle" fontSize="12" fontWeight="700" transform="rotate(-90 39 158)">
          {dim(profile.verticalFootCutMM)} mm
        </text>

        <line x1="445" y1="43" x2="445" y2="91" stroke="#64748b" strokeWidth="1.3" />
        <line x1="436" y1="43" x2="454" y2="43" stroke="#64748b" />
        <line x1="436" y1="91" x2="454" y2="91" stroke="#64748b" />
        <text x="463" y="68" textAnchor="middle" fontSize="12" fontWeight="700" transform="rotate(-90 463 68)">
          {dim(profile.topVerticalCutMM)} mm
        </text>

        <text x="150" y="185" fill="#dc2626" fontSize="18" fontWeight="800">
          {dim(pitchDeg, 1)}°
        </text>

        {isJack && (
          <>
            <line
              x1="422"
              y1="25"
              x2="469"
              y2="25"
              stroke="#64748b"
              strokeWidth="1.2"
              markerStart={`url(#arrow-${references.replace(/\W/g, "")})`}
              markerEnd={`url(#arrow-${references.replace(/\W/g, "")})`}
            />
            <line x1="422" y1="32" x2="422" y2="18" stroke="#64748b" />
            <line x1="469" y1="99" x2="469" y2="18" stroke="#64748b" strokeDasharray="4 3" />
            <text x="445" y="15" textAnchor="middle" fontSize="11" fontWeight="700">
              {dim(profile.hipCentrelineSetbackMM)} mm
            </text>
            <text x="475" y="119" textAnchor="end" fontSize="10" fill="#475569">
              hip centreline
            </text>
          </>
        )}
      </svg>

      <div style={{ fontSize: 11, color: "#b45309", fontWeight: 700 }}>
        {isBossRafter
          ? `${dim(profile.bossTerminalAllowanceMM)} mm provisional boss-terminal allowance — factory check pending`
          : isJack || group?.type === "hip"
            ? "PROVISIONAL — physical factory check pending"
            : "Front-facet manufacture profile"}
      </div>
    </div>
  );
}
