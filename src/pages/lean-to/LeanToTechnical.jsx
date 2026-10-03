import { buildHippedMiscellaneousIntegrationAudit } from "../../lib/Calculations/miscellaneousIntegrationAudit";
import { buildHippedMetalIntegrationAudit } from "../../lib/Calculations/metalIntegrationAudit";
import { buildHippedGutteringIntegrationAudit } from "../../lib/Calculations/gutteringIntegrationAudit";
import React, { useMemo } from "react";
import NavTabs from "../../components/NavTabs";
import TemplateGeometryVisualizer from "../../components/TemplateGeometryVisualizer";
import WallplateGeometryVisualizer from "../../components/WallplateGeometryVisualizer";
import HippedWallplateFrontVisualizer from "../../components/HippedWallplateFrontVisualizer";
import { getMaterials } from "../../lib/materials";
import { externalFacetAreaM2, coveringWeightRates } from "../../lib/Calculations/installedCoveringWeights";
import { buildSummaryTilingComparison } from "../../lib/Calculations/summaryTilingComparison";
import { buildAutomaticRoofTiling } from "../../lib/Calculations/automaticRoofTiling";
import { buildAutomaticRoofEdgeBOM } from "../../lib/Calculations/automaticRoofEdgeBOM";
import { buildHippedPlasticsIntegrationAudit } from "../../lib/Calculations/plasticsIntegrationAudit";
import { buildHipRidgeLathIntegrationAudit } from "../../lib/Calculations/hipRidgeLathIntegrationAudit";
import { buildHipManufactureAudit } from "../../lib/Calculations/hipManufactureAudit";
import { buildJackRafterManufactureAudit } from "../../lib/Calculations/jackRafterManufactureAudit";
import { buildHippedLeanToRingBeamSchedule } from "../../lib/Manufacturing/ringBeamManufactureSchedule";
import {
  buildRingBeamIntegrationAudit,
  buildRingBeamPlyBaseIntegrationAudit,
  buildRingBeamPlyUpstandIntegrationAudit,
  buildRingBeamOuterLathIntegrationAudit,
  buildRingBeamFinishingLathIntegrationAudit,
  buildRingBeamPirIntegrationAudit,
  buildRingBeamSummaryConsolidation,
} from "../../lib/Calculations/ringBeamIntegrationAudit";
import {
  buildHippedWallplateIntegrationAudit,
  buildWallplateSummaryProposal,
} from "../../lib/Calculations/wallplateIntegrationAudit";
import { buildProvisionalHippedLeanToTimber } from "../../lib/Calculations/provisionalHippedLeanToTimber";
import { buildHippedLeanToInsulationAudit } from "../../lib/Calculations/insulationIntegrationAudit";
import { buildLeanToTotals } from "../../lib/leanToTotals";
import { calculateLeanToGeometry } from "../../lib/geometry/leanToGeometry";

const loadInputs = () => {
  try {
    return JSON.parse(localStorage.getItem("leanToInputs") || "{}");
  } catch {
    return {};
  }
};

const round = (value, dp = 0) => {
  const power = 10 ** dp;
  return Math.round((Number(value) || 0) * power) / power;
};

const loadObject = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
};

const panel = {
  marginBottom: 16,
  padding: 16,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
};

const th = {
  padding: "7px 9px",
  border: "1px solid #d1d5db",
  background: "#f1f5f9",
  textAlign: "left",
  fontSize: 13,
};

const td = {
  padding: "7px 9px",
  border: "1px solid #d1d5db",
  fontSize: 13,
  verticalAlign: "top",
};

export default function LeanToTechnical() {
  const roofInputs = useMemo(loadInputs, []);
  const materials = useMemo(() => getMaterials(), []);
  const summaryExclusions = useMemo(
    () => loadObject("summary_exclusions"),
    []
  );
  const summaryAdjustments = useMemo(
    () => loadObject("summary_adjustments"),
    []
  );
  const summaryAdjustmentValues = useMemo(
    () => loadObject("summary_adjustment_values"),
    []
  );
  const summaryExclusionValues = useMemo(
    () => loadObject("summary_exclusion_values"),
    []
  );

  const quoteTotals = useMemo(
    () => buildLeanToTotals(roofInputs, summaryExclusions),
    [roofInputs, summaryExclusions]
  );

  const adjustmentDelta = useMemo(
    () =>
      [
        ...Object.values(summaryAdjustmentValues),
        ...Object.values(summaryExclusionValues),
      ].reduce((sum, value) => {
        const number = Number(value);
        return Number.isFinite(number) ? sum + number : sum;
      }, 0),
    [summaryAdjustmentValues, summaryExclusionValues]
  );

  const automatic = useMemo(
    () => buildAutomaticRoofTiling({ roofInputs, materials }),
    [roofInputs, materials]
  );

  const geometry = automatic?.geometry || null;
  const isHipped = automatic?.roofStyle === "hippedLeanTo" && geometry;

  const edgeResult = useMemo(
    () =>
      buildAutomaticRoofEdgeBOM({
        roofInputs,
        materials,
        automaticRoofTiling: automatic,
      }),
    [roofInputs, materials, automatic]
  );

  const hipAudit = useMemo(
    () =>
      buildHipManufactureAudit({
        roofInputs,
        geometry,
        edgeModel: edgeResult?.edgeModel,
      }),
    [roofInputs, geometry, edgeResult]
  );

  const jackAudit = useMemo(
    () => buildJackRafterManufactureAudit({ roofInputs, geometry }),
    [roofInputs, geometry]
  );

  const ringSchedule = useMemo(
    () =>
      isHipped
        ? buildHippedLeanToRingBeamSchedule({ geometry })
        : null,
    [isHipped, geometry]
  );

  const wallplateIntegrationAudit = useMemo(
    () =>
      isHipped
        ? buildHippedWallplateIntegrationAudit({
            geometry,
            currentSummaryExternalWidthMM:
              quoteTotals?.derived?.extWidthMM,
          })
        : null,
    [isHipped, geometry, quoteTotals]
  );

  const provisionalHippedTimber = useMemo(
    () =>
      isHipped
        ? buildProvisionalHippedLeanToTimber({
            roofInputs,
            geometry,
          })
        : null,
    [isHipped, roofInputs, geometry]
  );

  const ringBeamIntegrationAudit = useMemo(
    () =>
      isHipped
        ? buildRingBeamIntegrationAudit({
            currentSummaryQuantityM:
              Number(quoteTotals?.derived?.extWidthMM || 0) / 1000,
            ringSchedule,
            stockLengthM: materials?.pse30x90?.stock_len_m ?? 4.8,
          })
        : null,
    [isHipped, quoteTotals, ringSchedule, materials]
  );

  const ringBeamPlyBaseIntegrationAudit = useMemo(
    () =>
      isHipped
        ? buildRingBeamPlyBaseIntegrationAudit({
            currentSummaryExternalWidthMM:
              quoteTotals?.derived?.extWidthMM,
            currentSummaryBaseWidthMM:
              Number(
                roofInputs?.soffit_mm ??
                  roofInputs?.eaves_overhang_mm ??
                  150
              ) + 70,
            ringSchedule,
          })
        : null,
    [isHipped, quoteTotals, roofInputs, ringSchedule]
  );

  const ringBeamPlyUpstandIntegrationAudit = useMemo(
    () =>
      isHipped
        ? buildRingBeamPlyUpstandIntegrationAudit({
            currentSummaryExternalWidthMM:
              quoteTotals?.derived?.extWidthMM,
            currentSummaryUpstandHeightMM: 195,
            ringSchedule,
          })
        : null,
    [isHipped, quoteTotals, ringSchedule]
  );

  const ringBeamOuterLathIntegrationAudit = useMemo(
    () =>
      isHipped
        ? buildRingBeamOuterLathIntegrationAudit({
            currentSummaryQuantityM: 0,
            ringSchedule,
          })
        : null,
    [isHipped, ringSchedule]
  );

  const ringBeamFinishingLathIntegrationAudit = useMemo(
    () =>
      isHipped
        ? buildRingBeamFinishingLathIntegrationAudit({
            currentSummaryInternalWidthMM: geometry?.widthMM,
            rafterSpacingMM: materials?.rafter_spacing_mm ?? 665,
            firstRafterCentreMM:
              materials?.rafter_first_center_mm ?? 690,
            assumedBayWidthMM: 617,
            ringSchedule,
          })
        : null,
    [isHipped, geometry, materials, ringSchedule]
  );

  const ringBeamPirIntegrationAudit = useMemo(
    () =>
      isHipped
        ? buildRingBeamPirIntegrationAudit({
            currentSummaryExternalWidthMM:
              quoteTotals?.derived?.extWidthMM,
            currentSummaryPirHeightMM: 185,
            ringSchedule,
          })
        : null,
    [isHipped, quoteTotals, ringSchedule]
  );

  const currentSummarySupportingQuantities = useMemo(() => {
    if (!isHipped) return null;

    const widthMM = Number(geometry?.widthMM ?? 0);
    const projectionMM = Number(geometry?.projectionMM ?? 0);
    const pitchDeg = Number(geometry?.frontPitchDeg ?? 0);
    const soffitDepthMM = Number(
      roofInputs?.soffit_mm ?? roofInputs?.eaves_overhang_mm ?? 150
    );
    const frameOnMM = Number(
      roofInputs?.frame_on_mm ?? materials?.frame_on_mm ?? 70
    );
    const spacingMM = Number(materials?.rafter_spacing_mm ?? 665);
    const firstCentreMM = Number(materials?.rafter_first_center_mm ?? 690);

    const sharedLeanToGeometry = calculateLeanToGeometry({
      widthMM,
      projectionMM,
      pitchDeg,
      soffitDepthMM,
      materials,
    });
    const frontRafterLengthMM = Number(
      sharedLeanToGeometry?.rafterExternalLength ?? 0
    );
    const internalRows =
      pitchDeg > 0 ? Math.ceil(frontRafterLengthMM / 400) : 0;

    let centreCount = 0;
    if (widthMM > 0 && spacingMM > 0 && firstCentreMM > 0) {
      for (
        let centreMM = firstCentreMM;
        centreMM <= widthMM;
        centreMM += spacingMM
      ) {
        centreCount += 1;
      }
    }
    const rafterCount = Math.max(2, centreCount + 2);
    const cradleFaces = Math.max(0, 2 * rafterCount - 2);
    const pitchRadians = (pitchDeg * Math.PI) / 180;
    const cradleFaceLengthMM =
      (projectionMM + frameOnMM) / (Math.cos(pitchRadians) || 1);
    const cradleRawM2 =
      (cradleFaces * cradleFaceLengthMM * 140) / 1_000_000;
    const cradleWastePercent = Number(materials?.pir50?.waste_pct ?? 0);

    return {
      externalTilingLathM:
        Number(automatic?.result?.lathLengthMM ?? 0) / 1000,
      internalFixingLathM: internalRows * (widthMM / 1000),
      ringBeamFinishingLathM: Number(
        ringBeamFinishingLathIntegrationAudit?.currentSummaryQuantityM ?? 0
      ),
      pirCradleAreaM2:
        cradleRawM2 * (1 + cradleWastePercent / 100),
    };
  }, [
    isHipped,
    geometry,
    roofInputs,
    materials,
    automatic,
    ringBeamFinishingLathIntegrationAudit,
  ]);

  const ringBeamSummaryConsolidation = useMemo(
    () =>
      isHipped
        ? buildRingBeamSummaryConsolidation({
            currentSummaryExternalWidthMM:
              quoteTotals?.derived?.extWidthMM,
            currentSummaryBaseWidthMM:
              Number(
                roofInputs?.soffit_mm ??
                  roofInputs?.eaves_overhang_mm ??
                  150
              ) + 70,
            currentSummaryUpstandHeightMM: 195,
            currentSummaryWallplateFaceHeightMM: 220,
            currentExternalTilingLathM:
              currentSummarySupportingQuantities?.externalTilingLathM,
            currentInternalFixingLathM:
              currentSummarySupportingQuantities?.internalFixingLathM,
            currentRingBeamFinishingLathM:
              currentSummarySupportingQuantities?.ringBeamFinishingLathM,
            currentPirCradleAreaM2:
              currentSummarySupportingQuantities?.pirCradleAreaM2,
            currentPirCradleWeightMultiplier:
              materials?.pir50_cradle_weight_multiplier ?? 1,
            currentSummaryPirHeightMM: 185,
            ringSchedule,
            materials,
          })
        : null,
    [
      isHipped,
      quoteTotals,
      roofInputs,
      ringSchedule,
      materials,
      currentSummarySupportingQuantities,
    ]
  );

  const wallplateSummaryProposal = useMemo(
    () =>
      isHipped
        ? buildWallplateSummaryProposal({
            wallplateAudit: wallplateIntegrationAudit,
            steicoRoofMembersM:
              Number(
                provisionalHippedTimber?.totals
                  ?.steicoRoofMemberLengthMM ?? 0
              ) / 1000,
            integratedPly9M2:
              ringBeamSummaryConsolidation?.lines?.ply9mm
                ?.proposedQuantity,
            materials,
          })
        : null,
    [
      isHipped,
      wallplateIntegrationAudit,
      provisionalHippedTimber,
      ringBeamSummaryConsolidation,
      materials,
    ]
  );

  const insulationIntegrationAudit = useMemo(
    () =>
      isHipped
        ? buildHippedLeanToInsulationAudit({
            roofInputs,
            geometry,
            ringSchedule,
            currentSummaryPir50AreaM2:
              ringBeamSummaryConsolidation?.lines?.pir50
                ?.proposedQuantity,
            memberWidthMM: 48,
            cradleStripWidthMM: 140,
            wastePercent: Number(
              materials?.slab100_wastage_pct ??
                materials?.pir50?.waste_pct ??
                5
            ),
            sheetWidthMM:
              Number(materials?.pir100?.sheet_w_m ?? 1.2) * 1000,
            sheetLengthMM:
              Number(materials?.pir100?.sheet_h_m ?? 2.4) * 1000,
            internalLathCentresMM: Number(
              roofInputs?.int_lath_centres_mm ?? 400
            ),
            superQuiltOverlapMM: Number(
              materials?.superquilt_overlap_mm ?? 50
            ),
            superQuiltWastePercent: Number(
              materials?.superquilt_wastage_pct ?? 6
            ),
            superQuiltRollWidthMM: Number(
              materials?.superquilt_roll_width_mm ?? 1200
            ),
            superQuilt12Price: Number(
              materials?.superquilt_12m_price_each ??
                materials?.superquilt_12m2_price_ex_vat ??
                0
            ),
            superQuilt15Price: Number(
              materials?.superquilt_15m_price_each ??
                materials?.superquilt_15m2_price_ex_vat ??
                0
            ),
            currentSummaryInternalLathM:
              currentSummarySupportingQuantities?.internalFixingLathM,
          })
        : null,
    [
      isHipped,
      roofInputs,
      geometry,
      ringSchedule,
      ringBeamSummaryConsolidation,
      currentSummarySupportingQuantities,
      materials,
    ]
  );

  const tilingComparison = useMemo(() => {
    const widthMM = Number(roofInputs.internalWidthMM || roofInputs.widthMM || 0);
    const projectionMM = Number(roofInputs.internalProjectionMM || roofInputs.projMM || 0);
    const pitchDeg = Number(roofInputs.pitchDeg || roofInputs.pitch || 15);
    const sharedGeometry = calculateLeanToGeometry({ widthMM, projectionMM,
      pitchDeg, soffitDepthMM: Number(roofInputs.soffit_mm ?? roofInputs.eaves_overhang_mm ?? 150), materials });
    const sideFrameMM = Number(roofInputs.side_frame_thickness_mm) || Number(materials.side_frame_thickness_mm) || 70;
    const lipMM = Number(roofInputs.fascia_lip_mm) || Number(materials.fascia_lip_mm) || 25;
    const widthM = (widthMM + 2 * (sideFrameMM + lipMM)) / 1000;
    const gaugeMM = Number(roofInputs.gauge_mm || materials.tile_britmet_gauge_mm || 250);
    const courses = pitchDeg > 0 && gaugeMM > 0
      ? Math.ceil(Number(sharedGeometry.rafterExternalLength ?? 0) / gaugeMM) : 0;
    const legacyTotals = buildLeanToTotals({ ...roofInputs,
      widthMM, projMM: projectionMM, pitchDeg,
      eavesOverhangMM: Number(roofInputs.eavesOverhangMM ?? roofInputs.soffit_mm ?? 150),
      leftOverhangMM: Number(roofInputs.leftOverhangMM ?? roofInputs.left_overhang_mm ?? 0),
      rightOverhangMM: Number(roofInputs.rightOverhangMM ?? roofInputs.right_overhang_mm ?? 0),
      leftWall: typeof roofInputs.leftWall === "boolean" ? roofInputs.leftWall :
        (roofInputs.left_wall_present ?? (roofInputs.left_exposed === false)),
      rightWall: typeof roofInputs.rightWall === "boolean" ? roofInputs.rightWall :
        (roofInputs.right_wall_present ?? (roofInputs.right_exposed === false)),
      tileSystem: String(roofInputs.tile_system || roofInputs.tileSystem || "britmet").toLowerCase(),
    }, summaryExclusions);
    return buildSummaryTilingComparison({
      legacyTileLines: legacyTotals.sections?.tiles || [],
      legacyExternalLathM: (courses + 1) * widthM,
      automaticResult: automatic?.result,
    });
  }, [roofInputs, materials, summaryExclusions, automatic]);

  const hipRidgeLathAudit = buildHipRidgeLathIntegrationAudit({
    edgeModel: edgeResult?.edgeModel,
    tileSystem: automatic?.productId ?? roofInputs.tileSystem ?? roofInputs.tile_system,
    materials,
    currentLathM: isHipped && insulationIntegrationAudit?.valid
      ? Number(automatic?.result?.lathLengthMM ?? 0) / 1000 +
        insulationIntegrationAudit.internalLaths.totalM +
        Number(ringSchedule?.totals?.outerFixingLath25x50LengthM ?? 0) +
        Number(ringSchedule?.totals?.finishingLath25x50LengthM ?? 0)
      : null,
  });

  const plasticsAudit = isHipped ? buildHippedPlasticsIntegrationAudit({
    geometry, edgeModel: edgeResult?.edgeModel, materials,
    legacyLines: quoteTotals.sections?.plastics || [],
    plasticsColor: roofInputs.plasticsColor ?? roofInputs.plastics_color ?? "white",
  }) : null;

  const gutterAudit = isHipped ? buildHippedGutteringIntegrationAudit({
    edgeModel: edgeResult?.edgeModel, materials,
    profile: roofInputs.gutterProfile ?? roofInputs.gutter_profile ?? roofInputs.gutter_profile_type ?? "square",
    legacyLines: quoteTotals.sections?.gutters || [],
  }) : null;

  const metalAudit = isHipped ? buildHippedMetalIntegrationAudit({ geometry, edgeResult, materials }) : null;

  const coveringRates = coveringWeightRates(materials);
  const coveringExternalM2 = externalFacetAreaM2(geometry?.facets || []);
  const coveringInternalM2 = insulationIntegrationAudit?.valid
    ? insulationIntegrationAudit.superQuilt.geometricAreaM2
    : (Number(roofInputs.internalWidthMM ?? roofInputs.widthMM ?? 0) *
        Number(roofInputs.internalProjectionMM ?? roofInputs.projMM ?? 0) /
        1_000_000 / Math.cos(Number(roofInputs.pitchDeg ?? 0) * Math.PI / 180));
  const miscAudit = isHipped ? buildHippedMiscellaneousIntegrationAudit({
    geometry, internalAreaM2: coveringInternalM2, externalAreaM2: coveringExternalM2,
    tileQuantity: automatic?.result?.tileQuantityOrdered,
    tileSystem: automatic?.productId ?? roofInputs.tileSystem ?? roofInputs.tile_system,
    materials, legacyLines: quoteTotals.sections?.misc || [],
    edgeLines: edgeResult?.bom?.lines || [],
    roofInputs, automaticResult: automatic?.result, insulationAudit: insulationIntegrationAudit,
    edgeModel: edgeResult?.edgeModel,
  }) : null;


  return (
    <div style={{ fontFamily: "Inter, system-ui, Arial", background: "#f8fafc", minHeight: "100vh" }}>
      <NavTabs />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: 16 }}>
        <h1 style={{ marginBottom: 4 }}>Technical</h1>
        <p style={{ marginTop: 0, color: "#475569" }}>
          Visualisers, geometry diagnostics and read-only integration evidence for the current Design/Options roof.
        </p>

        <section style={panel}>
          <h2 style={{ marginTop: 0 }}>Quotation adjustment diagnostics</h2>
          <p style={{ marginTop: 0, color: "#64748b" }}>
            Technical audit only. The adjustment delta remains included in the quotation price.
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            <div><b>Adjustment delta:</b> £{adjustmentDelta.toFixed(2)}</div>
            <div>
              <b>Adjusted quantity keys:</b>{" "}
              {Object.keys(summaryAdjustments).join(", ") || "None"}
            </div>
            <div style={{ color: "#64748b", fontSize: 12 }}>
              <b>Available material keys:</b>{" "}
              {(quoteTotals?.allLines || []).map((line) => line.key).join(", ") || "None"}
            </div>
          </div>
        </section>

        {miscAudit && (
          <section style={panel}>
            <h2 style={{ marginTop: 0 }}>Integration Audit — Miscellaneous consumables</h2>
            <p>Read-only calculation evidence. Summary now uses these confirmed allowances for resolved hipped roofs. Internal facets: {miscAudit.internalAreaM2.toFixed(3)} m²; external facets: {miscAudit.externalAreaM2.toFixed(3)} m²; main tiles ordered: {miscAudit.tileQuantity}.</p>
            {miscAudit.errors.map(error => <p key={error} style={{ color: "#b91c1c" }}>{error}</p>)}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Item", "Legacy qty", "Audited qty", "Audited cost", "Calculation / review"].map(label => <th key={label} style={th}>{label}</th>)}</tr></thead>
              <tbody>{miscAudit.rows.map(row => <tr key={row.key}><td style={td}>{row.label}</td><td style={td}>{row.currentQty ?? "Unavailable"}</td><td style={td}>{row.candidateQty ?? "Needs fixing rule"}</td><td style={td}>{row.cost == null ? "Unconfigured / pending" : `£${row.cost.toFixed(2)}`}</td><td style={td}>{row.basis}<br />{row.review}</td></tr>)}</tbody>
            </table>
            {miscAudit.lathAudit?.valid && (
              <div>
                <h3>Lath screw supply allowance</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>Facet</th><th style={th}>Internal row fixings</th><th style={th}>External row fixings</th></tr></thead>
                  <tbody>{["front", "left", "right"].map(facet => <tr key={facet}>
                    <td style={td}>{facet}</td>
                    <td style={td}>{miscAudit.lathAudit.rows.filter(row => row.facet === facet && row.use === "internal").reduce((sum, row) => sum + row.screws, 0)}</td>
                    <td style={td}>{miscAudit.lathAudit.rows.filter(row => row.facet === facet && row.use === "external").reduce((sum, row) => sum + row.screws, 0)}</td>
                  </tr>)}</tbody>
                </table>
                <p>Additional external fixings: {miscAudit.lathAudit.supportScrews} hip/ridge support; {miscAudit.lathAudit.perimeterScrews} perimeter finishing allowance. Supply {miscAudit.lathAudit.internalBoxes} internal + {miscAudit.lathAudit.externalBoxes} external boxes of 250.</p>
                <ul>{miscAudit.lathAudit.assumptions.map(item => <li key={item}>{item}</li>)}</ul>
              </div>
            )}
            <p>Plasterboard comparison: legacy plan {miscAudit.plasterboard.legacyPlanM2.toFixed(3)} m² / {miscAudit.plasterboard.legacyBoards} sheets / {miscAudit.plasterboard.legacyWeightKg.toFixed(2)} kg; internal facets {miscAudit.plasterboard.internalFacetM2.toFixed(3)} m² / {miscAudit.plasterboard.facetBoards} sheets / {miscAudit.plasterboard.facetWeightKg.toFixed(2)} kg.</p>
            <ul>{miscAudit.assumptions.map(item => <li key={item}>{item}</li>)}</ul>
          </section>
        )}

        {metalAudit && (
          <section style={panel}>
            <h2 style={{ marginTop: 0 }}>Integration Audit — Metal Items</h2>
            <p>Read-only metal calculation evidence. Summary now includes aluminium secret gutter from each accompanying EWBS, with installed weight.</p>
            {metalAudit.errors.map(error => <p key={error} style={{ color: "#b91c1c" }}>{error}</p>)}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Item", "Used / count", "Order quantity", "Basis", "Weight", "Cost"].map(label => <th key={label} style={th}>{label}</th>)}</tr></thead>
              <tbody>{metalAudit.rows.map(row => <tr key={row.key}><td style={td}>{row.label}</td><td style={td}>{row.qty} {row.units}</td><td style={td}>{row.orderQty}</td><td style={td}>{row.basis}</td><td style={td}>{row.weightKg.toFixed(2)} kg</td><td style={td}>{row.cost == null ? "Unconfigured" : `£${row.cost.toFixed(2)}`}</td></tr>)}</tbody>
            </table>
            <p>Jack count breakdown: {metalAudit.jackBreakdown.map(row => `${row.key}: ${row.qty}`).join("; ")}</p>
            <p>Watercourse wallbars: {metalAudit.watercourse.runs.map(run => `${run.side}: ${run.lengthMM.toFixed(0)} mm → ${run.orderQty} length(s)`).join("; ") || "None"}. Displayed metal subtotal: {metalAudit.totalWeightKg.toFixed(2)} kg; {metalAudit.totalCost == null ? "Pricing incomplete" : `£${metalAudit.totalCost.toFixed(2)}`}.</p>
            <ul>{metalAudit.assumptions.map(item => <li key={item}>{item}</li>)}</ul>
          </section>
        )}

        {gutterAudit && (
          <section style={panel}>
            <h2 style={{ marginTop: 0 }}>Integration Audit — gutters and downpipes</h2>
            <p>Read-only calculation evidence. Summary now uses these quantities for valid hipped roofs. Profile: {gutterAudit.profile}; stock: {gutterAudit.stockM} m; bracket spacing: {gutterAudit.spacingMM} mm.</p>
            {gutterAudit.errors.map(error => <p key={error} style={{ color: "#b91c1c" }}>{error}</p>)}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Run", "External eaves", "Stock lengths", "Unions", "Brackets"].map(label => <th key={label} style={th}>{label}</th>)}</tr></thead>
              <tbody>{gutterAudit.rows.map(row => <tr key={row.edgeId}><td style={td}>{row.edgeId}</td><td style={td}>{row.runM.toFixed(3)} m</td><td style={td}>{row.lengths}</td><td style={td}>{row.unions}</td><td style={td}>{row.brackets}</td></tr>)}</tbody>
            </table>
            <p>Total installed gutter: {gutterAudit.totalRunM.toFixed(3)} m; brackets: {gutterAudit.counts.brackets}.</p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Item</th><th style={th}>Quantity</th><th style={th}>Cost</th></tr></thead>
              <tbody>{gutterAudit.items.map(item => <tr key={item.key}><td style={td}>{item.label}</td><td style={td}>{item.qty} {item.unit}</td><td style={td}>{item.cost == null ? "Unconfigured" : `£${item.cost.toFixed(2)}`}</td></tr>)}</tbody>
            </table>
            <p>Total: {gutterAudit.totalCost == null ? "Pricing incomplete" : `£${gutterAudit.totalCost.toFixed(2)}`}</p>
            <ul>{gutterAudit.assumptions.map(item => <li key={item}>{item}</li>)}</ul>
          </section>
        )}

        {plasticsAudit && (
          <section style={panel}>
            <h2 style={{ marginTop: 0 }}>Integration Audit — Reveal Liner, soffit and fittings</h2>
            <p style={{ color: "#92400e" }}>Read-only calculation evidence. Summary now uses this perimeter stock plan for valid hipped roofs without open verges. Existing fascia and soffit weight rates are retained.</p>
            {plasticsAudit.errors.map((error) => <p key={error} style={{ color: "#b91c1c" }}>{error}</p>)}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Eaves run", "External run", "VFC", "Required Reveal Liner cover", "Reveal Liner order width", "Standalone fascia lengths", "Resolved soffit", "Provisional soffit stock", "Standalone soffit lengths"].map(label => <th key={label} style={th}>{label}</th>)}</tr></thead>
                <tbody>{plasticsAudit.rows.map(row => <tr key={row.edgeId}>
                  <td style={td}>{row.edgeId}</td><td style={td}>{row.runM.toFixed(3)} m</td>
                  <td style={td}>{row.vfcMM.toFixed(1)} mm</td><td style={td}>{row.finishedFasciaHeightMM.toFixed(1)} mm</td>
                  <td style={td}>{row.fasciaWidthMM} mm</td><td style={td}>{row.fasciaQty} × {row.fasciaStockM} m</td>
                  <td style={td}>{row.soffitGeometryMM.toFixed(1)} mm</td><td style={td}>{row.soffitWidthMM == null ? "Not available" : `${row.soffitWidthMM} mm`}</td><td style={td}>{row.soffitQty} × {row.soffitStockM} m</td>
                </tr>)}</tbody>
              </table>
            </div>
            <p>Total eaves: {plasticsAudit.totals.totalRunM.toFixed(3)} m; Reveal Liner: {plasticsAudit.totals.fasciaQty} pooled stock lengths; soffit: {plasticsAudit.totals.soffitQty} stock lengths.</p>
            <p>Soffit order: {plasticsAudit.soffitPlan.order.map(item => `${item.qty} × ${item.widthMM} mm × ${plasticsAudit.rows[0]?.soffitStockM} m`).join("; ")}. {plasticsAudit.soffitCost == null ? "Stock pricing incomplete." : `£${plasticsAudit.soffitCost.toFixed(2)}`}</p>
            <p>Soffit preparation: {plasticsAudit.soffitPlan.boards.map((board, index) => `Board ${index + 1} (${board.widthMM} mm): ${board.strips.map(strip => `${strip.widthMM} mm strip for ${strip.pieces.map(piece => `${piece.edgeId} ${(piece.lengthM * 1000).toFixed(0)} mm`).join(" + ")}`).join("; ")}`).join(" / ")}. Rip allowance: {plasticsAudit.soffitPlan.kerfMM} mm.</p>
            <p>Fascia fitting layout: {plasticsAudit.fasciaPlan.runPieces.map(run => `${run.edgeId}: ${run.lengthsM.map(length => (length * 1000).toFixed(0)).join(" + ")} mm`).join("; ")}. Full boards are supplied for fitting on site.</p>
            <p>Factory venting: {plasticsAudit.totals.ventQtyM.toFixed(3)} m, £{plasticsAudit.totals.ventCost.toFixed(2)} using the existing charging rule.</p>
            <p>Front-to-side eaves junctions: {plasticsAudit.totals.frontHipCornerCount}; straight joints in the pooled fitting layout: {plasticsAudit.totals.straightJoints}. These are review counts, not confirmed fitting order quantities.</p>
            <p>Remaining open sloping verges: {plasticsAudit.remainingOpenVerges.length}. Their end-liner detail remains separate from horizontal side eaves.</p>
            <h3>External plastics accessories — read only</h3>
            <p>J-trim external frame perimeter: {plasticsAudit.accessories.jRunM == null ? "Frame dimensions unavailable" : `${plasticsAudit.accessories.jRunM.toFixed(3)} m`}. H-trim pieces: {plasticsAudit.accessories.hPieces.map(piece => `${piece.label}: ${piece.lengthMM} mm`).join("; ")}.</p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Item</th><th style={th}>Requirement</th><th style={th}>Cost</th></tr></thead>
              <tbody>{plasticsAudit.accessories.lines.map(line => <tr key={line.key}><td style={td}>{line.label}</td><td style={td}>{line.qty ?? "Unresolved"} {line.unit}</td><td style={td}>{line.cost == null ? "Unconfigured" : `£${line.cost.toFixed(2)}`}</td></tr>)}</tbody>
            </table>
            <h3>Legacy plastics rows for comparison</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Existing row</th><th style={th}>Quantity</th><th style={th}>Cost</th></tr></thead>
              <tbody>{plasticsAudit.legacyLines.map(row => <tr key={row.key}><td style={td}>{row.label}</td><td style={td}>{row.qty}</td><td style={td}>£{row.cost.toFixed(2)}</td></tr>)}</tbody>
            </table>
            <h3>Review before integration</h3>
            <ul>{plasticsAudit.assumptions.map(item => <li key={item}>{item}</li>)}</ul>
          </section>
        )}

        {hipRidgeLathAudit.valid && (
          <section style={panel}>
            <h2 style={{ marginTop: 0 }}>Integration Audit — hip/ridge support laths and expanding foam tape</h2>
            <p style={{ color: "#92400e" }}>The validated support-lath usage now contributes to the common 25×50 Summary total. Expanding foam tape is included as a separate Miscellaneous row; unconfigured tape weight remains explicitly identified.</p>
            <p>{hipRidgeLathAudit.steel
              ? "Steel shingles: two black-painted 25×50 support laths per hip/ridge. Adhesive expanding foam tape is fitted beneath both hip laths only."
              : "Slate system: hip/ridge support laths and expanding foam tape are not required."}</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["Edge", "Kind", "External edge length", "Lath pieces", "25×50 usage", "Foam tape usage", "Finish"].map((label) => <th key={label} style={th}>{label}</th>)}</tr></thead>
                <tbody>{hipRidgeLathAudit.rows.map((row) => (
                  <tr key={row.edgeId}>
                    <td style={td}>{row.edgeId}</td><td style={td}>{row.kind}</td>
                    <td style={td}>{row.edgeLengthM.toFixed(3)} m</td>
                    <td style={td}>{row.lathQty} × {(row.edgeLengthM * 1000).toFixed(0)} mm</td>
                    <td style={td}>{row.lathLengthM.toFixed(3)} m</td>
                    <td style={td}>{row.tapeLengthM.toFixed(3)} m</td><td style={td}>{row.finish}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <h3>Summary integration comparison</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Item", "Before integration", "Additional usage", "Integrated total", "Order basis"].map((label) => <th key={label} style={th}>{label}</th>)}</tr></thead>
              <tbody>
                <tr><td style={td}>Combined 25×50 stock</td>
                  <td style={td}>{hipRidgeLathAudit.quantities.baseLathM == null ? "—" : `${hipRidgeLathAudit.quantities.baseLathM.toFixed(3)} m`}</td>
                  <td style={td}>{hipRidgeLathAudit.quantities.additionalLathM.toFixed(3)} m</td>
                  <td style={td}>{hipRidgeLathAudit.quantities.proposedLathM == null ? "—" : `${hipRidgeLathAudit.quantities.proposedLathM.toFixed(3)} m`}</td>
                  <td style={td}>{hipRidgeLathAudit.quantities.proposedLathStockQty == null ? "—" : `${hipRidgeLathAudit.quantities.currentLathStockQty} → ${hipRidgeLathAudit.quantities.proposedLathStockQty} lengths @ ${hipRidgeLathAudit.quantities.lathStockLengthM} m`}</td>
                </tr>
                <tr><td style={td}>Expanding foam tape (separate from canned foam)</td>
                  <td style={td}>Previously absent; now integrated</td>
                  <td style={td}>{hipRidgeLathAudit.quantities.tapeLengthM.toFixed(3)} m</td>
                  <td style={td}>{hipRidgeLathAudit.quantities.tapeRollQty} rolls</td>
                  <td style={td}>5.6 m rolls, whole rolls rounded from total hip tape usage</td>
                </tr>
              </tbody>
            </table>
            <p>Additional installed lath weight: {hipRidgeLathAudit.additionalLathWeightKg.toFixed(2)} kg; base lath cost: £{hipRidgeLathAudit.additionalLathCost.toFixed(2)} before the configured timber waste uplift.</p>
            <p>Tape cost: {hipRidgeLathAudit.tapeCost == null ? "Material rate not configured" : `£${hipRidgeLathAudit.tapeCost.toFixed(2)}`}; installed tape weight: {hipRidgeLathAudit.tapeInstalledWeightKg == null ? "Material weight not configured" : `${hipRidgeLathAudit.tapeInstalledWeightKg.toFixed(2)} kg`}.</p>
            <p style={{ fontSize: 12 }}>{hipRidgeLathAudit.assumptions.join(" ")}</p>
            {hipRidgeLathAudit.ridgeVentilationPending && <p style={{ color: "#92400e" }}>Ridge ventilation strip requirements remain to be specified before a roof with a ridge is integrated.</p>}
          </section>
        )}

        {coveringExternalM2 > 0 && (
          <section style={panel}>
            <h2 style={{ marginTop: 0 }}>Integration Audit — installed covering weights</h2>
            <p>The live Summary uses these installed-area weights. Purchased surplus and overlap allowances are excluded from the weight calculation.</p>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                {["Material", "Area basis", "Installed area", "kg/m²", "Installed weight", "Order"].map((label) => <th key={label} style={th}>{label}</th>)}
              </tr></thead>
              <tbody>
                <tr>
                  <td style={td}>Breather membrane</td><td style={td}>All external sloping facets</td>
                  <td style={td}>{coveringExternalM2.toFixed(3)} m²</td>
                  <td style={td}>{coveringRates.membraneKgPerM2.toFixed(4)}</td>
                  <td style={td}>{(coveringExternalM2 * coveringRates.membraneKgPerM2).toFixed(2)} kg</td>
                  <td style={td}>1 × 50 m² roll</td>
                </tr>
                <tr>
                  <td style={td}>SuperQuilt</td><td style={td}>All internal sloping facets</td>
                  <td style={td}>{coveringInternalM2.toFixed(3)} m²</td>
                  <td style={td}>{coveringRates.superQuiltKgPerM2.toFixed(4)}</td>
                  <td style={td}>{(coveringInternalM2 * coveringRates.superQuiltKgPerM2).toFixed(2)} kg</td>
                  <td style={td}>Roll mix shown in the insulation audit; installed weight is independent of that mix.</td>
                </tr>
              </tbody>
            </table>
            <p style={{ fontSize: 12 }}>Rates use the existing Materials reference weights: membrane roll ÷ 50 m²; SuperQuilt 12 m² reference roll ÷ 12 m². An explicit kg/m² rate takes precedence if configured.</p>
          </section>
        )}

      {tilingComparison && (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            border: "2px solid #2563eb",
            borderRadius: 7,
            background: "#eff6ff",
          }}
        >
          <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>
            Tile/lath integration audit
          </h3>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#374151" }}>
            The Summary now uses the universal quantities. This panel retains
            the previous calculation for comparison while we validate the change.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              fontSize: 13,
            }}
          >
            <div>
              <b>Legacy tile quantity</b>
              <br />
              {tilingComparison.legacyTileQuantity ?? "Not found"}
            </div>
            <div>
              <b>Universal tile quantity</b>
              <br />
              {tilingComparison.universalTileQuantity}
            </div>
            <div>
              <b>Tile difference</b>
              <br />
              {tilingComparison.tileDifference == null
                ? "Not available"
                : `${tilingComparison.tileDifference >= 0 ? "+" : ""}${tilingComparison.tileDifference}`}
            </div>
            <div>
              <b>Legacy external fixing lath</b>
              <br />
              {tilingComparison.legacyExternalLathM.toFixed(3)} m
            </div>
            <div>
              <b>Universal external fixing lath</b>
              <br />
              {tilingComparison.universalExternalLathM.toFixed(3)} m
            </div>
            <div>
              <b>External-lath difference</b>
              <br />
              {tilingComparison.externalLathDifferenceM >= 0 ? "+" : ""}
              {tilingComparison.externalLathDifferenceM.toFixed(3)} m
            </div>
          </div>
        </div>
      )}

        {!isHipped ? (
          <section style={panel}>
            <b>No Hipped Lean-To technical geometry is available.</b>
            <div style={{ marginTop: 6, color: "#64748b" }}>
              Create or load a Hipped Lean-To on Design/Options first.
            </div>
          </section>
        ) : (
          <>
            <section style={panel}>
              <h2 style={{ marginTop: 0 }}>Geometry summary</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 8 }}>
                <div><b>Internal size:</b> {round(geometry.widthMM)} × {round(geometry.projectionMM)} mm</div>
                <div><b>External size:</b> {round(geometry.externalWidthMM)} × {round(geometry.externalProjectionMM)} mm</div>
                <div><b>Front pitch:</b> {round(geometry.frontPitchDeg, 1)}°</div>
                <div><b>Side pitches:</b> {round(geometry.leftSidePitchDeg, 1)}° / {round(geometry.rightSidePitchDeg, 1)}°</div>
                <div><b>Left boss:</b> {round(geometry.resolvedLeftHipWidthMM)} mm</div>
                <div><b>Right boss:</b> {round(geometry.widthMM - geometry.resolvedRightHipWidthMM)} mm</div>
                <div><b>Front timber HFC:</b> {round(geometry.frontTemplateDebug?.horizontalFootRunMM, 1)} mm</div>
                <div><b>Side timber HFC:</b> {round(geometry.leftTemplateDebug?.horizontalFootRunMM, 1)} mm</div>
                <div><b>Side ply base:</b> {round(geometry.leftTemplateDebug?.plyBaseWidthMM, 1)} mm</div>
              </div>
            </section>

            {geometry.frontTemplateDebug && geometry.leftTemplateDebug && (
              <TemplateGeometryVisualizer
                frontTemplate={geometry.frontTemplateDebug}
                sideTemplate={geometry.leftTemplateDebug}
                matchedSideSoffitMM={geometry.leftPlumbCutMatchedSoffitMM}
                mitreTrimAllowanceMM={geometry.leftMitreTrimAllowanceMM}
                manufacturedSideSoffitMM={geometry.leftRoundedManufacturedSoffitMM}
              />
            )}

            <WallplateGeometryVisualizer
              projectionMM={geometry.projectionMM}
              frontPitchDeg={geometry.frontPitchDeg}
              designRiseMM={geometry.designRiseMM}
              frontRafterFaceRiseMM={geometry.frontRafterFaceRiseMM}
              effectivePitchRunMM={geometry.effectivePitchRunMM}
              internalWallplateHeightMM={geometry.designInternalWallplateHeightMM}
              externalWallplateHeightMM={geometry.designExternalWallplateHeightMM}
              wallplateThicknessMM={geometry.raw?.wallplateThicknessMM ?? 63}
              wallplateHeightMM={geometry.wallplateHeightMM ?? 220}
              ringBeamHeightMM={geometry.ringBeamHeightMM ?? 40}
            />

            <HippedWallplateFrontVisualizer geometry={geometry} />

            {hipAudit?.valid && (
              <section style={panel}>
                <h2 style={{ marginTop: 0 }}>Hip manufacturing audit — read only</h2>
                {hipAudit.hips.map((hip) => (
                  <div key={hip.side} style={{ marginTop: 12 }}>
                    <b>{hip.manufactureRef ? `${hip.manufactureRef} · ` : ""}{hip.side} hip</b>
                    <span style={{ color: "#475569" }}> · pitch {round(hip.hipPitchDeg, 2)}° · plan {round(hip.hipPlanLengthMM, 1)} mm</span>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}>
                      <tbody>
                        {hip.measurements.map((measurement) => (
                          <tr key={measurement.key}>
                            <td style={td}>{measurement.key}</td>
                            <td style={{ ...td, textAlign: "right" }}>{round(measurement.calculatedMM, 1)} mm</td>
                            {measurement.referenceMM != null && <td style={{ ...td, textAlign: "right" }}>Reference {round(measurement.referenceMM)} mm</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </section>
            )}

            {jackAudit?.valid && (
              <section style={panel}>
                <h2 style={{ marginTop: 0 }}>Jack rafter manufacturing audit — read only</h2>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={th}>Facet</th><th style={th}>Ref</th><th style={th}>Position</th><th style={th}>Pitch</th><th style={th}>Internal</th><th style={th}>External</th><th style={th}>HFC</th><th style={th}>VFC</th></tr></thead>
                    <tbody>
                      {jackAudit.jacks.map((jack) => (
                        <tr key={jack.id}>
                          <td style={td}>{jack.facetId}</td><td style={td}>{jack.manufactureRef || "—"}</td>
                          <td style={td}>{round(jack.positionMM)} mm</td><td style={td}>{round(jack.profile.facetPitchDeg, 2)}°</td>
                          <td style={td}>{round(jack.profile.internalSlopeLengthMM, 1)} mm</td><td style={td}>{round(jack.profile.externalSlopeLengthMM, 1)} mm</td>
                          <td style={td}>{round(jack.profile.horizontalFootCutMM, 1)} mm</td><td style={td}>{round(jack.profile.verticalFootCutMM, 1)} mm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {insulationIntegrationAudit?.valid && (
              <section style={panel}>
                <h2 style={{ marginTop: 0 }}>Integration Audit — roof insulation</h2>
                <p style={{ color: "#92400e" }}>
                  The audited 50 mm PIR, 100 mm PIR, SuperQuilt and internal fixing-lath quantities now feed the live Summary.
                </p>

                <h3>100 mm PIR — insulation bays</h3>
                <div style={{ overflowX: "auto", marginBottom: 18 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={th}>Front facet</th><th style={th}>Left facet</th><th style={th}>Right facet</th><th style={th}>Gross internal surface</th><th style={th}>48 mm timber footprint</th><th style={th}>Net PIR</th><th style={th}>With 5% allowance</th><th style={th}>Boards</th></tr></thead>
                    <tbody><tr>
                      <td style={td}>{round(insulationIntegrationAudit.facets.frontM2, 3)} m²</td>
                      <td style={td}>{round(insulationIntegrationAudit.facets.leftM2, 3)} m²</td>
                      <td style={td}>{round(insulationIntegrationAudit.facets.rightM2, 3)} m²</td>
                      <td style={td}>{round(insulationIntegrationAudit.pir100.grossInternalRoofAreaM2, 3)} m²</td>
                      <td style={td}>−{round(insulationIntegrationAudit.pir100.timberFootprintAreaM2, 3)} m²</td>
                      <td style={td}>{round(insulationIntegrationAudit.pir100.netAreaM2, 3)} m²</td>
                      <td style={td}>{round(insulationIntegrationAudit.pir100.orderAreaM2, 3)} m²</td>
                      <td style={td}><b>{insulationIntegrationAudit.pir100.orderQty}</b></td>
                    </tr></tbody>
                  </table>
                </div>

                <h3>Summary comparison</h3>
                <div style={{ overflowX: "auto", marginBottom: 18 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={th}>Material</th><th style={th}>Previous Summary area</th><th style={th}>Integrated area</th><th style={th}>Previous order</th><th style={th}>Integrated order</th><th style={th}>Basis</th></tr></thead>
                    <tbody>
                      <tr>
                        <td style={td}><b>100 mm PIR</b></td>
                        <td style={td}>{round(insulationIntegrationAudit.pir100.currentSummaryAreaM2, 3)} m²</td>
                        <td style={td}>{round(insulationIntegrationAudit.pir100.orderAreaM2, 3)} m²</td>
                        <td style={td}>{insulationIntegrationAudit.pir100.currentSummaryOrderQty}</td>
                        <td style={td}>{insulationIntegrationAudit.pir100.orderQty}</td>
                        <td style={td}>All internal facet surfaces less the 48 mm Steico footprints, then 5% allowance</td>
                      </tr>
                      <tr>
                        <td style={td}><b>50 mm PIR</b></td>
                        <td style={td}>{insulationIntegrationAudit.pir50.currentSummaryAreaM2 == null ? "—" : `${round(insulationIntegrationAudit.pir50.currentSummaryAreaM2, 3)} m²`}</td>
                        <td style={td}>{round(insulationIntegrationAudit.pir50.combinedAreaM2, 3)} m²</td>
                        <td style={td}>{insulationIntegrationAudit.pir50.currentSummaryOrderQty ?? "—"}</td>
                        <td style={td}>{insulationIntegrationAudit.pir50.orderQty}</td>
                        <td style={td}>140 mm rebated cradle strips plus the integrated ring-beam upstand PIR</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3>50 mm PIR — rebated cradle and ring-beam</h3>
                <div style={{ overflowX: "auto", marginBottom: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={th}>Roof-member faces</th><th style={th}>Sloping wallbars</th><th style={th}>Total cradle length</th><th style={th}>140 mm blank area</th><th style={th}>Cradle with 5%</th><th style={th}>Ring-beam upstands</th><th style={th}>Combined 50 mm PIR</th><th style={th}>Boards</th></tr></thead>
                    <tbody><tr>
                      <td style={td}>{round(insulationIntegrationAudit.pir50.roofMemberCradleLengthM, 3)} m</td>
                      <td style={td}>{round(insulationIntegrationAudit.pir50.wallbarCradleLengthM, 3)} m</td>
                      <td style={td}>{round(insulationIntegrationAudit.pir50.cradleTotalLengthM, 3)} m</td>
                      <td style={td}>{round(insulationIntegrationAudit.pir50.cradleNetAreaM2, 3)} m²</td>
                      <td style={td}>{round(insulationIntegrationAudit.pir50.cradleOrderAreaM2, 3)} m²</td>
                      <td style={td}>{round(insulationIntegrationAudit.pir50.ringBeamAreaM2, 3)} m²</td>
                      <td style={td}>{round(insulationIntegrationAudit.pir50.combinedAreaM2, 3)} m²</td>
                      <td style={td}><b>{insulationIntegrationAudit.pir50.orderQty}</b></td>
                    </tr></tbody>
                  </table>
                </div>
                <p style={{ marginBottom: 0, color: "#64748b", fontSize: 13 }}>
                  The horizontal wallplate is excluded. Each sloping wallbar contributes one inward-facing cradle strip; every full rafter, jack and hip contributes both insulation-facing sides. Stock boards are {insulationIntegrationAudit.assumptions.sheetWidthMM} × {insulationIntegrationAudit.assumptions.sheetLengthMM} mm.
                </p>

                <h3>SuperQuilt — complete internal surface</h3>
                <div style={{ overflowX: "auto", marginBottom: 18 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={th}>Internal surface</th><th style={th}>Overlap</th><th style={th}>Waste</th><th style={th}>Nominal roll area required</th><th style={th}>12 m² rolls</th><th style={th}>15 m² rolls</th><th style={th}>Coverage ordered</th></tr></thead>
                    <tbody><tr>
                      <td style={td}>{round(insulationIntegrationAudit.superQuilt.geometricAreaM2, 3)} m²</td>
                      <td style={td}>{insulationIntegrationAudit.assumptions.superQuiltOverlapMM} mm</td>
                      <td style={td}>{insulationIntegrationAudit.assumptions.superQuiltWastePercent}%</td>
                      <td style={td}>{round(insulationIntegrationAudit.superQuilt.nominalAreaM2, 3)} m²</td>
                      <td style={td}>{insulationIntegrationAudit.superQuilt.rolls12}</td>
                      <td style={td}>{insulationIntegrationAudit.superQuilt.rolls15}</td>
                      <td style={td}><b>{round(insulationIntegrationAudit.superQuilt.coverageM2, 3)} m²</b></td>
                    </tr></tbody>
                  </table>
                </div>

                <h3>25×50 internal plasterboard-fixing laths</h3>
                <div style={{ overflowX: "auto", marginBottom: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={th}>Facet</th><th style={th}>Rows</th><th style={th}>Calculated length</th><th style={th}>Rule</th></tr></thead>
                    <tbody>
                      <tr><td style={td}>Front</td><td style={td}>{insulationIntegrationAudit.internalLaths.front.rowCount}</td><td style={td}>{round(insulationIntegrationAudit.internalLaths.front.metres, 3)} m</td><td style={td}>Trapezoid: ring-beam row, {insulationIntegrationAudit.assumptions.internalLathCentresMM} mm centres, final wallplate row</td></tr>
                      <tr><td style={td}>Left side</td><td style={td}>{insulationIntegrationAudit.internalLaths.left.rowCount}</td><td style={td}>{round(insulationIntegrationAudit.internalLaths.left.metres, 3)} m</td><td style={td}>Triangle: rows narrow from wallbar to hip</td></tr>
                      <tr><td style={td}>Right side</td><td style={td}>{insulationIntegrationAudit.internalLaths.right.rowCount}</td><td style={td}>{round(insulationIntegrationAudit.internalLaths.right.metres, 3)} m</td><td style={td}>Triangle: rows narrow from wallbar to hip</td></tr>
                      <tr><td style={td}><b>Total</b></td><td style={td}><b>{insulationIntegrationAudit.internalLaths.front.rowCount + insulationIntegrationAudit.internalLaths.left.rowCount + insulationIntegrationAudit.internalLaths.right.rowCount}</b></td><td style={td}><b>{round(insulationIntegrationAudit.internalLaths.totalM, 3)} m</b></td><td style={td}>Previous Summary: {insulationIntegrationAudit.internalLaths.currentSummaryM == null ? "—" : `${round(insulationIntegrationAudit.internalLaths.currentSummaryM, 3)} m`}</td></tr>
                    </tbody>
                  </table>
                </div>
                <p style={{ marginBottom: 0, color: "#64748b", fontSize: 13 }}>
                  Internal laths are measured from the internal facet boundaries; unlike external tiling laths, soffits and external tile overhangs are excluded.
                </p>
              </section>
            )}

            {wallplateIntegrationAudit?.valid && (
              <section style={panel}>
                <h2 style={{ marginTop: 0 }}>Integration Audit — wallplate</h2>
                <p style={{ color: "#92400e" }}>
                  The audited wallplate quantities now feed the live Hipped Lean-To Summary. The tables below retain the legacy comparison and wallplate integration stage for reference.
                </p>

                <h3>Assembly quantities</h3>
                <div style={{ overflowX: "auto", marginBottom: 18 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Material</th>
                        <th style={th}>Current Summary</th>
                        <th style={th}>Manufacture-derived</th>
                        <th style={th}>Difference</th>
                        <th style={th}>Status</th>
                        <th style={th}>Basis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [
                          "Steico 220 wallplate members",
                          wallplateIntegrationAudit.steico,
                          wallplateIntegrationAudit.steico.formula,
                        ],
                        [
                          "9 mm wallplate faceplates / rear packers",
                          wallplateIntegrationAudit.ply9,
                          `Front faceplate ${round(wallplateIntegrationAudit.ply9.frontFaceplateAreaM2, 3)} m² + rear chevron covers ${round(wallplateIntegrationAudit.ply9.rearChevronCoverAreaM2, 3)} m² + ${wallplateIntegrationAudit.ply9.rearPackerCount} rear packers`,
                        ],
                        [
                          "18 mm wallplate infill / chevrons",
                          wallplateIntegrationAudit.ply18,
                          `143 mm EWPL infill + ${wallplateIntegrationAudit.ply18.chevronCount} × 600 mm chevron blanks`,
                        ],
                      ].map(([label, line, basis]) => (
                        <tr key={label}>
                          <td style={td}><b>{label}</b></td>
                          <td style={td}>{round(line.current, 3)} {line.unit}</td>
                          <td style={td}>{round(line.manufacture, 3)} {line.unit}</td>
                          <td style={td}>
                            {line.difference > 0 ? "+" : ""}
                            {round(line.difference, 3)} {line.unit}
                          </td>
                          <td style={{
                            ...td,
                            color: line.status === "Match" ? "#166534" : "#92400e",
                            fontWeight: 700,
                          }}>
                            {line.status}
                          </td>
                          <td style={td}>{basis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3>Wallplate hardware check</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Component</th>
                        <th style={th}>Current quantity</th>
                        <th style={th}>Required quantity</th>
                        <th style={th}>Status</th>
                        <th style={th}>Rule</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Joist hangers", wallplateIntegrationAudit.hardware.joistHangers],
                        ["Boss / rafter terminals", wallplateIntegrationAudit.hardware.bosses],
                        ["Spar hooks", wallplateIntegrationAudit.hardware.sparHooks],
                      ].map(([label, item]) => (
                        <tr key={label}>
                          <td style={td}><b>{label}</b></td>
                          <td style={td}>{item.current}</td>
                          <td style={td}>{item.manufacture}</td>
                          <td style={{
                            ...td,
                            color: item.status === "Match" ? "#166534" : "#92400e",
                            fontWeight: 700,
                          }}>
                            {item.status}
                          </td>
                          <td style={td}>{item.note || "One per active wallplate joint"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p style={{ marginBottom: 0, color: "#64748b", fontSize: 13 }}>
                  Rear packers are provisionally 75 × 220 mm and calculated independently on each uncovered run at no more than 800 mm spacing. A boss-position rafter moved away from its boss must later be reclassified as an ordinary rafter: remove its two spar hooks, restore its ordinary length and add one joist hanger.
                </p>

                {wallplateSummaryProposal?.valid && (
                  <>
                    <h3>Consolidated Summary comparison — integration stage</h3>
                    <p style={{ marginTop: -6, color: "#64748b", fontSize: 13 }}>
                      This records the wallplate integration stage after combining it with ring-beam quantities. Later insulation and lath integrations can change the final live totals.
                    </p>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={th}>Summary line</th>
                            <th style={th}>Current qty</th>
                            <th style={th}>Proposed qty</th>
                            <th style={th}>Current order</th>
                            <th style={th}>Proposed order</th>
                            <th style={th}>Current chargeable</th>
                            <th style={th}>Proposed chargeable</th>
                            <th style={th}>Current weight</th>
                            <th style={th}>Proposed weight</th>
                            <th style={th}>Basis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["Steico 220 I-Joists", wallplateSummaryProposal.lines.steico],
                            ["9 mm Structural Ply", wallplateSummaryProposal.lines.ply9mm],
                            ["18 mm Structural Ply", wallplateSummaryProposal.lines.ply18mm],
                          ].map(([label, line]) => (
                            <tr key={label}>
                              <td style={td}><b>{label}</b></td>
                              <td style={td}>{round(line.currentQuantity, 3)} {line.unit}</td>
                              <td style={td}>{round(line.proposedQuantity, 3)} {line.unit}</td>
                              <td style={td}>{line.currentOrderQty ?? "—"}</td>
                              <td style={td}>{line.proposedOrderQty ?? "—"}</td>
                              <td style={td}>£{round(line.currentChargeableCost, 2).toFixed(2)}</td>
                              <td style={td}>£{round(line.proposedChargeableCost, 2).toFixed(2)}</td>
                              <td style={td}>{round(line.currentWeightKg, 2)} kg</td>
                              <td style={td}>{round(line.proposedWeightKg, 2)} kg</td>
                              <td style={td}>{line.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            )}

            {ringSchedule?.valid && (
              <section style={panel}>
                <h2 style={{ marginTop: 0 }}>Integration Audit — ring-beams</h2>
                <p style={{ color: "#92400e" }}>The audited ring-beam quantities now feed the live Hipped Lean-To Summary. The tables below retain the legacy comparison and ring-beam integration stage for reference.</p>

                <h3>Summary comparison</h3>
                <p style={{ marginTop: -6, color: "#64748b", fontSize: 13 }}>
                  The current Summary quantity is its existing external-width rule. The manufacture quantity includes every active ring-beam.
                </p>
                <div style={{ overflowX: "auto", marginBottom: 18 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={th}>Material</th>
                        <th style={th}>Current Summary</th>
                        <th style={th}>Manufacture-derived</th>
                        <th style={th}>Difference</th>
                        <th style={th}>Current stock qty</th>
                        <th style={th}>Manufacture stock qty</th>
                        <th style={th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={td}>30×90 PSE continuous ring-beam timber</td>
                        <td style={td}>{round(ringBeamIntegrationAudit?.currentSummaryQuantityM, 3)} m</td>
                        <td style={td}>{round(ringBeamIntegrationAudit?.manufactureQuantityM, 3)} m</td>
                        <td style={td}>
                          {ringBeamIntegrationAudit?.differenceM > 0 ? "+" : ""}
                          {round(ringBeamIntegrationAudit?.differenceM, 3)} m
                        </td>
                        <td style={td}>{ringBeamIntegrationAudit?.currentSummaryOrderQty ?? "—"}</td>
                        <td style={td}>{ringBeamIntegrationAudit?.manufactureOrderQty ?? "—"}</td>
                        <td style={{
                          ...td,
                          color: ringBeamIntegrationAudit?.status === "Match" ? "#166534" : "#92400e",
                          fontWeight: 700,
                        }}>
                          {ringBeamIntegrationAudit?.status || "Unavailable"}
                        </td>
                      </tr>
                      <tr>
                        <td style={td}>9 mm ply ring-beam base/soffit</td>
                        <td style={td}>{round(ringBeamPlyBaseIntegrationAudit?.currentSummaryQuantityM2, 3)} m²</td>
                        <td style={td}>{round(ringBeamPlyBaseIntegrationAudit?.manufactureQuantityM2, 3)} m²</td>
                        <td style={td}>
                          {ringBeamPlyBaseIntegrationAudit?.differenceM2 > 0 ? "+" : ""}
                          {round(ringBeamPlyBaseIntegrationAudit?.differenceM2, 3)} m²
                        </td>
                        <td style={td}>Combined 9 mm line</td>
                        <td style={td}>Pending combined audit</td>
                        <td style={{
                          ...td,
                          color: ringBeamPlyBaseIntegrationAudit?.status === "Match" ? "#166534" : "#92400e",
                          fontWeight: 700,
                        }}>
                          {ringBeamPlyBaseIntegrationAudit?.status || "Unavailable"}
                        </td>
                      </tr>
                      <tr>
                        <td style={td}>9 mm ply ring-beam upstands</td>
                        <td style={td}>{round(ringBeamPlyUpstandIntegrationAudit?.currentSummaryQuantityM2, 3)} m²</td>
                        <td style={td}>{round(ringBeamPlyUpstandIntegrationAudit?.manufactureQuantityM2, 3)} m²</td>
                        <td style={td}>
                          {ringBeamPlyUpstandIntegrationAudit?.differenceM2 > 0 ? "+" : ""}
                          {round(ringBeamPlyUpstandIntegrationAudit?.differenceM2, 3)} m²
                        </td>
                        <td style={td}>Combined 9 mm line</td>
                        <td style={td}>Pending combined audit</td>
                        <td style={{
                          ...td,
                          color: ringBeamPlyUpstandIntegrationAudit?.status === "Match" ? "#166534" : "#92400e",
                          fontWeight: 700,
                        }}>
                          {ringBeamPlyUpstandIntegrationAudit?.status || "Unavailable"}
                        </td>
                      </tr>
                      <tr>
                        <td style={td}>25×50 outer fixing lath</td>
                        <td style={td}>{round(ringBeamOuterLathIntegrationAudit?.currentSummaryQuantityM, 3)} m</td>
                        <td style={td}>{round(ringBeamOuterLathIntegrationAudit?.manufactureQuantityM, 3)} m</td>
                        <td style={td}>
                          {ringBeamOuterLathIntegrationAudit?.differenceM > 0 ? "+" : ""}
                          {round(ringBeamOuterLathIntegrationAudit?.differenceM, 3)} m
                        </td>
                        <td style={td}>Not currently included</td>
                        <td style={td}>Add manufacture total</td>
                        <td style={{
                          ...td,
                          color: ringBeamOuterLathIntegrationAudit?.status === "Match" ? "#166534" : "#92400e",
                          fontWeight: 700,
                        }}>
                          {ringBeamOuterLathIntegrationAudit?.status || "Unavailable"}
                        </td>
                      </tr>
                      <tr>
                        <td style={td}>25×50 upstand finishing pieces</td>
                        <td style={td}>{round(ringBeamFinishingLathIntegrationAudit?.currentSummaryQuantityM, 3)} m</td>
                        <td style={td}>{round(ringBeamFinishingLathIntegrationAudit?.manufactureQuantityM, 3)} m</td>
                        <td style={td}>
                          {ringBeamFinishingLathIntegrationAudit?.differenceM > 0 ? "+" : ""}
                          {round(ringBeamFinishingLathIntegrationAudit?.differenceM, 3)} m
                        </td>
                        <td style={td}>Combined 25×50 line</td>
                        <td style={td}>Pending combined audit</td>
                        <td style={{
                          ...td,
                          color: ringBeamFinishingLathIntegrationAudit?.status === "Match" ? "#166534" : "#92400e",
                          fontWeight: 700,
                        }}>
                          {ringBeamFinishingLathIntegrationAudit?.status || "Unavailable"}
                        </td>
                      </tr>
                      <tr>
                        <td style={td}>50 mm PIR to upstand faces</td>
                        <td style={td}>{round(ringBeamPirIntegrationAudit?.currentSummaryQuantityM2, 3)} m²</td>
                        <td style={td}>{round(ringBeamPirIntegrationAudit?.manufactureQuantityM2, 3)} m²</td>
                        <td style={td}>
                          {ringBeamPirIntegrationAudit?.differenceM2 > 0 ? "+" : ""}
                          {round(ringBeamPirIntegrationAudit?.differenceM2, 3)} m²
                        </td>
                        <td style={td}>Combined 50 mm PIR line</td>
                        <td style={td}>Pending combined audit</td>
                        <td style={{
                          ...td,
                          color: ringBeamPirIntegrationAudit?.status === "Match" ? "#166534" : "#92400e",
                          fontWeight: 700,
                        }}>
                          {ringBeamPirIntegrationAudit?.status || "Unavailable"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {ringBeamSummaryConsolidation?.valid && (
                  <>
                    <h3>Consolidated Summary comparison — integration stage</h3>
                    <p style={{ marginTop: -6, color: "#64748b", fontSize: 13 }}>
                      Costs shown include the configured material waste percentage. These validated ring-beam quantities are now combined with the audited wallplate assembly in the live Hipped Lean-To Summary.
                    </p>
                    <div style={{ overflowX: "auto", marginBottom: 18 }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={th}>Summary line</th>
                            <th style={th}>Current qty</th>
                            <th style={th}>Proposed qty</th>
                            <th style={th}>Current order</th>
                            <th style={th}>Proposed order</th>
                            <th style={th}>Current chargeable</th>
                            <th style={th}>Proposed chargeable</th>
                            <th style={th}>Current weight</th>
                            <th style={th}>Proposed weight</th>
                            <th style={th}>Basis</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["30×90 PSE", ringBeamSummaryConsolidation.lines.pse30x90],
                            ["9 mm Structural Ply", ringBeamSummaryConsolidation.lines.ply9mm],
                            ["25×50 laths", ringBeamSummaryConsolidation.lines.lath25x50],
                            ["50 mm PIR", ringBeamSummaryConsolidation.lines.pir50],
                          ].map(([label, line]) => (
                            <tr key={label}>
                              <td style={td}><b>{label}</b></td>
                              <td style={td}>{round(line.currentQuantity, 3)} {line.unit}</td>
                              <td style={td}>{round(line.proposedQuantity, 3)} {line.unit}</td>
                              <td style={td}>{line.currentOrderQty ?? "—"}</td>
                              <td style={td}>{line.proposedOrderQty ?? "—"}</td>
                              <td style={td}>£{round(line.currentChargeableCost, 2).toFixed(2)}</td>
                              <td style={td}>£{round(line.proposedChargeableCost, 2).toFixed(2)}</td>
                              <td style={td}>{round(line.currentWeightKg, 2)} kg</td>
                              <td style={td}>{round(line.proposedWeightKg, 2)} kg</td>
                              <td style={td}>{line.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><th style={th}>Ref</th><th style={th}>Beam</th><th style={th}>Internal</th><th style={th}>External</th><th style={th}>Base</th><th style={th}>Pitch</th><th style={th}>Soffit</th><th style={th}>VFC</th><th style={th}>Upstands</th><th style={th}>Clear bays</th></tr></thead>
                    <tbody>
                      {ringSchedule.members.map((member) => {
                        const beam = member.ringBeam;
                        return <tr key={member.id}>
                          <td style={td}><b>{member.manufactureRef}</b></td><td style={td}>{member.side} ring-beam</td>
                          <td style={td}>{round(beam.internalLengthMM)} mm</td><td style={td}>{round(beam.externalLengthMM)} mm</td>
                          <td style={td}>{round(beam.baseWidthMM, 1)} mm</td><td style={td}>{round(beam.eavesGeometry?.pitchDeg, 1)}°</td>
                          <td style={td}>{round(beam.eavesGeometry?.soffitDepthMM)} mm</td><td style={td}>{round(beam.eavesGeometry?.plumbCutHeightMM)} mm</td>
                          <td style={td}>{beam.upstandCount}</td><td style={td}>{(beam.bayWidthsMM || []).map((width) => round(width)).join(" / ")} mm</td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>

                <h3>Calculated component usage</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr><td style={td}>30×90 PSE continuous ring-beam timber</td><td style={td}>{round(ringSchedule.totals.pse30x90LengthM, 3)} m</td></tr>
                    <tr><td style={td}>9 mm ply base/soffit</td><td style={td}>{round(ringSchedule.totals.ply9BaseAreaM2, 3)} m²</td></tr>
                    <tr><td style={td}>9 mm ply upstands</td><td style={td}>{round(ringSchedule.totals.ply9UpstandAreaM2, 3)} m²</td></tr>
                    <tr><td style={td}>25×50 outer fixing lath</td><td style={td}>{round(ringSchedule.totals.outerFixingLath25x50LengthM, 3)} m</td></tr>
                    <tr><td style={td}>25×50 upstand finishing pieces</td><td style={td}>{round(ringSchedule.totals.finishingLath25x50LengthM, 3)} m</td></tr>
                    <tr><td style={td}>50 mm PIR to upstand faces</td><td style={td}>{round(ringSchedule.totals.pir50AreaM2, 3)} m²</td></tr>
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
