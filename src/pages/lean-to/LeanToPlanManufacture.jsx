import { buildLeanToBookRingBeam } from '../../lib/Manufacturing/leanToBookSchedule';
import LeanToPlasticsGuide from '../../components/LeanToPlasticsGuide';
import ManufacturingLeanToWallplate from '../../components/ManufacturingLeanToWallplate';
import ManufacturingRoofMemberPages from '../../components/ManufacturingRoofMemberPages';
import ManufacturingWallplatePly from '../../components/ManufacturingWallplatePly';
import ManufacturePlanPage from '../../components/ManufacturePlanPage';
import ManufactureBookFront from '../../components/ManufactureBookFront';
import {getCustomers} from '../../lib/customers';
import {readActiveDesignRecord,rememberActiveDesignRecord,draftDesignIdentity} from '../../lib/activeDesignRecord';
import ManufacturingCentralTrussDrawing from '../../components/ManufacturingCentralTrussDrawing';
// src/pages/lean-to/LeanToPlanManufacture.jsx
import PlasticsCuttingGuide from "../../components/PlasticsCuttingGuide";
import React, { useEffect, useMemo, useState } from "react";
import { getMaterials } from "../../lib/materials";
import PlanDiagramLeanToManufacture from "../../components/PlanDiagramLeanToManufacture";
import { computeLeanToManufactureGeometry } from "../../lib/leanToManufactureGeometry";
import { calculateHippedLeanToGeometry } from "../../lib/geometry/hippedLeanToGeometry";
import NavTabs from "../../components/NavTabs";
import IdiotList from "./IdiotList";
import { getQuoteById, updateQuote } from "../../lib/quotes";
import ManufacturingFacetDrawing from "../../components/ManufacturingFacetDrawing";
import { buildRoofPlan } from "../../lib/Manufacturing/roofPlanBuilder";
import RoofPlanDiagram from "../../components/RoofPlanDiagram";
import { buildSummaryMaterialsModel } from "../../lib/Calculations/summaryMaterialsModel";
import { readSummaryPricingState } from "../../lib/Calculations/summaryPricingState";
import {
  buildManufacturingSequence,
  buildHippedLeanToManufacturingMembers,
  buildHippedLeanToManufacturingSequence,
} from "../../lib/Manufacturing/manufacturingSequenceBuilder";
import ManufacturingWallplateMemberDrawing from "../../components/ManufacturingWallplateMemberDrawing";
import ManufacturingRingBeamDrawing from "../../components/ManufacturingRingBeamDrawing";
import { buildJackRafterManufactureAudit } from "../../lib/Calculations/jackRafterManufactureAudit";
import { groupProvisionalRoofMembers } from "../../lib/Manufacturing/groupProvisionalRoofMembers";
import { buildFrontRafterManufactureProfiles } from "../../lib/Manufacturing/frontRafterManufactureProfiles";
import { buildHippedLeanToRingBeamSchedule } from "../../lib/Manufacturing/ringBeamManufactureSchedule";
import {
  resolveEdgeSupport,
  resolveTwoSidedExternalWidth,
} from "../../lib/geometry/supportGeometry";
import LeanToSideElevationManufacture
  from "../../components/LeanToSideElevationManufacture";


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

const SHOW_LEGACY_HIPPED_WALLPLATE_VISUALISER = false;



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
export default function LeanToPlanManufacture() {
  const [activeJob, setActiveJob] = useState(null);
  const [currentCustomerName,setCurrentCustomerName]=useState("");
const [jobDetails, setJobDetails] = useState(()=>{
 let saved={};try{const draft=JSON.parse(localStorage.getItem("leanBookDetails")||"{}");if(!readActiveDesignRecord("lean-to")&&draft.draftId===draftDesignIdentity())saved=draft.details||{};}catch{/* Ignore an old or invalid draft. */}
 return {
  jobNumber: "",
  requested_delivery_date: "",
  deliveryType: "Delivery",
  deliveryAddress: "",
  contactName: "",
  contactPhone: "",
  notes: "",
  ...saved,
};});
useEffect(() => {
  let alive = true;

  async function loadActiveJob() {
    const current=readActiveDesignRecord('lean-to');
    const activeJobId = current?.id;
    if (!activeJobId) return;

    const job = await getQuoteById(activeJobId);
    if (!alive) return;

    if (job) {
      setActiveJob(job);

      setJobDetails({
  jobNumber: job.job_number || "",
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
  if (!activeJob?.id) {localStorage.setItem("leanBookDetails",JSON.stringify({draftId:draftDesignIdentity(),details:jobDetails}));alert("Draft book details saved on this device.");return;}

  const updated = await updateQuote(activeJob.id, {
  job_number:
    String(jobDetails.jobNumber || "").trim() || null,

  requested_delivery_date:
    jobDetails.requested_delivery_date || null,

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
  if(updated)rememberActiveDesignRecord({...readActiveDesignRecord('lean-to'),...updated});
  alert("Job details saved.");
};

  const jobInputs = activeJob?.inputs_json || {};
  const m = useMemo(() => getMaterials(), []);
  const q = loadInputs();
  useEffect(()=>{let alive=true;getCustomers().then(rows=>{if(alive)setCurrentCustomerName((rows||[]).find(c=>c.id===q.selectedCustomerId)?.name||(q.selectedCustomerId==='retail'?'Retail':''));}).catch(()=>{});return()=>{alive=false;};},[q.selectedCustomerId]);

  const planSummary = useMemo(() => {
    const controls = q.summaryPricingState ?? readSummaryPricingState();
    return buildSummaryMaterialsModel({ inputs: q, materials: m,
      exclusions: controls.exclusions ?? {}, adjustments: controls.adjustments ?? {},
      addedItems: q.summaryAddedItems ?? [] });
  }, [q, m]);

  // Core quote inputs
  const iw = num(q.internalWidthMM ?? q.widthMM ?? q.width, 0);
  const ip = num(q.internalProjectionMM ?? q.projectionMM ?? q.projMM, 0);
  const pitchDeg = num(q.pitchDeg, 15);
  const hasRoofDimensions = iw > 0 && ip > 0;

  const sft = num(q.side_frame_thickness_mm ?? m.side_frame_thickness_mm ?? 70);

const leftSupportDepthMM = num(
  q.leftSupportDepthMM,
  sft
);

const rightSupportDepthMM = num(
  q.rightSupportDepthMM,
  sft
);

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
  const extWidthMM = useMemo(() => {
  const leftSupport =
  resolveEdgeSupport({
    type: leftWall ? "wall" : "frame",
    depthMM: leftSupportDepthMM,
    defaultDepthMM: sft,
  });

  const rightSupport =
  resolveEdgeSupport({
    type: rightWall ? "wall" : "frame",
    depthMM: rightSupportDepthMM,
    defaultDepthMM: sft,
  });

  const resolved =
    resolveTwoSidedExternalWidth({
      internalWidthMM: iw,

      leftSupport,
      rightSupport,

      leftOverhangMM: L,
      rightOverhangMM: R,

      fasciaLipMM: lip,
    });

  return resolved.externalWidthMM;
}, [
  iw,
  sft,
  lip,
  L,
  R,
  leftWall,
  rightWall,
  leftSupportDepthMM,
  rightSupportDepthMM,
]);

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
const customer =
  currentCustomerName ||
  q.customerName ||
  q.customer ||
  q.customer_name ||
  q.selectedCustomerName ||
  (activeJob?.inputs_json?.selectedCustomerId===q.selectedCustomerId?activeJob?.customer_name:'') ||
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

const roofStyleKey =
  q.roofStyle ||
  jobInputs.roofStyle ||
  "leanTo";

const roofStyleLabel =
  roofStyleKey === "hippedLeanTo"
    ? (q.bossArrangement === "central" ? "Hipped Lean-To — central boss" : "Hipped Lean-To")
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

const requestedLeftSidePitchDeg =
  q.requestedLeftSidePitchDeg ??
  jobInputs.requestedLeftSidePitchDeg ??
  null;

const requestedRightSidePitchDeg =
  q.requestedRightSidePitchDeg ??
  jobInputs.requestedRightSidePitchDeg ??
  null;

const sideSoffitMode =
  q.sideSoffitMode ??
  jobInputs.sideSoffitMode ??
  "automatic";

const sideSoffitControlSide =
  q.sideSoffitControlSide ??
  jobInputs.sideSoffitControlSide ??
  "left";

const specifiedSideSoffitMM =
  q.specifiedSideSoffitMM ??
  jobInputs.specifiedSideSoffitMM ??
  null;

const isCentralBoss = roofStyleKey === "hippedLeanTo" && q.bossArrangement === "central";
const hippedGeom = useMemo(
  () =>
    roofStyleKey === "hippedLeanTo"
      ? calculateHippedLeanToGeometry({
          bossArrangement: q.bossArrangement ?? "offset",
          widthMM: iw,
          projectionMM: ip,
          pitchDeg,
          soffitDepthMM: soffit,
          materials: m,

          hippedSides: activeHippedSides,
          leftHipWidthMM,
          rightHipWidthMM,


          requestedLeftSidePitchDeg:
            requestedLeftSidePitchDeg == null ||
            requestedLeftSidePitchDeg === ""
              ? null
              : Number(requestedLeftSidePitchDeg),

          requestedRightSidePitchDeg:
            requestedRightSidePitchDeg == null ||
            requestedRightSidePitchDeg === ""
              ? null
              : Number(requestedRightSidePitchDeg),

          sideSoffitMode,
          sideSoffitControlSide,
          specifiedSideSoffitMM:
            specifiedSideSoffitMM == null ||
            specifiedSideSoffitMM === ""
              ? null
              : Number(specifiedSideSoffitMM),

          leftWall,
          rightWall,
          leftOverhangMM: L,
          rightOverhangMM: R,
        })
      : null,
  [
    roofStyleKey,
    q.bossArrangement,
    iw,
    ip,
    pitchDeg,
    soffit,
    m,
    activeHippedSides,
leftHipWidthMM,
rightHipWidthMM,
requestedLeftSidePitchDeg,
requestedRightSidePitchDeg,
sideSoffitMode,
sideSoffitControlSide,
specifiedSideSoffitMM,
leftWall,
rightWall,
    L,
    R,
  ]
);
const resolvedLeftBossMM =
  hippedGeom?.resolvedLeftBossXMM ?? 0;

const resolvedRightBossMM =
  hippedGeom?.resolvedRightBossXMM ?? iw;

const resolvedBetweenBossesMM =
  Math.max(
    0,
    resolvedRightBossMM - resolvedLeftBossMM
  );

  const roofPlan = useMemo(() => {
  if (
    roofStyleKey !== "hippedLeanTo" ||
    !hippedGeom ||
    iw <= 0 ||
    ip <= 0
  ) {
    return null;
  }

  /*
   * IMPORTANT:
   *
   * Nothing in this block calculates roof geometry.
   *
   * It only translates geometry already resolved by
   * calculateHippedLeanToGeometry() into the generic
   * roof-plan format.
   */

  const structuralLines = [];

  // --------------------------------------------------
  // HIPS
  // --------------------------------------------------

  if (leftHip) {
    structuralLines.push({
      id: "left-hip",
      type: "hip",
      role: "hip",

      start: {
        xMM: 0,
        yMM: ip,
      },

      end: {
        xMM: resolvedLeftBossMM,
        yMM: 0,
      },

      metadata: {
        side: "left",
      },
    });
  }

  if (rightHip) {
    structuralLines.push({
      id: "right-hip",
      type: "hip",
      role: "hip",

      start: {
        xMM: iw,
        yMM: ip,
      },

      end: {
        xMM: resolvedRightBossMM,
        yMM: 0,
      },

      metadata: {
        side: "right",
      },
    });
  }

  // --------------------------------------------------
  // FRONT RAFTERS
  // --------------------------------------------------

  const frontRafters =
    hippedGeom?.frontRafterLayoutV2?.allRafters ??
    [];

  frontRafters.forEach((rafter) => {
  const xMM = Number(rafter?.centreMM);

  if (!Number.isFinite(xMM)) return;

  let backYMM = 0;

  /*
   * Front jack rafters terminate at the hip.
   *
   * The intersection point is resolved here in the
   * roof-plan model, NOT in the generic SVG renderer.
   */
  if (
    rafter.zone === "left-jack" &&
    resolvedLeftBossMM > 0
  ) {
    backYMM =
      ip -
      (ip * xMM) / resolvedLeftBossMM;
  }

  if (
    rafter.zone === "right-jack" &&
    iw > resolvedRightBossMM
  ) {
    backYMM =
      ip *
      ((xMM - resolvedRightBossMM) /
        (iw - resolvedRightBossMM));
  }

  structuralLines.push({
    id:
      rafter.id ||
      `front-rafter-${Math.round(xMM)}`,

    type:
      rafter.role === "boss-rafter"
        ? "boss-rafter"
        : rafter.role === "jack"
        ? "jack-rafter"
        : "rafter",

    role: rafter.role || "plain",

    facetId: "front",

    start: {
      xMM,
      yMM: Math.max(0, backYMM),
    },

    end: {
      xMM,
      yMM: ip,
    },

    positionMM: xMM,

    metadata: {
      zone: rafter.zone || null,
    },
  });
});

const frontRafterPositions =
  frontRafters
    .map((rafter) => Number(rafter?.centreMM))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

const frontRafterSpacingAnnotations = [];

for (
  let index = 1;
  index < frontRafterPositions.length;
  index++
) {
  const previousMM =
    frontRafterPositions[index - 1];

  const currentMM =
    frontRafterPositions[index];

  frontRafterSpacingAnnotations.push({
    id: `front-spacing-${index}`,

    type: "spacing",

    start: {
      xMM: previousMM,
      yMM: ip,
    },

    end: {
      xMM: currentMM,
      yMM: ip,
    },

    valueMM:
      currentMM - previousMM,

    label: "",

    datum: "rafter-spacing",

    metadata: {
      placement: "inside",
      axis: "horizontal",
    },
  });
}

// --------------------------------------------------
// SIDE-FACET JACK RAFTERS
// --------------------------------------------------

const leftSideJacks =
  hippedGeom?.leftSideRingBeamLayout
    ?.intermediateJackRafters ?? [];

leftSideJacks.forEach((jack, index) => {
  const yMM = Number(jack?.centreMM);

  if (!Number.isFinite(yMM) || ip <= 0) {
    return;
  }

  const hipXMM =
    resolvedLeftBossMM *
    (1 - yMM / ip);

  structuralLines.push({
    id:
      `left-side-jack-${Math.round(yMM)}-${index}`,

    type: "side-jack-rafter",
    role: "jack",
    facetId: "left",

    start: {
      xMM: 0,
      yMM,
    },

    end: {
      xMM: Math.max(0, hipXMM),
      yMM,
    },

    positionMM: yMM,

    metadata: {
      side: "left",
      axis: "projection",
    },
  });
});

const rightSideJacks =
  hippedGeom?.rightSideRingBeamLayout
    ?.intermediateJackRafters ?? [];

rightSideJacks.forEach((jack, index) => {
  const yMM = Number(jack?.centreMM);

  if (!Number.isFinite(yMM) || ip <= 0) {
    return;
  }

  const hipXMM =
    resolvedRightBossMM +
    (iw - resolvedRightBossMM) *
      (yMM / ip);

  structuralLines.push({
    id:
      `right-side-jack-${Math.round(yMM)}-${index}`,

    type: "side-jack-rafter",
    role: "jack",
    facetId: "right",

    start: {
      xMM: hipXMM,
      yMM,
    },

    end: {
      xMM: iw,
      yMM,
    },

    positionMM: yMM,

    metadata: {
      side: "right",
      axis: "projection",
    },
  });
});
// --------------------------------------------------
// SIDE JACK RAFTER SPACING ANNOTATIONS
// --------------------------------------------------

const sideJackSpacingAnnotations = [];

const leftSideJackPositions =
  leftSideJacks
    .map((jack) => Number(jack?.centreMM))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

for (
  let index = 1;
  index < leftSideJackPositions.length;
  index++
) {
  const previousMM =
    leftSideJackPositions[index - 1];

  const currentMM =
    leftSideJackPositions[index];

  sideJackSpacingAnnotations.push({
    id: `left-side-spacing-${index}`,
    type: "spacing",

    start: {
      xMM: 0,
      yMM: previousMM,
    },

    end: {
      xMM: 0,
      yMM: currentMM,
    },

    valueMM:
      currentMM - previousMM,

    datum: "rafter-spacing",

    metadata: {
      placement: "outside-left",
      axis: "vertical",
      side: "left",
    },
  });
}

const rightSideJackPositions =
  rightSideJacks
    .map((jack) => Number(jack?.centreMM))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

for (
  let index = 1;
  index < rightSideJackPositions.length;
  index++
) {
  const previousMM =
    rightSideJackPositions[index - 1];

  const currentMM =
    rightSideJackPositions[index];

  sideJackSpacingAnnotations.push({
    id: `right-side-spacing-${index}`,
    type: "spacing",

    start: {
      xMM: iw,
      yMM: previousMM,
    },

    end: {
      xMM: iw,
      yMM: currentMM,
    },

    valueMM:
      currentMM - previousMM,

    datum: "rafter-spacing",

    metadata: {
      placement: "outside-right",
      axis: "vertical",
      side: "right",
    },
  });
}

const manufacturingMembers =
  buildHippedLeanToManufacturingMembers(hippedGeom);
// --------------------------------------------------
// INSULATION SLAB / ROOF-SPACE SEQUENCE
//
// S-series follows the roof around in the same general
// manufacturing direction as the R-series.
//
// These are identification regions only at this stage.
// Actual insulation cutting geometry can be added later.
// --------------------------------------------------

const manufacturingSlabs = [];

if (leftHip) {
  const leftPositions = [
    0,
    ...leftSideJackPositions,
    ip,
  ];

  for (
    let index = 0;
    index < leftPositions.length - 1;
    index++
  ) {
    const startYMM = leftPositions[index];
    const endYMM = leftPositions[index + 1];
    const midYMM =
      (startYMM + endYMM) / 2;

    const hipXMM =
      resolvedLeftBossMM *
      (1 - midYMM / ip);

    manufacturingSlabs.push({
      id: `left-slab-${index + 1}`,
      facetId: "left",

      position: {
        xMM: hipXMM * 0.45,
        yMM: midYMM,
      },

      metadata: {
        side: "left",
      },
    });
  }
}

// --------------------------------------------------
// FRONT FACET SLABS
//
// The front facet extends across the COMPLETE front
// width, including the triangular jack-rafter zones
// beneath the left and right hips.
// --------------------------------------------------

const frontStructuralPositions = [
  0,

  ...frontRafters
    .map((rafter) => Number(rafter?.centreMM))
    .filter((value) => Number.isFinite(value)),

  iw,
]
  .sort((a, b) => a - b)
  .filter(
    (value, index, array) =>
      index === 0 ||
      Math.abs(value - array[index - 1]) > 0.5
  );

for (
  let index = 0;
  index < frontStructuralPositions.length - 1;
  index++
) {
  const leftXMM =
    frontStructuralPositions[index];

  const rightXMM =
    frontStructuralPositions[index + 1];

  const midXMM =
    (leftXMM + rightXMM) / 2;

  /*
   * Find the back/top boundary of the front facet
   * at this X position.
   *
   * Left jack zone  -> bounded by left hip
   * Centre zone     -> bounded by wallplate
   * Right jack zone -> bounded by right hip
   */
  let facetBackYMM = 0;

  if (
    leftHip &&
    midXMM < resolvedLeftBossMM &&
    resolvedLeftBossMM > 0
  ) {
    facetBackYMM =
      ip -
      (ip * midXMM) /
        resolvedLeftBossMM;
  } else if (
    rightHip &&
    midXMM > resolvedRightBossMM &&
    iw > resolvedRightBossMM
  ) {
    facetBackYMM =
      ip *
      (
        (midXMM - resolvedRightBossMM) /
        (iw - resolvedRightBossMM)
      );
  }

  /*
   * Put the S reference roughly halfway inside the
   * actual slab region rather than on the hip.
   */
  const slabLabelYMM =
    facetBackYMM +
    (ip - facetBackYMM) * 0.5;

  manufacturingSlabs.push({
    id: `front-slab-${index + 1}`,
    facetId: "front",

    position: {
      xMM: midXMM,
      yMM: slabLabelYMM,
    },

    metadata: {
      side: "front",
    },
  });
}

if (rightHip) {
  /*
   * Reverse the traversal so the S-series continues
   * around the roof rather than restarting from the back.
   */
  const rightPositions = [
    ip,
    ...[...rightSideJackPositions].reverse(),
    0,
  ];

  for (
    let index = 0;
    index < rightPositions.length - 1;
    index++
  ) {
    const startYMM = rightPositions[index];
    const endYMM = rightPositions[index + 1];
    const midYMM =
      (startYMM + endYMM) / 2;

    const hipXMM =
      resolvedRightBossMM +
      (iw - resolvedRightBossMM) *
        (midYMM / ip);

    manufacturingSlabs.push({
      id: `right-slab-${index + 1}`,
      facetId: "right",

      position: {
        xMM:
          hipXMM +
          (iw - hipXMM) * 0.55,

        yMM: midYMM,
      },

      metadata: {
        side: "right",
      },
    });
  }
}

const manufacturingSequence =
  buildManufacturingSequence({
    members: manufacturingMembers,
    slabs: manufacturingSlabs,
  });
// --------------------------------------------------
// WALLPLATE / RING-BEAM REFERENCE LINES
//
// These lines exist so the generic renderer can attach
// the continuous R-series references to the appropriate
// roof members.
//
// They do not calculate geometry.
// --------------------------------------------------

// Left wallbar
if (leftHip) {
  structuralLines.push({
    id: "left-wallbar",
    type: "wallbar",
    role: "wallbar",

    start: {
      xMM: 0,
      yMM: 0,
    },

    end: {
      xMM: resolvedLeftBossMM,
      yMM: 0,
    },

    metadata: {
      referenceOnly: true,
      side: "left",
    },
  });
}

// Horizontal wallplate
if (!isCentralBoss) structuralLines.push({
  id: "horizontal-wallplate",
  type: "wallplate",
  role: "wallplate",

  start: {
    xMM: resolvedLeftBossMM,
    yMM: 0,
  },

  end: {
    xMM: resolvedRightBossMM,
    yMM: 0,
  },

  metadata: {
    referenceOnly: true,
    side: "back",
  },
});

// Right wallbar
if (rightHip) {
  structuralLines.push({
    id: "right-wallbar",
    type: "wallbar",
    role: "wallbar",

    start: {
      xMM: resolvedRightBossMM,
      yMM: 0,
    },

    end: {
      xMM: iw,
      yMM: 0,
    },

    metadata: {
      referenceOnly: true,
      side: "right",
    },
  });
}

// Left ring-beam
if (hippedGeom?.leftSideRingBeam?.exists) {
  structuralLines.push({
    id: "left-ring-beam",
    type: "ring-beam",
    role: "ring-beam",

    start: {
      xMM: 0,
      yMM: 0,
    },

    end: {
      xMM: 0,
      yMM: ip,
    },

    metadata: {
      referenceOnly: true,
      side: "left",
    },
  });
}

// Front ring-beam
structuralLines.push({
  id: "front-ring-beam",
  type: "ring-beam",
  role: "ring-beam",

  start: {
    xMM: 0,
    yMM: ip,
  },

  end: {
    xMM: iw,
    yMM: ip,
  },

  metadata: {
    referenceOnly: true,
    side: "front",
  },
});

// Right ring-beam
if (hippedGeom?.rightSideRingBeam?.exists) {
  structuralLines.push({
    id: "right-ring-beam",
    type: "ring-beam",
    role: "ring-beam",

    start: {
      xMM: iw,
      yMM: ip,
    },

    end: {
      xMM: iw,
      yMM: 0,
    },

    metadata: {
      referenceOnly: true,
      side: "right",
    },
  });
}
  // --------------------------------------------------
  // BOSS MARKERS
  // --------------------------------------------------

  const markers = [];

  if (leftHip) {
    markers.push({
      id: "left-boss",
      type: "boss",

      position: {
        xMM: resolvedLeftBossMM,
        yMM: 0,
      },

      label: "BOSS",

      metadata: {
        side: "left",
      },
    });
  }

  if (rightHip) {
    markers.push({
      id: "right-boss",
      type: "boss",

      position: {
        xMM: resolvedRightBossMM,
        yMM: 0,
      },

      label: "BOSS",

      metadata: {
        side: "right",
      },
    });
  }

  // --------------------------------------------------
  // BASIC DIMENSIONS
  // --------------------------------------------------

  const dimensions = [
    {
      id: "internal-width",
      type: "horizontal",

      start: {
        xMM: 0,
        yMM: 0,
      },

      end: {
        xMM: iw,
        yMM: 0,
      },

      valueMM: iw,
      label: "IW",
      datum: "internal",

      metadata: {
  placement: "above",
  level: 1,
},
    },

    {
      id: "internal-projection",
      type: "vertical",

      start: {
        xMM: iw,
        yMM: 0,
      },

      end: {
        xMM: iw,
        yMM: ip,
      },

      valueMM: ip,
      label: "IP",
      datum: "internal",

      metadata: {
  placement: "right",
  level: 1,
},
    },

   

{
  id: "left-hip-position",
  type: "horizontal",

  start: {
    xMM: 0,
    yMM: ip,
  },

  end: {
    xMM: resolvedLeftBossMM,
    yMM: ip,
  },

  valueMM: resolvedLeftBossMM,
  label: "HP",
  datum: "hip",

  metadata: {
    placement: "below",
    level: 1,
  },
},

{
  id: "external-wallplate-length",
  type: "horizontal",

  start: {
    xMM: resolvedLeftBossMM,
    yMM: ip,
  },

  end: {
    xMM: resolvedRightBossMM,
    yMM: ip,
  },

  valueMM:
    hippedGeom?.horizontalWallplateExternalLengthMM ?? 0,

  label: "EWPL",
  datum: "wallplate",

  metadata: {
    placement: "below",
    level: 1,
  },
},

{
  id: "right-hip-position",
  type: "horizontal",

  start: {
    xMM: resolvedRightBossMM,
    yMM: ip,
  },

  end: {
    xMM: iw,
    yMM: ip,
  },

  valueMM:
    iw - resolvedRightBossMM,

  label: "HP",
  datum: "hip",

  metadata: {
    placement: "below",
    level: 1,
  },
},

{
  id: "external-width",
  type: "horizontal",

  start: {
    xMM:
      -Number(
        hippedGeom?.leftExternalAllowanceMM ?? 0
      ),
    yMM:
      Number(
        hippedGeom?.externalProjectionMM ?? ip
      ),
  },

  end: {
    xMM:
      iw +
      Number(
        hippedGeom?.rightExternalAllowanceMM ?? 0
      ),
    yMM:
      Number(
        hippedGeom?.externalProjectionMM ?? ip
      ),
  },

  valueMM:
    hippedGeom?.externalWidthMM ?? 0,

  label: "EW",
  datum: "external",

  metadata: {
    placement: "below",
    level: 2,
  },
},

{
  id: "external-projection",
  type: "vertical",

  start: {
    xMM:
      -Number(
        hippedGeom?.leftExternalAllowanceMM ?? 0
      ),
    yMM: 0,
  },

  end: {
    xMM:
      -Number(
        hippedGeom?.leftExternalAllowanceMM ?? 0
      ),
    yMM:
      Number(
        hippedGeom?.externalProjectionMM ?? ip
      ),
  },

  valueMM:
    hippedGeom?.externalProjectionMM ?? 0,

  label: "EP",
  datum: "external",

  metadata: {
    placement: "left",
    level: 1,
  },
},
  ];

  // --------------------------------------------------
  // PITCH LABELS
  // --------------------------------------------------

  const pitchLabels = [
    {
      id: "front-pitch",
      facetId: "front",

      position: {
        xMM: iw / 2,
        yMM: ip / 2,
      },

      valueDeg: pitchDeg,
      label: "Front",
    },
  ];

  if (leftHip) {
    pitchLabels.push({
      id: "left-pitch",
      facetId: "left",

      position: {
  xMM: resolvedLeftBossMM * 0.38,
  yMM: ip * 0.32,
},

      valueDeg:
        hippedGeom?.leftSidePitchDeg ?? 0,

      label: "Left",
    });
  }

  if (rightHip) {
    pitchLabels.push({
      id: "right-pitch",
      facetId: "right",

      position: {
  xMM:
    resolvedRightBossMM +
    (iw - resolvedRightBossMM) * 0.62,

  yMM: ip * 0.32,
},

      valueDeg:
        hippedGeom?.rightSidePitchDeg ?? 0,

      label: "Right",
    });
  }

  if (leftHip) {
  pitchLabels.push({
    id: "left-hip-pitch",
    facetId: null,

    position: {
      xMM: resolvedLeftBossMM * 0.42,
      yMM: ip * 0.58,
    },

    valueDeg:
      hippedGeom?.leftHipManufactureV2?.hipPitchDeg ??
      hippedGeom?.leftHipPitchDeg ??
      0,

    label: "Hip",

    metadata: {
      kind: "hip",
      side: "left",
    },
  });
}

if (rightHip) {
  pitchLabels.push({
    id: "right-hip-pitch",
    facetId: null,

    position: {
      xMM:
        resolvedRightBossMM +
        (iw - resolvedRightBossMM) * 0.58,

      yMM: ip * 0.58,
    },

    valueDeg:
      hippedGeom?.rightHipManufactureV2?.hipPitchDeg ??
      hippedGeom?.rightHipPitchDeg ??
      0,

    label: "Hip",

    metadata: {
      kind: "hip",
      side: "right",
    },
  });
}

  const leftExternalAllowanceMM =
  Number(
    hippedGeom?.leftExternalAllowanceMM ?? 0
  );

const rightExternalAllowanceMM =
  Number(
    hippedGeom?.rightExternalAllowanceMM ?? 0
  );

const resolvedExternalProjectionMM =
  Number(
    hippedGeom?.externalProjectionMM ?? ip
  );

  const planFacets = [
  {
    id: "front",
    label: "Front",
    pitchDeg: Number(pitchDeg) || 0,

    metadata: {
      supportDepthMM: sft,

      soffitDepthMM:
        Number(
          hippedGeom?.effectiveFrontSoffitMM ??
          hippedGeom?.frontSoffitMM ??
          soffit
        ),

      supportType: "frame",
    },
  },
];

if (leftHip) {
  planFacets.push({
    id: "left",
    label: "Left Side",
    pitchDeg:
      Number(
        hippedGeom?.leftSidePitchDeg ?? 0
      ),

    metadata: {
      supportDepthMM: sft,

      soffitDepthMM:
        Number(
          hippedGeom
            ?.facetEavesLeftManufacturedSoffitMM ??
          hippedGeom
            ?.leftRoundedManufacturedSoffitMM ??
          0
        ),

      supportType:
        leftWall ? "wall" : "frame",
    },
  });
}

if (rightHip) {
  planFacets.push({
    id: "right",
    label: "Right Side",
    pitchDeg:
      Number(
        hippedGeom?.rightSidePitchDeg ?? 0
      ),

    metadata: {
      supportDepthMM: sft,

      soffitDepthMM:
        Number(
          hippedGeom
            ?.facetEavesRightManufacturedSoffitMM ??
          hippedGeom
            ?.rightRoundedManufacturedSoffitMM ??
          0
        ),

      supportType:
        rightWall ? "wall" : "frame",
    },
  });
}

  return buildRoofPlan({
    internalOutline: [
  { xMM: 0, yMM: 0 },
  { xMM: iw, yMM: 0 },
  { xMM: iw, yMM: ip },
  { xMM: 0, yMM: ip },
],

externalOutline: [
  {
    xMM: -leftExternalAllowanceMM,
    yMM: 0,
  },
  {
    xMM: iw + rightExternalAllowanceMM,
    yMM: 0,
  },
  {
    xMM: iw + rightExternalAllowanceMM,
    yMM: resolvedExternalProjectionMM,
  },
  {
    xMM: -leftExternalAllowanceMM,
    yMM: resolvedExternalProjectionMM,
  },
],

structuralLines,

manufacturingSequence,

    markers: isCentralBoss ? markers.slice(0,1) : markers,

    dimensions: [
  ...dimensions.filter(dimension=>!isCentralBoss || dimension.id!=="external-wallplate-length"),
  ...frontRafterSpacingAnnotations,
  ...sideJackSpacingAnnotations,
],

    pitchLabels,

    facets: planFacets,

    metadata: {
      source: "resolved-geometry",
      roofStyle: roofStyleKey,

      internalWidthMM: iw,
      internalProjectionMM: ip,

      externalWidthMM:
        hippedGeom?.externalWidthMM ?? 0,

      externalProjectionMM:
        hippedGeom?.externalProjectionMM ?? 0,
    },
  });
}, [
  roofStyleKey,
  isCentralBoss,
  hippedGeom,
  iw,
  ip,
  pitchDeg,
  leftHip,
  rightHip,
  resolvedLeftBossMM,
  resolvedRightBossMM,
]);
const WALLPLATE_MATCH_TOLERANCE = 0.1;

const nearlyEqual = (a, b) =>
  Math.abs(
    Number(a || 0) - Number(b || 0)
  ) <= WALLPLATE_MATCH_TOLERANCE;

const leftWallbarManufacture = hippedGeom
  ? {
      pitchDeg:
        hippedGeom.leftSidePitchDeg,

      hfcMM:
        hippedGeom.leftHorizontalFootRunMM,

      vfcMM:
        hippedGeom.leftPlumbCutHeightMM,

      ewbsMM:
        hippedGeom.leftExternalWallBarSlopeMM,

      iwbsMM:
        hippedGeom.leftInternalWallBarSlopeMM,

      topCutOffSquareDeg:
        hippedGeom.leftWallbarTopCutOffSquareDeg,

      internalHorizontalRunMM:
        hippedGeom.leftInternalWallBarSlopeMM *
        Math.cos(
          (hippedGeom.leftSidePitchDeg * Math.PI) / 180
        ),

      externalWallplateHeightMM:
        hippedGeom.designExternalWallplateHeightMM,

      internalWallplateHeightMM:
        hippedGeom.designInternalWallplateHeightMM,
    }
  : null;

const rightWallbarManufacture = hippedGeom
  ? {
      pitchDeg:
        hippedGeom.rightSidePitchDeg,

      hfcMM:
        hippedGeom.rightHorizontalFootRunMM,

      vfcMM:
        hippedGeom.rightPlumbCutHeightMM,

      ewbsMM:
        hippedGeom.rightExternalWallBarSlopeMM,

      iwbsMM:
        hippedGeom.rightInternalWallBarSlopeMM,

      topCutOffSquareDeg:
        hippedGeom.rightWallbarTopCutOffSquareDeg,

      internalHorizontalRunMM:
        hippedGeom.rightInternalWallBarSlopeMM *
        Math.cos(
          (hippedGeom.rightSidePitchDeg * Math.PI) / 180
        ),

      externalWallplateHeightMM:
        hippedGeom.designExternalWallplateHeightMM,

      internalWallplateHeightMM:
        hippedGeom.designInternalWallplateHeightMM,
    }
  : null;

const wallbarsAreDuplicates =
  Boolean(leftHip && rightHip) &&
  leftWallbarManufacture &&
  rightWallbarManufacture &&
  nearlyEqual(
    leftWallbarManufacture.pitchDeg,
    rightWallbarManufacture.pitchDeg
  ) &&
  nearlyEqual(
    leftWallbarManufacture.hfcMM,
    rightWallbarManufacture.hfcMM
  ) &&
  nearlyEqual(
    leftWallbarManufacture.vfcMM,
    rightWallbarManufacture.vfcMM
  ) &&
  nearlyEqual(
    leftWallbarManufacture.ewbsMM,
    rightWallbarManufacture.ewbsMM
  ) &&
  nearlyEqual(
    leftWallbarManufacture.iwbsMM,
    rightWallbarManufacture.iwbsMM
  );

const provisionalRoofMemberGroups = useMemo(() => {
  if (!hippedGeom || roofStyleKey !== "hippedLeanTo") return [];

  const roofInputs = {
    roofStyle: roofStyleKey,
    widthMM: iw,
    projMM: ip,
  };
  const memberById =
    buildHippedLeanToManufacturingSequence(hippedGeom).memberById;
  const members = [];

  [
    ["left", hippedGeom.leftHipManufactureV2],
    ["right", hippedGeom.rightHipManufactureV2],
  ].forEach(([side, profile]) => {
    if (!profile?.valid) return;
    const id = `${side}-hip`;
    members.push({
      id,
      type: "hip",
      manufactureRef: memberById[id]?.manufactureRef ?? null,
      profile,
    });
  });

  const jackAudit = buildJackRafterManufactureAudit({
    roofInputs,
    geometry: hippedGeom,
  });
  jackAudit.jacks.forEach((jack) => {
    members.push({
      id: jack.id,
      type: "jack-rafter",
      manufactureRef: jack.manufactureRef,
      profile: jack.profile,
    });
  });

  buildFrontRafterManufactureProfiles({ geometry: hippedGeom }).forEach(
    (member) => members.push(member)
  );

  return groupProvisionalRoofMembers(members);
}, [hippedGeom, roofStyleKey, iw, ip]);

const provisionalHipGroups = provisionalRoofMemberGroups.filter(
  (group) => group.type === "hip"
);
const provisionalJackGroups = provisionalRoofMemberGroups.filter(
  (group) => group.type === "jack-rafter"
);
const provisionalFrontRafterGroups = provisionalRoofMemberGroups.filter(
  (group) => group.type === "boss-rafter" || group.type === "rafter"
);

const ringBeamManufactureSchedule = useMemo(
  () =>
    roofStyleKey === "hippedLeanTo" && hippedGeom
      ? buildHippedLeanToRingBeamSchedule({ geometry: hippedGeom })
      : null,
  [roofStyleKey, hippedGeom]
);
  const leanToRingBeam = roofStyleKey === 'leanTo' ? buildLeanToBookRingBeam({
    widthMM: iw, lengthMM: extWidthMM,
    leftExtensionMM: leftWall ? 0 : leftSupportDepthMM + (L > 0 ? L : lip),
    firstCentreMM: first, spacingMM: spacing, geometry: manufactureGeom, reference: `P${ringBeamNo}`,
  }) : null;
  //const roofSizeDisplay = `${round(iw)} × ${round(ip)} mm int / ${round(extWidthMM)} × ${round(extProjectionMM)} mm ext`;

  return (
    <div style={{ fontFamily: "Inter, system-ui, Arial", background: "#f9fafb" }}>
      <div className="mb-nav-hide-on-print">
  <NavTabs />
</div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: 14 }}>
 <section className="pm-page pm-front-page">
 <ManufactureBookFront
  roof={{customerName:customer,reference:customerRef,style:roofStyleLabel,pitch:`${pitchDeg}°`,frame:`${sft} mm`,tileType:(tileType||'—').toString().replace(/^./,c=>c.toUpperCase()),tileColour,fasciaColour,soffit:soffitDisplay,gutters:gutterDisplay,downpipes:downpipeDisplay,boxGutters:boxGutterDetails,glazing:q.glazed_options||q.glazedOptions,dimensions:`${iw} × ${ip}mm`,weight:planSummary?`${planSummary.installedWeightKg.toFixed(1)}kg incl. plasterboard`:'—'}}
  job={activeJob}
  details={{job_number:jobDetails.jobNumber,requested_delivery_date:jobDetails.requested_delivery_date,order_notes:jobDetails.notes,delivery_address_json:{deliveryType:jobDetails.deliveryType,deliveryAddress:jobDetails.deliveryAddress,contactName:jobDetails.contactName,contactPhone:jobDetails.contactPhone}}}
  extras={planSummary?Object.values(planSummary.sections).flatMap(section=>section.lines).filter(row=>row.isAddedItem&&row.qty>0&&row.usage!=='factory').map(row=>`${row.qty} ${row.units} ${row.label}`):[]}
  onChange={next=>setJobDetails({jobNumber:next.job_number||'',requested_delivery_date:next.requested_delivery_date||'',notes:next.order_notes||'',deliveryType:next.delivery_address_json?.deliveryType||'Delivery',deliveryAddress:next.delivery_address_json?.deliveryAddress||'',contactName:next.delivery_address_json?.contactName||'',contactPhone:next.delivery_address_json?.contactPhone||''})}
  onSave={saveJobDetails}
 />
 </section>

                {roofStyleKey === "leanTo" && (
  <>
  
    {/* ===== PAGE 2: CAD PAGE ===== */}
        <ManufacturePlanPage
          details={{customer:customer,reference:customerRef,roof:roofStyleLabel,frame:`${sft}mm`,tiles:[tileType,tileColour].filter(Boolean).join(' — '),fascia:fasciaColour,gutter:[gutterColour,gutterProfile].filter(Boolean).join(' — '),weight:planSummary?`${planSummary.installedWeightKg.toFixed(1)}kg incl. plasterboard`:'—'}}
          facets={[{label:'Front',pitch:`${Number(pitchDeg).toFixed(1)}°`,support:`${frameOn} mm frame`,soffit:`${Math.round(soffit)} mm`}]}
          elevation={hasRoofDimensions?<LeanToSideElevationManufacture manufactureGeom={manufactureGeom} pitchDeg={pitchDeg}/>:null}
          notes={<span><b>Identical rafters:</b> P{firstRafterNo}–P{lastRafterNo} · ×{rafterCount} · manufacture all to the Side Elevation / Height Check above.</span>}
        >
          {hasRoofDimensions?(<PlanDiagramLeanToManufacture
    iw={iw}
    ip={ip}
    sft={sft}
    leftSupportDepthMM={leftSupportDepthMM}
    rightSupportDepthMM={rightSupportDepthMM}
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
  />):<p>No roof dimensions loaded</p>}
        </ManufacturePlanPage>
        <ManufacturingLeanToWallplate lengthMM={wallplateLengthMM} manufactureRef={wallplateNo} geometry={manufactureGeom}/>
        {leanToRingBeam && <section className="pm-page pm-leanto-ringbeam-page">
          <div style={{...panel,padding:'4mm',height:'100%',boxSizing:'border-box'}}>
            <h2 style={{fontSize:16,margin:'0 0 8px'}}>Ring-beam</h2>
            <ManufacturingRingBeamDrawing group={leanToRingBeam}/>
            <p style={{fontSize:11}}>End zones outside the edge rafters are shown as “End”; numbered B bays are the upstand cutting positions. Continuous layers have square ends.</p>
          </div>
        </section>}
        <section className="pm-page pm-leanto-plastics-page">
          <div style={{...panel,padding:'4mm',height:'100%',boxSizing:'border-box'}}>
            <LeanToPlasticsGuide geometry={manufactureGeom} lengthMM={extWidthMM} leftWall={leftWall} rightWall={rightWall} leftOverhangMM={L} rightOverhangMM={R} colour={fasciaColour}/>
          </div>
        </section>
  </>
)}

{roofStyleKey === "hippedLeanTo" && (
  <>
    {/* ===== HIPPED PAGE 2: ROOF PLAN ===== */}
    <ManufacturePlanPage
      details={{customer:customer,reference:customerRef,roof:roofStyleLabel,frame:`${sft}mm`,tiles:[tileType,tileColour].filter(Boolean).join(' — '),fascia:fasciaColour,gutter:[gutterColour,gutterProfile].filter(Boolean).join(' — '),weight:planSummary?`${planSummary.installedWeightKg.toFixed(1)}kg incl. plasterboard`:'—'}}
      facets={(roofPlan?.facets||[]).map(f=>({id:f.id,label:f.label,pitch:`${Number(f.pitchDeg||0).toFixed(1)}°`,support:f.metadata?.supportDepthMM?`${f.metadata.supportDepthMM} mm ${f.metadata.supportType||''}`:'—',soffit:`${Math.round(f.metadata?.soffitDepthMM??0)} mm`}))}
    >
      {roofPlan&&<RoofPlanDiagram model={roofPlan} mode="manufacture" largePrint/>}
        {hippedGeom ? (
  <>
    {SHOW_LEGACY_HIPPED_WALLPLATE_VISUALISER && (
      <ManufacturingFacetDrawing
        title="Front Wallplate Assembly"

        internalWidthMM={iw}
        externalWidthMM={
          hippedGeom.externalWidthMM
        }

        leftHipPositionMM={
          hippedGeom.resolvedLeftHipWidthMM
        }
        rightHipPositionMM={
          hippedGeom.resolvedRightHipWidthMM
        }

        externalWallplateLengthMM={
          hippedGeom
            .horizontalWallplateExternalLengthMM
        }
        internalWallplateLengthMM={
          hippedGeom
            .horizontalWallplateInternalLengthMM
        }

        internalWallplateHeightMM={
          hippedGeom
            .designInternalWallplateHeightMM
        }
        externalWallplateHeightMM={
          hippedGeom
            .designExternalWallplateHeightMM
        }

        leftPitchDeg={
          hippedGeom.leftSidePitchDeg
        }
        rightPitchDeg={
          hippedGeom.rightSidePitchDeg
        }

        leftHFCMM={
          hippedGeom.leftHorizontalFootRunMM
        }
        rightHFCMM={
          hippedGeom.rightHorizontalFootRunMM
        }

        leftVFCMM={
          hippedGeom.leftPlumbCutHeightMM
        }
        rightVFCMM={
          hippedGeom.rightPlumbCutHeightMM
        }

        leftEWBSMM={
          hippedGeom.leftExternalWallBarSlopeMM
        }
        rightEWBSMM={
          hippedGeom.rightExternalWallBarSlopeMM
        }

        leftIWBSMM={
          hippedGeom.leftInternalWallBarSlopeMM
        }
        rightIWBSMM={
          hippedGeom.rightInternalWallBarSlopeMM
        }

        leftInternalHorizontalRunMM={
          hippedGeom
            .leftFacetGeometry
            ?.internalHorizontalRunMM
        }
        rightInternalHorizontalRunMM={
          hippedGeom
            .rightFacetGeometry
            ?.internalHorizontalRunMM
        }
      />
    )}
  </>
) : (
  <div
    style={{
      color: "#6b7280",
      fontSize: 16,
      fontWeight: 600,
    }}
  >
    No Hipped Lean-To geometry loaded
  </div>
)}
    </ManufacturePlanPage>
          

    {isCentralBoss && <ManufacturingCentralTrussDrawing truss={hippedGeom?.centralTruss} memberRefs={buildHippedLeanToManufacturingSequence(hippedGeom).members.filter(member=>member.type==='wallbar').map(member=>member.manufactureRef)} />}
    {/* ===== EXISTING HIPPED MANUFACTURE PAGE ===== */}
    {!isCentralBoss && <section className={`pm-page pm-wallplate-page${leftHip&&rightHip&&!wallbarsAreDuplicates?' pm-wallplate-unique':''}`}>
    <div className="pm-wallplate-panel" style={{ ...panel, padding: "3mm 2mm" }}>

      <div
  style={{
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottom: "2px solid #111827",
  }}
>
  Wallplate
</div>

{hippedGeom && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      gap: 8,
      alignItems: "start",
    }}
  >
    {/* =========================================
        LEFT / DUPLICATE WALLBAR
    ========================================= */}

    {leftHip &&
      leftWallbarManufacture && (
        <ManufacturingWallplateMemberDrawing
          manufactureRef={
            wallbarsAreDuplicates
              ? "R1 / R21"
              : "R1"
          }

          quantity={
            wallbarsAreDuplicates ? 2 : 1
          }

          memberType="wallbar"

          {...leftWallbarManufacture}
        />
      )}

    {/* =========================================
        RIGHT WALLBAR — ONLY WHEN UNIQUE
    ========================================= */}

    {rightHip &&
      !wallbarsAreDuplicates &&
      rightWallbarManufacture && (
        <ManufacturingWallplateMemberDrawing
          manufactureRef="R21"
          quantity={1}
          memberType="wallbar"

          {...rightWallbarManufacture}
        />
      )}

    {/* =========================================
        HORIZONTAL WALLPLATE
    ========================================= */}

    <ManufacturingWallplateMemberDrawing
      manufactureRef="R22"
      quantity={1}
      memberType="horizontal-wallplate"
      jointReferences={hippedGeom.wallplateAssembly}
      finishedHeightMM={hippedGeom.finishedRoofHeightMM}

      externalLengthMM={
        hippedGeom
          .horizontalWallplateExternalLengthMM
      }

      internalLengthMM={
        hippedGeom
          .horizontalWallplateInternalLengthMM
      }

      externalHeightMM={
        hippedGeom
          .designExternalWallplateHeightMM
      }

      internalHeightMM={
        hippedGeom
          .designInternalWallplateHeightMM
      }

      leftEndCutOffSquareDeg={
        hippedGeom
          .horizontalWallplateLeftEndCutOffSquareDeg
      }

      rightEndCutOffSquareDeg={
        hippedGeom
          .horizontalWallplateRightEndCutOffSquareDeg
      }
    />
    {!hippedGeom.wallplateAssembly?.valid && (
      <div role="alert" style={{ gridColumn: "1 / -1", color: "#b91c1c", fontWeight: 700 }}>Wallplate assembly not verified — do not use these cuts until the geometry is resolved.</div>
    )}
  </div>
)}


      {hippedGeom?.wallplateAssembly?.valid&&<ManufacturingWallplatePly geometry={hippedGeom}/>}
    </div>
  </section>}

  <ManufacturingRoofMemberPages groups={[...provisionalHipGroups,...provisionalJackGroups,...provisionalFrontRafterGroups]}/>

  {ringBeamManufactureSchedule?.valid && ringBeamManufactureSchedule.groups.map(group => (
    <section className="pm-page" key={`ring-beam-page-${group.manufactureRefs.join('-')}`}>
      <div style={{...panel,padding:'3mm 2mm'}}>
        <div style={{...sectionTitle,fontSize:16,marginBottom:7}}>Ring-beams</div>
        <ManufacturingRingBeamDrawing group={group} />
      </div>
    </section>
  ))}

  {false && ringBeamManufactureSchedule?.valid && (
    <section className="pm-page">
      <div style={panel}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 3 }}>
          Hipped Lean-To Manufacture
        </div>
        <div style={{ ...sectionTitle, marginBottom: 2 }}>
          Ring-beam schedule — read only
        </div>
        <div style={{ fontSize: 12, color: "#92400e", marginBottom: 10 }}>
          Validation stage only. These quantities do not yet replace Summary pricing or manufacturing output.
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Ref</th>
              <th style={th}>Beam</th>
              <th style={th}>Internal</th>
              <th style={th}>External</th>
              <th style={th}>Base width</th>
              <th style={th}>Pitch</th>
              <th style={th}>Manufactured soffit</th>
              <th style={th}>VFC</th>
              <th style={th}>Upstands</th>
              <th style={th}>Clear bay widths</th>
            </tr>
          </thead>
          <tbody>
            {ringBeamManufactureSchedule.members.map((member) => {
              const beam = member.ringBeam;
              const eaves = beam.eavesGeometry || {};
              return (
                <tr key={member.id}>
                  <td style={td}><b>{member.manufactureRef}</b></td>
                  <td style={td}>
                    {member.side === "front"
                      ? "Front ring-beam"
                      : `${member.side === "left" ? "Left" : "Right"} side ring-beam`}
                  </td>
                  <td style={td}>{round(beam.internalLengthMM)} mm</td>
                  <td style={td}>{round(beam.externalLengthMM)} mm</td>
                  <td style={td}>{round(beam.baseWidthMM, 1)} mm</td>
                  <td style={td}>{round(eaves.pitchDeg, 1)}°</td>
                  <td style={td}>{round(eaves.soffitDepthMM)} mm</td>
                  <td style={td}>{round(eaves.plumbCutHeightMM)} mm</td>
                  <td style={td}>{beam.upstandCount}</td>
                  <td style={{ ...td, fontSize: 11 }}>
                    {(beam.bayWidthsMM || []).map((width) => round(width)).join(" / ")} mm
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ ...sectionTitle, marginTop: 14, marginBottom: 7 }}>
          Calculated component usage
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Component</th>
              <th style={th}>Calculated usage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={td}>30×95 PSE continuous ring-beam timber</td>
              <td style={td}>{round(ringBeamManufactureSchedule.totals.pse30x90LengthM, 3)} m</td>
            </tr>
            <tr>
              <td style={td}>9 mm ply base/soffit</td>
              <td style={td}>{round(ringBeamManufactureSchedule.totals.ply9BaseAreaM2, 3)} m²</td>
            </tr>
            <tr>
              <td style={td}>9 mm ply upstands</td>
              <td style={td}>{round(ringBeamManufactureSchedule.totals.ply9UpstandAreaM2, 3)} m²</td>
            </tr>
            <tr>
              <td style={td}>25×50 outer fixing lath</td>
              <td style={td}>{round(ringBeamManufactureSchedule.totals.outerFixingLath25x50LengthM, 3)} m</td>
            </tr>
            <tr>
              <td style={td}>25×50 upstand finishing pieces</td>
              <td style={td}>{round(ringBeamManufactureSchedule.totals.finishingLath25x50LengthM, 3)} m</td>
            </tr>
            <tr>
              <td style={td}>50 mm PIR to upstand faces</td>
              <td style={td}>{round(ringBeamManufactureSchedule.totals.pir50AreaM2, 3)} m²</td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: 10, fontSize: 12, color: "#475569" }}>
          Matching beams found: {ringBeamManufactureSchedule.groups.map((group) =>
            `${group.manufactureRefs.join(" / ")} ×${group.quantity}`
          ).join("; ")}
        </div>
      </div>
    </section>
  )}
  <section className="pm-page pm-plastics-guide-page">
    <div style={panel}><PlasticsCuttingGuide audit={planSummary?.integratedPlasticsAudit} /></div>
  </section>

  </>
)}
        <section className="pm-page pm-checklist-page">
          <IdiotList showNavTabs={false} materialsModel={planSummary} inputs={q} />
        </section>
      </div>

      <style>{`
        .pm-leanto-ringbeam-page svg{max-width:none!important;max-height:none!important}
        .pm-leanto-plastics-page h3{font-size:16px}
        .pm-leanto-plastics-page th,.pm-leanto-plastics-page td{font-size:11px!important;padding:6px!important}
        .pm-leanto-plastics-page p{font-size:11px!important;line-height:1.35}
        .pm-truss-page { break-inside: avoid; }
        .pm-truss-page svg { max-width: none !important; }
        .pm-wallplate-panel { min-height: 0; height:100%; box-sizing: border-box; }
        .pm-wallplate-page .pm-wallplate-panel{padding:4mm!important}
        .pm-wallplate-page svg { max-width: none !important; max-height: 58mm; }
        .pm-wallplate-page .wallplate-member{padding:8px!important;break-inside:avoid}
        .pm-wallplate-page .wallplate-member svg{height:52mm;max-height:52mm}
        .pm-wallplate-unique .wallplate-member svg{height:38mm;max-height:38mm}
        .wallplate-ply-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:8px}
        .wallplate-ply-card{box-sizing:border-box;border:1px solid #cbd5e1;border-radius:6px;padding:6px;break-inside:avoid}
        .wallplate-ply-card h3{display:flex;justify-content:space-between;gap:4px;font-size:12px;margin:0 0 3px}
        .pm-wallplate-page .wallplate-ply-card svg{display:block;width:100%;height:30mm;max-height:30mm}
        .wallplate-ply-profiles{grid-template-columns:minmax(0,1fr)}
        .pm-wallplate-page .wallplate-ply-profiles .wallplate-ply-card svg{height:32mm;max-height:32mm}
        .pm-wallplate-page .wallplate-ply-profiles .wallplate-rear-profile svg{height:18mm;max-height:18mm}
        .wallplate-ply-card p{font-size:10px;line-height:1.25;margin:3px 0 0}
        .pm-wallplate-unique .wallplate-ply-card svg{height:24mm;max-height:24mm}
        .pm-roof-plan-page { height: 279mm; }
        .pm-roof-plan-panel { box-sizing: border-box; width: 100%; height: 100%; padding: 3mm 1mm; display: flex; flex-direction: column; gap: 3mm; background: white; }
        .pm-roof-plan-title { margin: 0; text-align: center; font-size: 16px; line-height: 1.2; }
        .pm-roof-plan-details { display: grid; grid-template-columns: 1.3fr 1.15fr 1.15fr 1fr; gap: 4px 10px; padding: 6px 8px; border: 1px solid #94a3b8; background: #f8fafc; font-size: 11px; line-height: 1.3; }
        .pm-roof-plan-details > div { min-width: 0; overflow-wrap: anywhere; }
        .pm-roof-plan-drawing { width: 100%; flex: 1; min-height: 0; display: flex; align-items: center; }
        .pm-roof-plan-drawing > div { width: 100%; height: 100%; display: flex; align-items: center; overflow: visible !important; }
        .pm-roof-plan-drawing svg { width: 100% !important; height: 100% !important; max-width: none !important; max-height: 100%; }
        .pm-roof-plan-facets { width: 100%; border-collapse: collapse; font-size: 11px; line-height: 1.2; }
        .pm-roof-plan-facets th, .pm-roof-plan-facets td { border: 1px solid #94a3b8; padding: 4px 7px; text-align: left; }

        .pm-front-page{width:194mm;max-width:100%;margin:18px auto;}
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

  .pm-plastics-guide-page, .pm-checklist-page { max-height: none; overflow: visible; height: auto; }

  .pm-page:last-child {
    break-after: auto;
    page-break-after: auto;
  }
}
      `}</style>
    </div>
  );
}
