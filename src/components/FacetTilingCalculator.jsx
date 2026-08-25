import React, { useMemo, useState } from "react";
import { calculateRoofTiling } from "../lib/Calculations/facetTilingCalc";

const fieldStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "7px 8px",
};

function createBlankFacet(index) {
  return {
    id: `facet-${index + 1}`,
    label: `S${index + 1}`,
    baseWidthMM: "",
    topWidthMM: "",
    heightMM: "",
  };
}

export default function FacetTilingCalculator() {
  const [productId, setProductId] =
    useState("britmetShingle");

  const [overallPitchDeg, setOverallPitchDeg] =
    useState("20");

  const [facetCount, setFacetCount] = useState(1);

  const [facets, setFacets] = useState([
    createBlankFacet(0),
  ]);

  const isSyntheticSlate =
    productId === "liteSlate" ||
    productId === "tapcoSlate";

  const itemWord = isSyntheticSlate
    ? "slates"
    : "tiles";

  const changeFacetCount = (event) => {
    const requestedCount = Math.max(
      1,
      Math.min(20, Number(event.target.value) || 1)
    );

    setFacetCount(requestedCount);

    setFacets((current) =>
      Array.from(
        { length: requestedCount },
        (_, index) =>
          current[index] || createBlankFacet(index)
      )
    );
  };

  const updateFacet = (index, key, value) => {
    setFacets((current) =>
      current.map((facet, facetIndex) =>
        facetIndex === index
          ? {
              ...facet,
              [key]: value,
            }
          : facet
      )
    );
  };

  const clearAllFacets = () => {
    setFacets(
      Array.from(
        { length: facetCount },
        (_, index) => createBlankFacet(index)
      )
    );
  };

  const roofResult = useMemo(
    () =>
      calculateRoofTiling({
        product: productId,

        facets: facets.map((facet) => ({
          ...facet,

          baseWidthMM:
            facet.baseWidthMM === ""
              ? null
              : Number(facet.baseWidthMM),

          topWidthMM:
            facet.topWidthMM === ""
              ? null
              : Number(facet.topWidthMM),

          heightMM:
            facet.heightMM === ""
              ? null
              : Number(facet.heightMM),

          pitchDeg: isSyntheticSlate
            ? Number(overallPitchDeg)
            : null,
        })),
      }),
    [
      productId,
      facets,
      isSyntheticSlate,
      overallPitchDeg,
    ]
  );

  const allFacetsValid =
    roofResult.facets.length > 0 &&
    roofResult.facets.every(
      (result) => result.errors.length === 0
    );

  const firstValidResult =
    roofResult.facets.find(
      (result) => result.errors.length === 0
    ) || null;

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        border: "2px solid #2563eb",
        borderRadius: 8,
        background: "#eff6ff",
      }}
    >
      <h2 style={{ marginTop: 0 }}>
        Multi-Facet Tile Calculator
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <label>
          Tile system
          <select
            value={productId}
            onChange={(event) =>
              setProductId(event.target.value)
            }
            style={fieldStyle}
          >
            <option value="britmetShingle">
              Britmet Shingle
            </option>

            <option value="metrotileShingle">
              Metrotile Shingle
            </option>

            <option value="liteSlate">
              LiteSlate
            </option>

            <option value="tapcoSlate">
              TapcoSlate
            </option>
          </select>
        </label>

        {isSyntheticSlate && (
          <label>
            Overall roof pitch (degrees)
            <input
              type="number"
              min="0"
              step="0.1"
              value={overallPitchDeg}
              onChange={(event) =>
                setOverallPitchDeg(
                  event.target.value
                )
              }
              style={fieldStyle}
            />
          </label>
        )}

        <label>
          How many facets?
          <input
            type="number"
            min="1"
            max="20"
            value={facetCount}
            onChange={changeFacetCount}
            style={fieldStyle}
          />
        </label>
      </div>

      {isSyntheticSlate &&
        firstValidResult?.pitchRule && (
          <div
            style={{
              marginBottom: 16,
              padding: 10,
              borderRadius: 6,
              background: "#e0f2fe",
            }}
          >
            <strong>
              Selected pitch rule:
            </strong>{" "}
            {firstValidResult.pitchRule.gaugeMM} mm
            gauge ·{" "}
            {
              firstValidResult.pitchRule
                .slatesPerM2
            }{" "}
            slates/m²
          </div>
        )}

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {facets.map((facet, index) => {
          const result =
            roofResult.facets[index];

          const isValid =
            result &&
            result.errors.length === 0;

          return (
            <article
              key={facet.id}
              style={{
                padding: 14,
                border: "1px solid #93c5fd",
                borderRadius: 7,
                background: "#fff",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Facet {index + 1}
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 10,
                }}
              >
                <label>
                  Facet label
                  <input
                    type="text"
                    value={facet.label}
                    onChange={(event) =>
                      updateFacet(
                        index,
                        "label",
                        event.target.value
                      )
                    }
                    style={fieldStyle}
                  />
                </label>

                <label>
                  Bottom edge (mm)
                  <input
                    type="number"
                    min="1"
                    value={facet.baseWidthMM}
                    onChange={(event) =>
                      updateFacet(
                        index,
                        "baseWidthMM",
                        event.target.value
                      )
                    }
                    style={fieldStyle}
                  />
                </label>

                <label>
                  Top edge (mm)
                  <input
                    type="number"
                    min="0"
                    value={facet.topWidthMM}
                    onChange={(event) =>
                      updateFacet(
                        index,
                        "topWidthMM",
                        event.target.value
                      )
                    }
                    style={fieldStyle}
                  />
                </label>

                <label>
                  Height (mm)
                  <input
                    type="number"
                    min="1"
                    value={facet.heightMM}
                    onChange={(event) =>
                      updateFacet(
                        index,
                        "heightMM",
                        event.target.value
                      )
                    }
                    style={fieldStyle}
                  />
                </label>
              </div>

              {!isValid ? (
                <div
                  style={{
                    marginTop: 10,
                    color: "#991b1b",
                  }}
                >
                  {result?.errors.map(
                    (error, errorIndex) => (
                      <div
                        key={`${errorIndex}-${error}`}
                      >
                        {error}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 8,
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 6,
                    background: "#f8fafc",
                  }}
                >
                  <div>
                    <strong>Area</strong>
                    <br />
                    {result.facetAreaM2.toFixed(3)} m²
                  </div>

                  <div>
                    <strong>Lath rows</strong>
                    <br />
                    {result.lathRows.length}
                  </div>

                  <div>
                    <strong>Lath</strong>
                    <br />
                    {(
                      result.lathLengthMM / 1000
                    ).toFixed(3)}{" "}
                    m
                  </div>

                  <div>
                    <strong>
                      Raw {itemWord}
                    </strong>
                    <br />
                    {result.tileQuantityRaw.toFixed(
                      4
                    )}
                  </div>

                  
                </div>
              )}

              {isValid && (
                <p
                  style={{
                    marginBottom: 0,
                    overflowWrap: "anywhere",
                  }}
                >
                  <strong>
                    Lath positions:
                  </strong>{" "}
                  {result.lathRows
                    .map((row) => row.yMM)
                    .join(", ")}{" "}
                  mm
                </p>
              )}
            </article>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: 14,
        }}
      >
        <button
          type="button"
          onClick={clearAllFacets}
          style={{
            padding: "8px 14px",
            cursor: "pointer",
          }}
        >
          Clear facet dimensions
        </button>
      </div>

      {allFacetsValid && (
        <section
          style={{
            marginTop: 18,
            padding: 16,
            borderRadius: 7,
            background: "#dbeafe",
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Roof totals
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
            }}
          >
            <div>
              <strong>Total area</strong>
              <br />
              {roofResult.facetAreaM2.toFixed(3)} m²
            </div>

            <div>
              <strong>Total lath</strong>
              <br />
              {(
                roofResult.lathLengthMM / 1000
              ).toFixed(3)}{" "}
              m
            </div>

            <div>
              <strong>
                Raw {itemWord}
              </strong>
              <br />
              {roofResult.tileQuantityRaw.toFixed(4)}
            </div>

            <div>
              <strong>
                Provisional order
              </strong>
              <br />
              {roofResult.tileQuantityOrdered}{" "}
              {itemWord}
            </div>

            <div>
              <strong>Total fixings</strong>
              <br />
              {roofResult.fixingQuantity}
            </div>
          </div>
        </section>
      )}
    </section>
  );
}