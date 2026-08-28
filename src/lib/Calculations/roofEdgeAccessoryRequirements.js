const finite = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

const productFamily = (tileSystem) => {
  const normalized = String(tileSystem || "britmet")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  return normalized.includes("slate") || normalized.includes("tapco")
    ? "syntheticSlate"
    : "steelShingle";
};

const requirement = (key, edgeKind, edges) => ({
  key,
  edgeKind,
  edgeIds: edges.map((edge) => edge.id),
  edgeCount: edges.length,
  totalLengthMM: edges.reduce(
    (total, edge) => total + finite(edge.lengthMM),
    0
  ),
  edges: edges.map((edge) => ({
    edgeId: edge.id,
    side: edge.side,
    lengthMM: finite(edge.lengthMM),
  })),
});

/**
 * Map physical roof edges to raw accessory requirements.
 *
 * This layer owns no stock lengths, rounding, price or weight. It only states
 * which classified edges require each accessory and their finished lengths.
 */
export function buildRoofEdgeAccessoryRequirements({
  edgeModel = null,
  tileSystem = "britmet",
} = {}) {
  if (!edgeModel?.valid) {
    return {
      valid: false,
      productFamily: productFamily(tileSystem),
      requirements: {},
      errors: edgeModel?.errors || ["A valid roof-edge model was not supplied."],
    };
  }

  const edges = edgeModel.edges || [];
  const eaves = edges.filter((edge) => edge.kind === "eaves");
  const hips = edges.filter((edge) => edge.kind === "hip");
  const openVerges = edges.filter((edge) => edge.kind === "openVerge");
  const wallAbutments = edges.filter(
    (edge) => edge.kind === "wallAbutment"
  );
  const family = productFamily(tileSystem);

  const requirements = {
    tileStarter: requirement("tileStarter", "eaves", eaves),
    gutter: requirement("gutter", "eaves", eaves),
    hipCovering: requirement("hipCovering", "hip", hips),
    watercourse: requirement(
      "watercourse",
      "wallAbutment",
      wallAbutments
    ),
  };

  if (family === "syntheticSlate") {
    requirements.dryVerge = requirement(
      "dryVerge",
      "openVerge",
      openVerges
    );
  } else {
    requirements.twoPartBarge = requirement(
      "twoPartBarge",
      "openVerge",
      openVerges
    );
  }

  return {
    valid: true,
    productFamily: family,
    requirements,
    errors: [],
  };
}

