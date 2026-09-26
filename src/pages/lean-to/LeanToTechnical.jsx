import React, { useMemo } from "react";
import NavTabs from "../../components/NavTabs";
import TemplateGeometryVisualizer from "../../components/TemplateGeometryVisualizer";
import WallplateGeometryVisualizer from "../../components/WallplateGeometryVisualizer";
import HippedWallplateFrontVisualizer from "../../components/HippedWallplateFrontVisualizer";
import { getMaterials } from "../../lib/materials";
import { buildAutomaticRoofTiling } from "../../lib/Calculations/automaticRoofTiling";
import { buildAutomaticRoofEdgeBOM } from "../../lib/Calculations/automaticRoofEdgeBOM";
import { buildHipManufactureAudit } from "../../lib/Calculations/hipManufactureAudit";
import { buildJackRafterManufactureAudit } from "../../lib/Calculations/jackRafterManufactureAudit";
import { buildHippedLeanToRingBeamSchedule } from "../../lib/Manufacturing/ringBeamManufactureSchedule";
import { buildLeanToTotals } from "../../lib/leanToTotals";

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

            <HippedWallplateFrontVisualizer
              internalWidthMM={geometry.widthMM}
              leftHipPositionMM={geometry.resolvedLeftHipWidthMM}
              rightHipPositionMM={geometry.resolvedRightHipWidthMM}
              leftSidePitchDeg={geometry.leftSidePitchDeg}
              rightSidePitchDeg={geometry.rightSidePitchDeg}
              internalWallplateHeightMM={geometry.designInternalWallplateHeightMM}
              externalWallplateHeightMM={geometry.designExternalWallplateHeightMM}
              wallplateSectionHeightMM={geometry.wallplateHeightMM ?? 220}
              leftWallBarFootRunMM={geometry.leftTemplateDebug?.horizontalFootRunMM ?? 0}
              rightWallBarFootRunMM={geometry.rightTemplateDebug?.horizontalFootRunMM ?? geometry.leftTemplateDebug?.horizontalFootRunMM ?? 0}
              leftWallBarVerticalFootCutMM={geometry.leftPlumbCutHeightMM}
              rightWallBarVerticalFootCutMM={geometry.rightPlumbCutHeightMM}
              externalWidthMM={geometry.externalWidthMM}
              leftExternalAllowanceMM={geometry.leftExternalAllowanceMM}
              rightExternalAllowanceMM={geometry.rightExternalAllowanceMM}
            />

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

            {ringSchedule?.valid && (
              <section style={panel}>
                <h2 style={{ marginTop: 0 }}>Integration Audit — ring-beams</h2>
                <p style={{ color: "#92400e" }}>Read only. These quantities do not yet replace Summary pricing.</p>
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
