const finiteLength = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const makeEdge = ({
  id,
  kind,
  side,
  lengthMM,
  structuralLengthMM = null,
  terminalAngleDeg = null,
  facetIds = [],
}) => ({
  id,
  kind,
  side,
  lengthMM: finiteLength(lengthMM),
  structuralLengthMM:
    structuralLengthMM == null
      ? null
      : finiteLength(structuralLengthMM),
  terminalAngleDeg:
    terminalAngleDeg == null || !Number.isFinite(Number(terminalAngleDeg))
      ? null
      : Number(terminalAngleDeg),
  facetIds,
});

const facetTilingGeometry = (facet = {}) =>
  facet.tilingGeometry ??
  facet.geometry?.tiling ??
  facet.geometry?.tilingGeometry ??
  {};

const facetExternalEavesLengthMM = (facet = {}) =>
  facet.externalEavesLengthMM ?? facet.geometry?.externalEavesLengthMM;

const facetInternalEavesLengthMM = (facet = {}) =>
  facet.internalEavesLengthMM ?? facet.geometry?.internalEavesLengthMM;

const finishedHipBoundaryLengthMM = (facet = {}) => {
  const tiling = facetTilingGeometry(facet);
  const baseWidthMM = finiteLength(tiling.baseWidthMM);
  const topWidthMM = finiteLength(tiling.topWidthMM);
  const heightMM = finiteLength(tiling.heightMM);

  return Math.hypot(
    Math.max(0, baseWidthMM - topWidthMM),
    heightMM
  );
};

const resolveHipFlags = (roofInputs = {}, geometry = {}) => {
  const hasExplicitFlags =
    typeof roofInputs.leftHip === "boolean" ||
    typeof roofInputs.rightHip === "boolean";

  if (hasExplicitFlags) {
    return {
      left: roofInputs.leftHip === true,
      right: roofInputs.rightHip === true,
    };
  }

  const sides = roofInputs.hippedSides ?? geometry.hippedSides;

  return {
    left: sides === "left" || sides === "both",
    right: sides === "right" || sides === "both",
  };
};

const resolveWall = (roofInputs, side) => {
  const wallKey = `${side}Wall`;
  const legacyWallKey = `${side}_wall_present`;
  const exposedKey = `${side}_exposed`;

  if (typeof roofInputs[wallKey] === "boolean") return roofInputs[wallKey];
  if (typeof roofInputs[legacyWallKey] === "boolean") {
    return roofInputs[legacyWallKey];
  }
  if (typeof roofInputs[exposedKey] === "boolean") {
    return !roofInputs[exposedKey];
  }
  return false;
};

const resolveHipTerminalAngleDeg = ({
  roofInputs,
  geometry,
  sideFacet,
  side,
}) =>
  sideFacet?.terminalAngleDeg ??
  sideFacet?.externalCornerAngleDeg ??
  geometry?.[`${side}HipTerminalAngleDeg`] ??
  roofInputs?.[`${side}HipTerminalAngleDeg`] ??
  90;

const summariseEdges = (edges) =>
  edges.reduce((summary, edge) => {
    const current = summary[edge.kind] || { count: 0, lengthMM: 0 };
    summary[edge.kind] = {
      count: current.count + 1,
      lengthMM: current.lengthMM + edge.lengthMM,
    };
    return summary;
  }, {});

/**
 * Describe the physical roof-edge topology shared by accessories, reports and
 * manufacture outputs. This function deliberately does not calculate stock,
 * price, weight or product-specific quantities.
 */
export function buildRoofEdgeModel({ roofInputs = {}, geometry = null } = {}) {
  const roofStyle = roofInputs.roofStyle ?? roofInputs.roof_style ?? "leanTo";

  if (!geometry) {
    return {
      valid: false,
      roofStyle,
      edges: [],
      totalsByKind: {},
      errors: ["Roof geometry was not supplied."],
    };
  }

  const isHippedLeanTo = roofStyle === "hippedLeanTo";
  const hipFlags = resolveHipFlags(roofInputs, geometry);

  if (isHippedLeanTo && !hipFlags.left && !hipFlags.right) {
    return {
      valid: false,
      roofStyle,
      edges: [],
      totalsByKind: {},
      errors: ["Select at least one hip side for a Hipped Lean-To."],
    };
  }

  const mainFacet = geometry.frontFacet ?? geometry.mainFacet;
  const mainFacetId = mainFacet?.id ?? "facet-main";
  const sideBoundaryLengthMM = finiteLength(
    facetTilingGeometry(mainFacet).heightMM ??
      mainFacet?.externalSlopeLengthMM ??
      mainFacet?.geometry?.externalSlopeLengthMM ??
      geometry.externalSlopeLength
  );
  const frontEavesLengthMM = finiteLength(
    facetExternalEavesLengthMM(mainFacet) ??
      facetTilingGeometry(mainFacet).baseWidthMM ??
      geometry.externalWidthMM
  );
  const rearWallplateLengthMM = finiteLength(
    geometry.widthMM ?? facetInternalEavesLengthMM(mainFacet)
  );

  const edges = [
    makeEdge({
      id: "eaves-front",
      kind: "eaves",
      side: "front",
      lengthMM: frontEavesLengthMM,
      facetIds: [mainFacetId],
    }),
    makeEdge({
      id: "rear-wallplate",
      kind: "rearWallplate",
      side: "rear",
      lengthMM: rearWallplateLengthMM,
      facetIds: [mainFacetId],
    }),
  ];

  ["left", "right"].forEach((side) => {
    const hasHip = isHippedLeanTo && hipFlags[side];
    const sideFacet = geometry[`${side}Facet`];

    if (hasHip) {
      edges.push(
        makeEdge({
          id: `eaves-${side}`,
          kind: "eaves",
          side,
          lengthMM:
            facetExternalEavesLengthMM(sideFacet) ??
            geometry.externalProjectionMM,
          facetIds: sideFacet?.id ? [sideFacet.id] : [],
        }),
        makeEdge({
          id: `hip-${side}`,
          kind: "hip",
          side,
          lengthMM: finishedHipBoundaryLengthMM(sideFacet),
          structuralLengthMM: geometry[`${side}HipTrueLengthMM`],
          terminalAngleDeg: resolveHipTerminalAngleDeg({
            roofInputs,
            geometry,
            sideFacet,
            side,
          }),
          facetIds: [sideFacet?.id, mainFacetId].filter(Boolean),
        })
      );
      return;
    }

    const isWall = resolveWall(roofInputs, side);
    edges.push(
      makeEdge({
        id: `${isWall ? "wall-abutment" : "open-verge"}-${side}`,
        kind: isWall ? "wallAbutment" : "openVerge",
        side,
        lengthMM: sideBoundaryLengthMM,
        facetIds: [mainFacetId],
      })
    );
  });

  return {
    valid: true,
    roofStyle,
    edges,
    totalsByKind: summariseEdges(edges),
    errors: [],
  };
}
