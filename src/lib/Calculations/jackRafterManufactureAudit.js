import { calculateJackHipSetback } from "../geometry/hipPerimeterIntersection";
import { calculateJackRafterManufactureGeometry } from "../geometry/jackRafterManufactureGeometry";
import { buildHippedLeanToManufacturingSequence } from "../Manufacturing/manufacturingSequenceBuilder";

const finite = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const buildAuditJack = ({
  member,
  facetId,
  facetLabel,
  side,
  positionMM,
  pitchDeg,
  hipCentrelinePlanRunMM,
  horizontalFootCutMM,
  verticalFootCutMM,
  connection,
}) => {
  if(!connection?.valid) return null;
  const profile = calculateJackRafterManufactureGeometry({
    facetPitchDeg: pitchDeg,
    hipCentrelinePlanRunMM,
    hipCentrelineSetbackMM: connection.hipCentrelineSetbackMM,
    horizontalFootCutMM,
    verticalFootCutMM,
    timberDepthMM: 220,
  });

  if (!profile.valid) return null;
  profile.connectionGeometry = connection;

  return {
    id: member.id,
    facetId,
    facetLabel,
    side,
    positionMM: finite(positionMM),
    profile,
  };
};

export function buildJackRafterManufactureAudit({
  roofInputs = {},
  geometry = null,
} = {}) {
  const roofStyle = roofInputs.roofStyle || roofInputs.roof_style;

  if (roofStyle !== "hippedLeanTo" || !geometry) {
    return {
      valid: false,
      jacks: [],
      errors: ["A saved Hipped Lean-To geometry was not found."],
    };
  }

  const widthMM = finite(
    roofInputs.widthMM ?? roofInputs.internalWidthMM ?? geometry.widthMM
  );
  const projectionMM = finite(
    roofInputs.projMM ?? roofInputs.projectionMM ?? roofInputs.internalProjectionMM ?? geometry.projectionMM
  );
  const effectivePitchRunMM = finite(geometry.effectivePitchRunMM);
  const leftHipWidthMM = finite(geometry.resolvedLeftHipWidthMM);
  const rightHipWidthMM = finite(geometry.resolvedRightHipWidthMM);

  const connectionFor=(hipWidthMM,facet)=>calculateJackHipSetback({
    hipWidthRunMM:hipWidthMM,hipProjectionRunMM:projectionMM,facet,
  });
  if(projectionMM<=0 || effectivePitchRunMM<=0) return {valid:false,jacks:[],errors:["Positive projection and wallplate-face run are required."]};

  const frontPitchDeg = finite(geometry.frontPitchDeg);
  const leftPitchDeg = finite(geometry.leftSidePitchDeg);
  const rightPitchDeg = finite(geometry.rightSidePitchDeg);

  const frontHfcMM = finite(geometry.frontTemplateDebug?.horizontalFootRunMM);
  const frontVfcMM = finite(geometry.frontTemplateDebug?.plumbCutHeightMM);
  const leftHfcMM = finite(geometry.leftTemplateDebug?.horizontalFootRunMM);
  const leftVfcMM = finite(geometry.leftTemplateDebug?.plumbCutHeightMM);
  const rightHfcMM = finite(geometry.rightTemplateDebug?.horizontalFootRunMM);
  const rightVfcMM = finite(geometry.rightTemplateDebug?.plumbCutHeightMM);
  const memberById =
    buildHippedLeanToManufacturingSequence(geometry).memberById;

  const jacks = [];

  (geometry.frontRafterLayoutV2?.leftJackRafters || []).forEach((member) => {
    const centreMM = finite(member.centreMM);
    // Front cut profiles use the verified wallplate-face pitch run, as do
    // plain/boss rafters; their lower-edge datum is not the house-wall line.
    const intersectionRunMM =
      leftHipWidthMM > 0
        ? effectivePitchRunMM * (centreMM / leftHipWidthMM)
        : 0;

    const jack = buildAuditJack({
      member,
      facetId: "F2",
      facetLabel: "Front Facet",
      side: "left",
      positionMM: centreMM,
      pitchDeg: frontPitchDeg,
      connection:connectionFor(leftHipWidthMM,'front'),
      hipCentrelinePlanRunMM: intersectionRunMM,
      horizontalFootCutMM: frontHfcMM,
      verticalFootCutMM: frontVfcMM,
    });
    if (jack) {
      jack.manufactureRef = memberById[jack.id]?.manufactureRef ?? null;
      jacks.push(jack);
    }
  });

  (geometry.frontRafterLayoutV2?.rightJackRafters || []).forEach((member) => {
    const centreMM = finite(member.centreMM);
    const distanceFromRightMM = widthMM - centreMM;
    const intersectionRunMM =
      rightHipWidthMM > 0
        ? effectivePitchRunMM * (distanceFromRightMM / rightHipWidthMM)
        : 0;

    const jack = buildAuditJack({
      member,
      facetId: "F2",
      facetLabel: "Front Facet",
      side: "right",
      positionMM: centreMM,
      pitchDeg: frontPitchDeg,
      connection:connectionFor(rightHipWidthMM,'front'),
      hipCentrelinePlanRunMM: intersectionRunMM,
      horizontalFootCutMM: frontHfcMM,
      verticalFootCutMM: frontVfcMM,
    });
    if (jack) {
      jack.manufactureRef = memberById[jack.id]?.manufactureRef ?? null;
      jacks.push(jack);
    }
  });

  const addSideJacks = ({
    members,
    facetId,
    facetLabel,
    side,
    hipWidthMM,
    pitchDeg,
    hfcMM,
    vfcMM,
    makeMemberId,
  }) => {
    (members || []).forEach((member, index) => {
      const centreFromWallMM = finite(member.centreMM);
      const distanceFromFrontMM = Math.max(
        0,
        projectionMM - centreFromWallMM
      );
      // Side positions are distances from the house wall along the full
      // internal projection. Do not divide that full-plan distance by the
      // shortened front wallplate-face run (the former proportional error).
      const intersectionRunMM =
        projectionMM > 0
          ? hipWidthMM * (distanceFromFrontMM / projectionMM)
          : 0;

      const jack = buildAuditJack({
        member: {
          ...member,
          id: makeMemberId(member, index),
        },
        facetId,
        facetLabel,
        side,
        positionMM: centreFromWallMM,
        pitchDeg,
        connection:connectionFor(hipWidthMM,'side'),
        hipCentrelinePlanRunMM: intersectionRunMM,
        horizontalFootCutMM: hfcMM,
        verticalFootCutMM: vfcMM,
      });
      if (jack) {
        jack.manufactureRef = memberById[jack.id]?.manufactureRef ?? null;
        jacks.push(jack);
      }
    });
  };

  addSideJacks({
    members: geometry.leftSideRingBeamLayout?.intermediateJackRafters,
    facetId: "F1",
    facetLabel: "Left Side Facet",
    side: "left",
    hipWidthMM: leftHipWidthMM,
    pitchDeg: leftPitchDeg,
    hfcMM: leftHfcMM,
    vfcMM: leftVfcMM,
    makeMemberId: (member, index) =>
      `left-side-jack-${Math.round(finite(member?.centreMM))}-${index}`,
  });

  addSideJacks({
    members: geometry.rightSideRingBeamLayout?.intermediateJackRafters,
    facetId: "F3",
    facetLabel: "Right Side Facet",
    side: "right",
    hipWidthMM: rightHipWidthMM,
    pitchDeg: rightPitchDeg,
    hfcMM: rightHfcMM,
    vfcMM: rightVfcMM,
    makeMemberId: (member, index) =>
      `right-side-jack-${Math.round(finite(member?.centreMM))}-${index}`,
  });

  const orderedJacks = jacks.sort((a, b) => {
    const facetOrder = { F1: 1, F2: 2, F3: 3 };
    return (
      (facetOrder[a.facetId] || 9) - (facetOrder[b.facetId] || 9) ||
      a.positionMM - b.positionMM
    );
  });

  return {
    valid: orderedJacks.length > 0,
    jacks: orderedJacks,
    setbackMM: null,
    closestCornerGapMM:5,
    setbackRule:"hip-face-plus-square-jack-end",
    referenceRule:"front-wallplate-face-profile / side-full-internal-plan",
    errors:
      orderedJacks.length > 0
        ? []
        : ["No automatically positioned jack rafters were found."],
  };
}
