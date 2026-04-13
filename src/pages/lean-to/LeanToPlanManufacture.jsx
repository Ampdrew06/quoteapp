// src/pages/lean-to/LeanToPlanManufacture.jsx
import React, { useMemo } from "react";
import { getMaterials } from "../../lib/materials";
import PlanDiagramLeanToManufacture from "../../components/PlanDiagramLeanToManufacture";
import { computeLeanToManufactureGeometry } from "../../lib/leanToManufactureGeometry";
import NavTabs from "../../components/NavTabs";
import IdiotList from "./IdiotList";

const num = (v, f = 0) => (Number.isFinite(Number(v)) ? Number(v) : f);
const round = (v, dp = 0) => {
  const p = 10 ** dp;
  return Math.round((Number(v) || 0) * p) / p;
};

function loadInputs() {
  try {
    const s = localStorage.getItem("leanToInputs");
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

const panel = {
  width: "100%",
  padding: "10mm 8mm",
  boxSizing: "border-box",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
};

const th = {
  border: "1px solid #d1d5db",
  padding: "7px 9px",
  textAlign: "left",
  background: "#f3f4f6",
  fontWeight: 700,
  fontSize: 13,
};

const td = {
  border: "1px solid #d1d5db",
  padding: "7px 9px",
  verticalAlign: "top",
  fontSize: 13,
};

const sectionTitle = {
  fontSize: 17,
  fontWeight: 800,
  margin: "0 0 8px",
};

function BookFrontRow({ leftLabel, leftValue, rightLabel, rightValue }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "170px 1fr 170px 1fr",
        gap: 8,
        alignItems: "center",
        padding: "7px 0",
        borderBottom: "1px solid #e5e7eb",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 700, color: "#374151" }}>{leftLabel}</div>
      <div style={{ color: "#111827" }}>{leftValue || "—"}</div>
      <div style={{ fontWeight: 700, color: "#374151" }}>{rightLabel}</div>
      <div style={{ color: "#111827" }}>{rightValue || "—"}</div>
    </div>
  );
}
function RafterDetailDiagram({
  externalSlopeMM,
  internalSlopeMM,
  plumbCutMM,
  seatCutLengthMM,
  wallplateFaceCutMM,
  overallBlankLengthMM,
  topAngleDeg,
  bottomAngleDeg,
}) {
  return (
        <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fff",
        padding: 0,
      }}
    >
      <svg
        viewBox="0 0 980 260"
        style={{ width: "100%", height: "330px", display: "block" }}
      >
        

        {/* ===== RAFTER SHAPE (5 edges) ===== */}
        <polygon
          points="
            220,190
            220,150
            760,85
            760,140
            320,190
          "
          fill="none"
          stroke="#111827"
          strokeWidth="2"
        />

        {/* ===== A (keep as placeholder) ===== */}
        <line x1="174" y1="63" x2="188" y2="100" stroke="#111827" strokeWidth="1" />
        <line x1="730" y1="01" x2="743" y2="30" stroke="#111827" strokeWidth="1" />
        <line x1="180" y1="80" x2="736" y2="15" stroke="#111827" strokeWidth="1" />
        <text x="460" y="35" textAnchor="middle" fontSize="15" fontWeight="600" fill="#111827">
  {overallBlankLengthMM} mm
</text>

        {/* ===== D (keep for now) ===== */}
        
        <text x="822" y="122" fontSize="15" fill="#111827">
  {wallplateFaceCutMM} mm
</text>

        {/* ===== B value only ===== */}
        <text x="500" y="108" textAnchor="middle" fontSize="15" fill="#111827">
          {externalSlopeMM} mm
        </text>

        {/* ===== C value only ===== */}
        <text x="560" y="190" textAnchor="middle" fontSize="15" fill="#111827">
          {internalSlopeMM} mm
        </text>

        {/* ===== E value only ===== */}
        <text x="270" y="210" textAnchor="middle" fontSize="15" fill="#111827">
          {seatCutLengthMM} mm
        </text>

        {/* ===== F value only ===== */}
        <text x="160" y="170" fontSize="15" fill="#111827">
          {plumbCutMM} mm
        </text>

        {/* ===== Angles (simple, no arcs) ===== */}
        <text x="225" y="165" fontSize="14" fill="#dc2626" fontWeight="700">
          {bottomAngleDeg}°
        </text>

        <text x="735" y="134" fontSize="14" fill="#dc2626" fontWeight="700">
          {topAngleDeg}°
        </text>
      </svg>
    </div>
  );
}
export default function LeanToPlanManufacture() {
  const m = getMaterials();
  const q = loadInputs();

  // Core quote inputs
  const iw = num(q.internalWidthMM, 3500);
  const ip = num(q.internalProjectionMM, 2500);
  const pitchDeg = num(q.pitchDeg, 15);

  const sft = num(q.side_frame_thickness_mm ?? m.side_frame_thickness_mm ?? 70);
  const lip = num(q.fascia_lip_mm ?? m.fascia_lip_mm ?? 25);
  const frameOn = num(q.frame_on_mm ?? m.frame_on_mm ?? 70);
  const soffit = num(q.soffit_mm ?? 150);
  const L = num(q.left_overhang_mm, 0);
  const R = num(q.right_overhang_mm, 0);

  // Exposure / ends
const leftWall =
  typeof q.left_exposed === "boolean" ? !q.left_exposed :
  typeof q.left_wall_present === "boolean" ? q.left_wall_present :
  typeof q.leftWallPresent === "boolean" ? q.leftWallPresent :
  typeof q.leftWall === "boolean" ? q.leftWall :
  typeof q.left_verge_exposed === "boolean" ? !q.left_verge_exposed :
  false;

const rightWall =
  typeof q.right_exposed === "boolean" ? !q.right_exposed :
  typeof q.right_wall_present === "boolean" ? q.right_wall_present :
  typeof q.rightWallPresent === "boolean" ? q.rightWallPresent :
  typeof q.rightWall === "boolean" ? q.rightWall :
  typeof q.right_verge_exposed === "boolean" ? !q.right_verge_exposed :
  false;

const leftSideLabel = leftWall ? "WALL" : "END";
const rightSideLabel = rightWall ? "WALL" : "END";

  // External sizes
  const extWidthMM = useMemo(
    () => iw + 2 * (sft + lip) + L + R,
    [iw, sft, lip, L, R]
  );

  const extProjectionMM = useMemo(
    () => ip + soffit + frameOn,
    [ip, soffit, frameOn]
  );

  // Manufacturing helper
  const manufactureGeom = useMemo(
    () =>
      computeLeanToManufactureGeometry({
        internalProjectionMM: ip,
        pitchDeg,
        soffitDepthMM: soffit,
        frameThicknessMM: sft,
      }),
    [ip, pitchDeg, soffit, sft]
  );

  // Rafter count / centres
  const spacing = num(m.rafter_spacing_mm ?? 665);
  const first = num(m.rafter_first_center_mm ?? 690);
  let centresCount = 0;
  for (let c = first; c <= iw; c += spacing) centresCount++;
  const rafterCount = Math.max(2, centresCount + 2);

  // Item numbering for simple lean-to
  const firstRafterNo = 1;
  const lastRafterNo = rafterCount;
  const ringBeamNo = rafterCount + 1;
  const wallplateNo = rafterCount + 2;

  // Manufacture values
  const wallplateLengthMM = round(extWidthMM);
  const ringBeamLengthMM = round(extWidthMM);

     const internalSlopeMM = manufactureGeom.internalRafterLengthMM;
  const externalSlopeMM = manufactureGeom.totalRafterLengthMM;
  const rawBlankLengthMM = manufactureGeom.totalRafterLengthMM;
  const plumbCutMM = manufactureGeom.plumbCutHeightMM;

  const topAngleDeg = round(pitchDeg, 1);
  const bottomAngleDeg = round(pitchDeg, 1);

  const rafterDepthMM = 220;
  const wallplateFaceCutMM = round(
    rafterDepthMM / Math.cos((topAngleDeg * Math.PI) / 180),
    1
  );
const stockExtraEachEndMM = round(
  rafterDepthMM * Math.tan((topAngleDeg * Math.PI) / 180),
  1
);

const overallBlankLengthMM = round(
  externalSlopeMM + stockExtraEachEndMM * 2,
  1
);
  const seatCutLengthMM = round(
    manufactureGeom.horizontalExtensionMM ?? (soffit + sft)
  );

  const fixingLathLengthMM = ringBeamLengthMM;
  const chamferLathLengthMM = ringBeamLengthMM;
  const fasciaLengthMM = ringBeamLengthMM;
  const soffitLengthMM = ringBeamLengthMM;
  const fasciaOrderSizeMM = manufactureGeom.fasciaOrderSizeMM;
  const finishedFasciaHeightMM = manufactureGeom.finishedFasciaHeightMM;

  const pirSheetLengthMM = 2400;
  const pirSheetWidthMM = 1200;
  const pirAreaPerSheetM2 = (pirSheetLengthMM * pirSheetWidthMM) / 1_000_000;
  const roofAreaM2 = (extWidthMM * extProjectionMM) / 1_000_000;
  const pirSheetCount = Math.max(1, Math.ceil(roofAreaM2 / pirAreaPerSheetM2));

  const gutterLengthMM = ringBeamLengthMM;

  const customer = q.customerName || q.customer || q.customer_name || "";
  const customerRef = q.customerRef || q.customer_ref || q.reference || "";
  const jobNo = q.quoteNumber || q.jobNumber || q.job_no || "";
  const deliveryDate = q.deliveryDate || q.delivery_date || "";
  const deliveryType = q.delivery_install || q.deliveryInstall || "Deliver";
  const roofStyle = "Lean-To";
  const frameColour = q.frame_colour || q.frameColor || "";
  const tileType = q.tileType || q.tile_type || "";
  const tileColour = q.tileColour || q.tile_colour || "";
  const fasciaColour = q.fasciaColour || q.fascia_colour || "";
  const soffitColour = q.soffitColour || q.soffit_colour || "";
  const gutterProfile = q.gutter_profile || "";
  const gutterColour = q.gutter_color || q.gutter_colour || "";
  const downpipeColour = q.downpipe_colour || q.downpipeColor || gutterColour || "";
  const roofVentDetails = q.vent_spec || q.ventSpec || q.roof_vent_details || "N/A";
  const boxGutterDetails = q.box_gutter_details || "N/A";
  const deliveryAddress = q.deliveryAddress || q.site_address || q.address || "";
  const distanceMiles = q.distance_miles || q.distance || "";
  const invoiceDate = q.invoice_date || "";
  const invoiceNo = q.invoice_no || "";
  const notes = q.notes || q.specialInstructions || q.special_instructions || "";
  const roofWeightKg = q.total_weight_kg || q.weight_kg || q.roofWeightKg || "";
  const gutterOutlet = q.gutter_outlet || q.gutterOutlet || q.outlet || "left";

  const roofSizeDisplay = `${round(iw)} × ${round(ip)} mm int / ${round(extWidthMM)} × ${round(extProjectionMM)} mm ext`;

  return (
    <div style={{ fontFamily: "Inter, system-ui, Arial", background: "#f9fafb" }}>
      <div className="mb-nav-hide-on-print">
  <NavTabs />
</div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: 14 }}>
 <section
  className="pm-page"
  style={{
    display: "flex",
    flexDirection: "column",
    height: "279mm",
  }}
>
  <div
    style={{
      ...panel,
      display: "flex",
      flexDirection: "column",
      height: "100%",
    }}
  >
    {/* Title */}
    <div
      style={{
        textAlign: "center",
        fontSize: 28,
        fontWeight: 800,
        color: "#111827",
        marginBottom: 10,
      }}
    >
      Manufacture Book
    </div>

        {/* Main 4 x 4 boxed grid */}
    <div
      style={{
        ...panel,
        marginBottom: 10,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <tbody>
          {/* Row 1 headers */}
          <tr>
            <td style={th}>Job Number</td>
            <td style={th}>Customer Name</td>
            <td style={th}>Customer Reference</td>
            <td style={th}>Delivery Date</td>
          </tr>
          {/* Row 1 values */}
          <tr>
            <td style={td}>{jobNo || "—"}</td>
            <td style={td}>{customer || "—"}</td>
            <td style={td}>{customerRef || "—"}</td>
            <td style={td}>{deliveryDate || "—"}</td>
          </tr>

          {/* Row 2 headers */}
          <tr>
            <td style={th}>Delivery / Install</td>
            <td style={th}>Style</td>
            <td style={th}>Type</td>
            <td style={th}>Frame Thickness</td>
          </tr>
          {/* Row 2 values */}
          <tr>
            <td style={td}>{deliveryType || "—"}</td>
            <td style={td}>{roofStyle || "—"}</td>
            <td style={td}>{frameColour || "—"}</td>
            <td style={td}>{sft ? `${sft} mm` : "—"}</td>
          </tr>

          {/* Row 3 headers */}
          <tr>
            <td style={th}>Roof Pitch</td>
            <td style={th}>Tile Type</td>
            <td style={th}>Tile Colour</td>
            <td style={th}>Fascias / Soffits</td>
          </tr>
          {/* Row 3 values */}
          <tr>
            <td style={td}>{pitchDeg ? `${pitchDeg}°` : "—"}</td>
            <td style={td}>{tileType || "—"}</td>
            <td style={td}>{tileColour || "—"}</td>
            <td style={td}>
              {[fasciaColour, soffitColour].filter(Boolean).join(" / ") || "—"}
            </td>
          </tr>

          {/* Row 4 headers */}
          <tr>
            <td style={th}>Gutters</td>
            <td style={th}>Downpipes</td>
            <td style={th}>Box Gutter Details</td>
            <td style={th}>Glazed Options</td>
          </tr>
          {/* Row 4 values */}
          <tr>
            <td style={td}>{gutterProfile || "—"}</td>
            <td style={td}>{downpipeColour || "—"}</td>
            <td style={td}>{boxGutterDetails || "—"}</td>
            <td style={td}>{q.glazed_options || q.glazedOptions || "—"}</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Delivery address / instructions box */}
    <div
  style={{
    ...panel,
    marginBottom: 0,
    flex: 1,
    display: "flex",
    flexDirection: "column",
  }}
>
      <div style={sectionTitle}>Delivery Address, Special Instructions, Extra's</div>
      <div
  style={{
    flex: 1,
    whiteSpace: "pre-wrap",
    color: "#111827",
    fontSize: 13,
    lineHeight: 1.6,
  }}
>
        {deliveryAddress || "—"}
        {(deliveryAddress || notes) ? "\n\n" : ""}
        {notes || ""}
      </div>
    </div>

    {/* Authorisation boxes */}
    <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 10,
  }}
>
      <div style={{ ...panel, minHeight: 120 }}>
        <div style={sectionTitle}>Authorised for Fabrication</div>
        <div style={{ marginTop: 32, color: "#374151", fontSize: 13 }}>
          Signed ________________________________________
        </div>
        <div style={{ marginTop: 18, color: "#374151", fontSize: 13 }}>
          General / Quality Manager
        </div>
      </div>

      <div style={{ ...panel, minHeight: 120 }}>
        <div style={sectionTitle}>Authorised for Despatch</div>
        <div style={{ marginTop: 32, color: "#374151", fontSize: 13 }}>
          Signed ________________________________________
        </div>
        <div style={{ marginTop: 18, color: "#374151", fontSize: 13 }}>
          General / Quality or Workshop Manager
        </div>
      </div>
    </div>
  </div>
</section>

                {/* ===== PAGE 2: CAD PAGE ===== */}
                {/* ===== PAGE 2: CAD PAGE ===== */}
        <section
          className="pm-page"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "279mm",
          }}
        >
          <div
            style={{
              ...panel,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              padding: 8,
            }}
          >
            {/* Main roof drawing */}
            <div
              style={{
                ...panel,
                flex: "0 0 63%",
                marginBottom: 8,
                position: "relative",
                padding: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  margin: "0 0 6px",
                  color: "#111827",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                Roof Layout
              </div>

              <div
  style={{
    position: "relative",
    height: "calc(100% - 12px)",
    minHeight: 420,
    paddingTop: 0,
  }}
>

                <PlanDiagramLeanToManufacture
  iw={iw}
  ip={ip}
  sft={sft}
  lip={lip}
  soffit={soffit}
  frameOn={frameOn}
  leftOH={L}
  rightOH={R}
  leftWall={leftWall}
  rightWall={rightWall}
  rafterSpacing={spacing}
  firstCentre={first}
  pitchDeg={pitchDeg}
  outlet={gutterOutlet}
/>
              </div>

              <div
                style={{
                  marginTop: 6,
                  paddingTop: 6,
                  borderTop: "1px solid #e5e7eb",
                  fontSize: 12,
                  color: "#111827",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 6,
                }}
              >
                <div><b>External width:</b> {round(extWidthMM)} mm</div>
                <div><b>External projection:</b> {round(extProjectionMM)} mm</div>
                <div><b>Centres:</b> ~{round(spacing)} mm</div>
                <div><b>Rafters:</b> P{firstRafterNo}–P{lastRafterNo}</div>
                <div><b>Ring-beam:</b> P{ringBeamNo}</div>
                <div><b>Wallplate:</b> P{wallplateNo}</div>
              </div>
            </div>

            {/* Rafter detail below */}
            <div
              style={{
                ...panel,
                flex: 1,
                padding: 8,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  margin: "0 0 6px",
                  color: "#111827",
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                Rafter Detail
              </div>

              <RafterDetailDiagram
  externalSlopeMM={externalSlopeMM}
  internalSlopeMM={internalSlopeMM}
  plumbCutMM={plumbCutMM}
  seatCutLengthMM={seatCutLengthMM}
  wallplateFaceCutMM={wallplateFaceCutMM}
  overallBlankLengthMM={overallBlankLengthMM}
  topAngleDeg={topAngleDeg}
  bottomAngleDeg={bottomAngleDeg}
/>

              
            </div>
          </div>
        </section>
        {/* ===== PAGE 3: MANUFACTURE LIST ===== */}
        <section className="pm-page">
          <div style={panel}>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 10, color: "#111827" }}>
              Manufacture List
            </div>

            <div style={{ ...panel, marginBottom: 10 }}>
              <div style={sectionTitle}>Wallplate</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Item No</th>
                    <th style={th}>Item</th>
                    <th style={th}>Qty</th>
                    <th style={th}>Size / Length</th>
                    <th style={th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={td}>P{wallplateNo}</td>
                    <td style={td}>Wallplate</td>
                    <td style={td}>1</td>
                    <td style={td}>{wallplateLengthMM} mm</td>
                    <td style={td}>External width</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ ...panel, marginBottom: 10 }}>
              <div style={sectionTitle}>Rafters</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Item No</th>
                    <th style={th}>Item</th>
                    <th style={th}>Qty</th>
                    <th style={th}>Size / Length</th>
                    <th style={th}>Cut Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={td}>P{firstRafterNo}–P{lastRafterNo}</td>
                    <td style={td}>Rafters</td>
                    <td style={td}>{rafterCount}</td>
                    <td style={td}>{rawBlankLengthMM} mm</td>
                    <td style={td}>
                      External slope: {externalSlopeMM} mm
                      <br />
                      Internal slope: {internalSlopeMM} mm
                      <br />
                      Plumb cut: {plumbCutMM} mm
                      <br />
                      Top angle: {topAngleDeg}°
                      <br />
                      Bottom angle: {bottomAngleDeg}°
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ ...panel, marginBottom: 10 }}>
              <div style={sectionTitle}>Ring-beam</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Item No</th>
                    <th style={th}>Item</th>
                    <th style={th}>Qty</th>
                    <th style={th}>Size / Length</th>
                    <th style={th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={td}>P{ringBeamNo}</td>
                    <td style={td}>Front ring-beam</td>
                    <td style={td}>1</td>
                    <td style={td}>{ringBeamLengthMM} mm</td>
                    <td style={td}>External width</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ ...panel, marginBottom: 10 }}>
              <div style={sectionTitle}>Other Cutting Details</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Item</th>
                    <th style={th}>Qty</th>
                    <th style={th}>Size / Length</th>
                    <th style={th}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={td}>Fixing lath</td>
                    <td style={td}>1</td>
                    <td style={td}>{fixingLathLengthMM} mm</td>
                    <td style={td}>Front run</td>
                  </tr>
                  <tr>
                    <td style={td}>Chamfered lath</td>
                    <td style={td}>1</td>
                    <td style={td}>{chamferLathLengthMM} mm</td>
                    <td style={td}>Front run</td>
                  </tr>
                  <tr>
                    <td style={td}>100 mm PIR sheets</td>
                    <td style={td}>{pirSheetCount}</td>
                    <td style={td}>2400 × 1200 × 100 mm</td>
                    <td style={td}>First-pass sheet count</td>
                  </tr>
                  <tr>
                    <td style={td}>Fascia</td>
                    <td style={td}>1</td>
                    <td style={td}>{fasciaOrderSizeMM} mm × {fasciaLengthMM} mm</td>
                    <td style={td}>Finished fascia height {finishedFasciaHeightMM} mm</td>
                  </tr>
                  <tr>
                    <td style={td}>Soffit</td>
                    <td style={td}>1</td>
                    <td style={td}>{soffit} mm × {soffitLengthMM} mm</td>
                    <td style={td}>User soffit / effective soffit handled in geometry</td>
                  </tr>
                  <tr>
                    <td style={td}>Gutter</td>
                    <td style={td}>1</td>
                    <td style={td}>{gutterLengthMM} mm</td>
                    <td style={td}>
                      {gutterProfile || "—"}
                      {gutterColour ? ` / ${gutterColour}` : ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ ...panel, minHeight: 90 }}>
              <div style={sectionTitle}>Factory Notes</div>
              <div style={{ fontSize: 13, color: "#111827" }}>
                This cut list is now structured for manufacture. Next step is to replace remaining TBC
                rafter values with final foot-cut geometry and add the generated rafter diagram.
              </div>
            </div>
          </div>
        </section>

        {/* ===== PAGE 4: IDIOT LIST PLACEHOLDER ===== */}
        <section className="pm-page">
  <div style={{ ...panel }}>
    <h1 style={{ textAlign: "center", marginBottom: 12 }}>
      Manufacture Checklist
    </h1>

    <div style={{ transform: "scale(0.9)", transformOrigin: "top center" }}>
      <IdiotList showNavTabs={false} />
    </div>
  </div>
</section>
      </div>

      <style>{`
        @media print {
  @page {
    size: A4 portrait;
    margin: 6mm;
  }

  html, body {
    background: #fff !important;
    width: 210mm;
    height: auto;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .mb-nav-hide-on-print {
  display: none !important;
}

  .pm-page {
    width: 194mm;
    min-height: 279mm;
    max-height: 279mm;
    box-sizing: border-box;
    overflow: hidden;
    break-after: page;
    page-break-after: always;
    margin: 0 auto 0 auto !important;
    padding: 0 !important;
    background: #fff !important;
  }

  .pm-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }
}
      `}</style>
    </div>
  );
}