// src/pages/lean-to/LeanToPlanManufacture.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getMaterials } from "../../lib/materials";
import PlanDiagramLeanToManufacture from "../../components/PlanDiagramLeanToManufacture";
import { computeLeanToManufactureGeometry } from "../../lib/leanToManufactureGeometry";
import { calculateHippedLeanToGeometry } from "../../lib/geometry/hippedLeanToGeometry";
import NavTabs from "../../components/NavTabs";
import IdiotList from "./IdiotList";
import { getQuoteById, updateQuote } from "../../lib/quotes";



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

/* function BookFrontRow({ leftLabel, leftValue, rightLabel, rightValue }) {
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
  */
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
  const [activeJob, setActiveJob] = useState(null);
const [jobDetails, setJobDetails] = useState({
  requested_delivery_date: "",
  deliveryType: "Delivery",
  deliveryAddress: "",
  contactName: "",
  contactPhone: "",
  notes: "",
});
useEffect(() => {
  let alive = true;

  async function loadActiveJob() {
    const activeJobId = localStorage.getItem("active_job_id");
    if (!activeJobId) return;

    const job = await getQuoteById(activeJobId);
    if (!alive) return;

    if (job) {
      setActiveJob(job);

      setJobDetails({
        requested_delivery_date: job.requested_delivery_date || "",
        deliveryType: job.delivery_address_json?.deliveryType || "Delivery",
        deliveryAddress: job.delivery_address_json?.deliveryAddress || "",
        contactName: job.delivery_address_json?.contactName || "",
        contactPhone: job.delivery_address_json?.contactPhone || "",
        notes: job.order_notes || "",
      });

     // if (job.inputs_json) {
     //   localStorage.setItem(
       //   "leanToInputs",
      //    JSON.stringify(job.inputs_json)
     //   );
     // }
    }
  }

  loadActiveJob();

  return () => {
    alive = false;
  };
}, []);

const saveJobDetails = async () => {
  if (!activeJob?.id) return;

  const updated = await updateQuote(activeJob.id, {
    requested_delivery_date: jobDetails.requested_delivery_date || null,
    delivery_address_json: {
      deliveryType: jobDetails.deliveryType,
      deliveryAddress: jobDetails.deliveryAddress,
      contactName: jobDetails.contactName,
      contactPhone: jobDetails.contactPhone,
    },
    order_notes: jobDetails.notes,
  });

  if (!updated) {
    alert("Job details were not saved.");
    return;
  }

  setActiveJob(updated);
  alert("Job details saved.");
};

  const jobInputs = activeJob?.inputs_json || {};
  const m = useMemo(() => getMaterials(), []);
  const q = loadInputs();

  // Core quote inputs
  const iw = num(q.internalWidthMM ?? q.widthMM ?? q.width, 0);
  const ip = num(q.internalProjectionMM ?? q.projectionMM ?? q.projMM, 0);
  const pitchDeg = num(q.pitchDeg, 15);
  const hasRoofDimensions = iw > 0 && ip > 0;

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

///const leftSideLabel = leftWall ? "WALL" : "END";
//const rightSideLabel = rightWall ? "WALL" : "END";

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

     const internalSlopeMM = Math.floor(
  manufactureGeom.simpleInternalCutLengthMM
);

const externalSlopeMM = Math.floor(
  manufactureGeom.totalRafterLengthMM
);

const rawBlankLengthMM = Math.floor(
  manufactureGeom.totalRafterLengthMM
);

const plumbCutMM = Math.round(
  manufactureGeom.plumbCutHeightMM
);

  const topAngleDeg = round(pitchDeg, 1);
  const bottomAngleDeg = round(pitchDeg, 1);

  const rafterDepthMM = 220;
  const wallplateFaceCutMM = Math.round(
  rafterDepthMM / Math.cos((topAngleDeg * Math.PI) / 180)
);
const stockExtraEachEndMM = round(
  rafterDepthMM * Math.tan((topAngleDeg * Math.PI) / 180),
  1
);

const overallBlankLengthMM = Math.floor(
  externalSlopeMM + stockExtraEachEndMM * 2
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
const customer =
  q.customerName ||
  q.customer ||
  q.customer_name ||
  q.selectedCustomerName ||
  activeJob?.customer_name ||
  "";

const customerRef =
  q.quoteRef ||
  q.customerReference ||
  q.customer_reference ||
  q.manual_reference ||
  q.customerRef ||
  q.customer_ref ||
  q.reference ||
  activeJob?.manual_reference ||
  "";

const jobNo =
  q.quoteNumber ||
  q.quote_number ||
  q.jobNumber ||
  q.job_number ||
  q.job_no ||
  "";

const roofStyleKey =
  q.roofStyle ||
  jobInputs.roofStyle ||
  "leanTo";

const roofStyleLabel =
  roofStyleKey === "hippedLeanTo"
    ? "Hipped Lean-To"
    : roofStyleKey === "leanTo"
    ? "Lean-To"
    : roofStyleKey === "edwardian"
    ? "Edwardian"
    : roofStyleKey === "victorian"
    ? "Victorian"
    : roofStyleKey;

const frameColour =
  q.frameColour ||
  q.frame_colour ||
  "";

const tileType =
  q.tileSystem ||
  q.tile_system ||
  q.tileType ||
  q.tile_type ||
  "";

const tileColour =
  q.tile_color ||
  q.tileColor ||
  q.tileColour ||
  q.tile_colour ||
  "";

const fasciaColour =
  q.plastics_color ||
  q.plasticsColor ||
  q.plasticsColour ||
  q.plastics_colour ||
  q.fasciaColor ||
  q.fasciaColour ||
  q.fascia_colour ||
  "";

const soffitColour =
  q.plasticsColor ||
  q.plastics_colour ||
  q.soffitColour ||
  q.soffit_colour ||
  "";

const soffitDisplay =
  Number(soffit || 0) > 0 ? `${soffit} mm` : "No Soffit";

const gutterProfile =
  q.gutterProfile ||
  q.gutter_profile ||
  "";

const gutterColour =
  q.gutterColor ||
  q.gutter_color ||
  q.gutter_colour ||
  "";

const capFirst = (v) =>
  v ? String(v).charAt(0).toUpperCase() + String(v).slice(1) : "";

const gutterDisplay =
  [gutterColour, gutterProfile]
    .filter(Boolean)
    .map(capFirst)
    .join(" ");

const downpipeDisplay =
  gutterColour ? `${capFirst(gutterColour)} Round` : "Round";

const downpipeColour =
  q.downpipe_colour ||
  q.downpipeColor ||
  gutterColour ||
  "";

const boxGutterDetails = q.box_gutter_details || "N/A";
const deliveryAddress = q.deliveryAddress || q.site_address || q.address || "";
const notes = q.notes || q.specialInstructions || q.special_instructions || "";
const gutterOutlet = q.gutter_outlet || q.gutterOutlet || q.outlet || "left";
const leftHip =
  typeof q.leftHip === "boolean"
    ? q.leftHip
    : q.hippedSides === "left" || q.hippedSides === "both";

const rightHip =
  typeof q.rightHip === "boolean"
    ? q.rightHip
    : q.hippedSides === "right" || q.hippedSides === "both";

const activeHippedSides =
  leftHip && rightHip
    ? "both"
    : leftHip
    ? "left"
    : rightHip
    ? "right"
    : "none";

const leftHipWidthMM = num(
  q.leftHipWidthMM ?? q.left_hip_width_mm,
  1000
);

const rightHipWidthMM = num(
  q.rightHipWidthMM ?? q.right_hip_width_mm,
  1000
);
const hippedGeom = useMemo(
  () =>
    roofStyleKey === "hippedLeanTo"
      ? calculateHippedLeanToGeometry({
          widthMM: iw,
          projectionMM: ip,
          pitchDeg,
          soffitDepthMM: soffit,
          materials: m,

          hippedSides: activeHippedSides,
          leftHipWidthMM,
          rightHipWidthMM,

          leftWall,
          rightWall,
          leftOverhangMM: L,
          rightOverhangMM: R,
        })
      : null,
  [
    roofStyleKey,
    iw,
    ip,
    pitchDeg,
    soffit,
    m,
    activeHippedSides,
    leftHipWidthMM,
    rightHipWidthMM,
    leftWall,
    rightWall,
    L,
    R,
  ]
);

  //const roofSizeDisplay = `${round(iw)} × ${round(ip)} mm int / ${round(extWidthMM)} × ${round(extProjectionMM)} mm ext`;

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
            <td style={td}>{activeJob?.job_number || jobNo || "—"}</td>
            <td style={td}>{activeJob?.customer_name || customer || "—"}</td>
            <td style={td}>{activeJob?.manual_reference || customerRef || "—"}</td>
            <td style={td}>
  <input
    type="date"
    value={jobDetails.requested_delivery_date}
    onChange={(e) =>
      setJobDetails((p) => ({
        ...p,
        requested_delivery_date: e.target.value,
      }))
    }
    style={{ width: "100%" }}
  />
</td>
          </tr>

          {/* Row 2 headers */}
          <tr>
            <td style={th}>Delivery / Install</td>
<td style={th}>Style</td>
<td style={th}>Roof Pitch</td>
<td style={th}>Frame Thickness</td>
          </tr>
          {/* Row 2 values */}
          <tr>
            <td style={td}>
  <select
    value={jobDetails.deliveryType}
    onChange={(e) =>
      setJobDetails((p) => ({
        ...p,
        deliveryType: e.target.value,
      }))
    }
    style={{ width: "100%" }}
  >
    <option value="Delivery">Delivery</option>
    <option value="Install">Install</option>
    <option value="Collection">Collection</option>
  </select>
</td>
<td style={td}>{roofStyleLabel || "—"}</td>
<td style={td}>{pitchDeg ? `${pitchDeg}°` : "—"}</td>
<td style={td}>{sft ? `${sft} mm` : "—"}</td>
          </tr>

          {/* Row 3 headers */}
          <tr>
            <td style={th}>Tile Type</td>
<td style={th}>Tile Colour</td>
<td style={th}>Fascia</td>
<td style={th}>Soffit</td>
          </tr>
          {/* Row 3 values */}
          <tr>
            <td style={td}>
  {(tileType || "—").toString().replace(/^./, (c) => c.toUpperCase())}
</td>

<td style={td}>{tileColour || "—"}</td>

<td style={td}>{fasciaColour || "—"}</td>

<td style={td}>{soffitDisplay}</td>
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
            <td style={td}>{gutterDisplay || "—"}</td>
            <td style={td}>{downpipeDisplay || "—"}</td>
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
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 10,
  }}
>
  <div
    style={{
      flex: 2,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        marginBottom: 6,
        color: "#374151",
      }}
    >
      Delivery Address
    </div>

    <textarea
      value={jobDetails.deliveryAddress}
      onChange={(e) =>
        setJobDetails((p) => ({
          ...p,
          deliveryAddress: e.target.value,
        }))
      }
      style={{
        flex: 1,
        width: "100%",
        minHeight: 140,
        padding: 8,
        resize: "none",
        border: "1px solid #cbd5e1",
        borderRadius: 6,
      }}
    />
  </div>

  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        marginBottom: 6,
        color: "#374151",
      }}
    >
      Special Instructions
    </div>

    <textarea
      value={jobDetails.notes}
      onChange={(e) =>
        setJobDetails((p) => ({
          ...p,
          notes: e.target.value,
        }))
      }
      style={{
        flex: 1,
        width: "100%",
        minHeight: 70,
        padding: 8,
        resize: "none",
        border: "1px solid #cbd5e1",
        borderRadius: 6,
      }}
    />
  </div>

  <div
    className="mb-nav-hide-on-print"
    style={{
      display: "flex",
      justifyContent: "flex-end",
      marginTop: 4,
    }}
  >
    <button
      onClick={saveJobDetails}
      style={{
        padding: "8px 14px",
        background: "#2563eb",
        color: "white",
        border: 0,
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      Save Job Details
    </button>
  </div>
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

                {roofStyleKey === "leanTo" && (
  <>
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

                {hasRoofDimensions ? (
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
) : (
  <div style={{ color: "#6b7280", fontSize: 16, fontWeight: 600 }}>
    No roof dimensions loaded
  </div>
)}
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
                overflow: "auto",
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

              {hasRoofDimensions ? (
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
) : (
  <div style={{ color: "#6b7280", fontSize: 14 }}>
    Rafter detail will appear once roof dimensions are loaded.
  </div>
)}
<div
  style={{
    marginTop: 12,
    padding: 12,
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fafafa",
    fontSize: 13,
  }}
>
  <h3 style={{ margin: "0 0 8px 0" }}>Simple Trig Check</h3>

  <div>
  <b>Input Projection</b>:{" "}
  {Math.round(manufactureGeom.internalProjectionMM)} mm
</div>

<div>
  <b>Wallplate Thickness</b>:{" "}
  {Math.round(manufactureGeom.wallplateThicknessMM)} mm
</div>

<div>
  <b>Internal Horizontal Run</b>:{" "}
  {Math.round(manufactureGeom.internalHorizontalRunMM)} mm
</div>

<div>
  <b>External Horizontal Run</b>:{" "}
  {Math.round(manufactureGeom.externalHorizontalRunMM)} mm
</div>

<div>
  <b>Full Horizontal Run</b>:{" "}
  {Math.round(manufactureGeom.fullHorizontalRunMM)} mm
</div>

<div>
  <b>Calculated Internal Cut</b>:{" "}
  {Math.round(manufactureGeom.calculatedInternalCutLengthMM)} mm
</div>

<div>
  <b>Calculated External Extension</b>:{" "}
  {Math.round(
    manufactureGeom.calculatedExternalExtensionLengthMM
  )}{" "}
  mm
</div>

<div>
  <b>Calculated External Cut</b>:{" "}
  {Math.round(manufactureGeom.calculatedExternalCutLengthMM)} mm
</div>

<div>
  <b>Expected Top/Bottom Edge Difference</b>:{" "}
  {Math.round(
    manufactureGeom.rafterEdgeLengthDifferenceMM
  )}{" "}
  mm
</div>

  <div><b>Pure Rise</b>: {Math.round(manufactureGeom.pureRiseMM)} mm</div>
  <div><b>Internal Wall-Plate Height</b>: {Math.round(manufactureGeom.internalWallPlateHeightMM)} mm</div>
  <div><b>Simple Internal Cut Run</b>: {Math.round(manufactureGeom.simpleInternalCutRunMM)} mm</div>
  <div><b>Simple Internal Cut Length</b>: {Math.round(manufactureGeom.simpleInternalCutLengthMM)} mm</div>
  <div><b>Simple External Extension</b>: {Math.round(manufactureGeom.simpleExternalExtensionLengthMM)} mm</div>
  <div><b>Simple Total Cut Length</b>: {Math.round(manufactureGeom.simpleTotalCutLengthMM)} mm</div>
  <div>
  <b>Simple Overall Blank Length</b>:{" "}
  {Math.round(
    manufactureGeom.simpleInternalCutLengthMM +
      (220 * Math.tan((pitchDeg * Math.PI) / 180) * 2)
  )} mm
</div>
  <div><b>External Finished Height</b>: {Math.round(manufactureGeom.externalFinishedHeightMM)} mm</div>
</div>
              
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
  </>
)}

{roofStyleKey === "hippedLeanTo" && (
  <section className="pm-page">
    <div style={panel}>

      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 10,
          color: "#111827",
        }}
      >
        Hipped Lean-To Manufacture
      </div>

      <div style={{ ...panel, marginBottom: 12 }}>
  <div style={sectionTitle}>Fascia & Soffit Manufacture</div>

  <table style={{ width: "100%", borderCollapse: "collapse" }}>
    <thead>
      <tr>
        <th style={th}>Facet</th>
        <th style={th}>Plumb Cut</th>
        <th style={th}>Finished Fascia</th>
        <th style={th}>Fascia Size</th>
        <th style={th}>Manufactured Soffit</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td style={td}>
          <b>Front</b>
        </td>

        <td style={td}>
          {Math.round(hippedGeom?.frontPlumbCutHeightMM ?? 0)} mm
        </td>

        <td style={td}>
          {Math.round(
            hippedGeom?.frontFinishedFasciaHeightMM ?? 0
          )} mm
        </td>

        <td style={td}>
          {Math.round(
            hippedGeom?.frontFasciaOrderSizeMM ??
              hippedGeom?.commonFasciaOrderSizeMM ??
              0
          )} mm
        </td>

        <td style={td}>
          {Math.round(
            hippedGeom?.effectiveFrontSoffitMM ??
              hippedGeom?.frontSoffitMM ??
              0
          )} mm
        </td>
      </tr>

      {hippedGeom?.leftSideRingBeam?.exists && (
        <tr>
          <td style={td}>
            <b>Left Side</b>
          </td>

          <td style={td}>
            {Math.round(
              hippedGeom?.leftPlumbCutHeightMM ?? 0
            )} mm
          </td>

          <td style={td}>
            {Math.round(
              hippedGeom?.leftFinishedFasciaHeightMM ?? 0
            )} mm
          </td>

          <td style={td}>
            {Math.round(
              hippedGeom?.leftFasciaOrderSizeMM ??
                hippedGeom?.commonFasciaOrderSizeMM ??
                0
            )} mm
          </td>

          <td style={td}>
            {Math.round(
              hippedGeom?.facetEavesLeftManufacturedSoffitMM ??
                hippedGeom?.leftRoundedManufacturedSoffitMM ??
                0
            )} mm
          </td>
        </tr>
      )}

      {hippedGeom?.rightSideRingBeam?.exists && (
        <tr>
          <td style={td}>
            <b>Right Side</b>
          </td>

          <td style={td}>
            {Math.round(
              hippedGeom?.rightPlumbCutHeightMM ?? 0
            )} mm
          </td>

          <td style={td}>
            {Math.round(
              hippedGeom?.rightFinishedFasciaHeightMM ?? 0
            )} mm
          </td>

          <td style={td}>
            {Math.round(
              hippedGeom?.rightFasciaOrderSizeMM ??
                hippedGeom?.commonFasciaOrderSizeMM ??
                0
            )} mm
          </td>

          <td style={td}>
            {Math.round(
              hippedGeom?.facetEavesRightManufacturedSoffitMM ??
                hippedGeom?.rightRoundedManufacturedSoffitMM ??
                0
            )} mm
          </td>
        </tr>
      )}
    </tbody>
  </table>

  <div
    style={{
      marginTop: 10,
      fontSize: 13,
      color: "#374151",
    }}
  >
    One common fascia size for all active roof facets:{" "}
    <b>
      {Math.round(hippedGeom?.commonFasciaOrderSizeMM ?? 0)} mm
    </b>
  </div>
      </div>

      <div style={{ ...panel, marginBottom: 12 }}>
        <div style={sectionTitle}>Roof Geometry & Components</div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={th}>Front Pitch</td>
              <td style={td}>
                {Number(pitchDeg || 0).toFixed(1)}°
              </td>

              <td style={th}>Active Facets</td>
              <td style={td}>
                {hippedGeom?.facets?.length ?? 0}
              </td>
            </tr>

            <tr>
              <td style={th}>Bosses</td>
              <td style={td}>
                {hippedGeom?.bossQty ?? 0}
              </td>

              <td style={th}>Spar Hooks</td>
              <td style={td}>
                {hippedGeom?.sparHookQty ?? 0}
              </td>
            </tr>

            <tr>
              <td style={th}>Plain Rafters</td>
              <td style={td}>
                {hippedGeom?.plainRafterCount ?? 0}
              </td>

              <td style={th}>Hip Top Cut</td>
              <td style={td}>
                {Number(hippedGeom?.hipTopCutDeg ?? 0).toFixed(1)}°
              </td>
            </tr>

            {hippedGeom?.leftSideRingBeam?.exists && (
              <tr>
                <td style={th}>Left Jack Rafters</td>
                <td style={td}>
                  {hippedGeom?.leftJackRafterCount ?? 0}
                </td>

                <td style={th}>Left Boss Position</td>
                <td style={td}>
                  {Math.round(hippedGeom?.leftBossXMM ?? 0)} mm
                </td>
              </tr>
            )}

            {hippedGeom?.rightSideRingBeam?.exists && (
              <tr>
                <td style={th}>Right Jack Rafters</td>
                <td style={td}>
                  {hippedGeom?.rightJackRafterCount ?? 0}
                </td>

                <td style={th}>Right Boss Position</td>
                <td style={td}>
                  {Math.round(hippedGeom?.rightBossXMM ?? 0)} mm
                </td>
              </tr>
            )}

            <tr>
              <td style={th}>Plain Rafter Zone</td>
              <td style={td}>
                {Math.round(hippedGeom?.plainRafterZoneStartMM ?? 0)} mm
                {" → "}
                {Math.round(hippedGeom?.plainRafterZoneEndMM ?? 0)} mm
              </td>

              <td style={th}>Zone Width</td>
              <td style={td}>
                {Math.round(hippedGeom?.plainRafterZoneWidthMM ?? 0)} mm
              </td>
            </tr>

            {hippedGeom?.leftSideRingBeam?.exists &&
              hippedGeom?.rightSideRingBeam?.exists && (
                <tr>
                  <td style={th}>Between Bosses</td>
                  <td style={td}>
                    {Math.round(hippedGeom?.centreWidthMM ?? 0)} mm
                  </td>

                  <td style={th}>Boss/Spar Hook Offset</td>
                  <td style={td}>
                    {Math.round(
                      hippedGeom?.sparHookToBossOffsetMM ?? 0
                    )} mm
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

    </div>
  </section>
)}
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