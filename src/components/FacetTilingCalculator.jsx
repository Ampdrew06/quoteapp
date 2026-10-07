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
    label: `F${index + 1}`,
    baseWidthMM: "",
    topWidthMM: "",
    heightMM: "",
    topEdgeType: "none",
  };
}

const lathKindLabels = {
  chamferedPerimeter: "Chamfered perimeter lath",
  tileFixing: "Tile fixing lath",
  eavesSupport: "Eaves support lath",
  slateCourse: "Slate fixing lath",
  ridgeFinishing: "Ridge finishing lath",
};

export function RoofTilingTotals({ result, itemWord }) {
  if (!result) return null;

  return (
    <section
      style={{
        marginBottom: 18,
        padding: 16,
        borderRadius: 7,
        background: "#dbeafe",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Roof totals</h3>

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
          {result.facetAreaM2.toFixed(3)} m²
        </div>

        <div>
          <strong>Total lath</strong>
          <br />
          {(result.lathLengthMM / 1000).toFixed(3)} m
        </div>

        <div>
          <strong>Raw {itemWord}</strong>
          <br />
          {result.tileQuantityRaw.toFixed(4)}
        </div>

        <div>
          <strong>Provisional order</strong>
          <br />
          {result.tileQuantityOrdered} {itemWord}
          <div style={{fontSize:13,marginTop:4}}>{result.tileQuantityRounded} rounded + {result.orderAllowanceTiles} allowance</div>
        </div>

        <div>
          <strong>Total fixings</strong>
          <br />
          {result.fixingQuantity}
        </div>
      </div>
    </section>
  );
}

export function LathScheduleTable({ result, facetNumber }) {
  const rows = result?.lathRows || [];
  const hasOpeningDeductions = rows.some(
    (row) => Number(row.openingDeductionMM) > 0
  );

  if (rows.length === 0) return null;

  const cellStyle = {
    padding: "7px 9px",
    borderBottom: "1px solid #dbeafe",
    textAlign: "left",
    whiteSpace: "nowrap",
  };

  return (
    <details
      className="lath-schedule"
      style={{ marginTop: 14 }}
    >
      <summary
        style={{
          marginBottom: 8,
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Lath schedule ({rows.length} rows)
      </summary>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
          }}
        >
          <thead>
            <tr style={{ background: "#e0f2fe" }}>
              <th style={cellStyle}>Lath ID</th>
              <th style={cellStyle}>Type</th>
              <th style={cellStyle}>Position from eaves</th>
              {hasOpeningDeductions && (
                <th style={cellStyle}>Gross length</th>
              )}
              {hasOpeningDeductions && (
                <th style={cellStyle}>Opening deduction</th>
              )}
              <th style={cellStyle}>
                {hasOpeningDeductions
                  ? "Net lath required"
                  : "Finished length"}
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr key={`${facetNumber}-${row.index}-${row.yMM}`}>
                <td style={cellStyle}>
                  <strong>
                    F{facetNumber}-L{index + 1}
                  </strong>
                </td>
                <td style={cellStyle}>
                  {lathKindLabels[row.kind] || "Fixing lath"}
                </td>
                <td style={cellStyle}>
                  {row.setOutOnSite
                    ? "Set out at ridge"
                    : `${Math.round(row.yMM)} mm`}
                </td>
                {hasOpeningDeductions && (
                  <td style={cellStyle}>
                    {Math.round(
                      row.grossWidthMM ?? row.widthMM
                    )}{" "}
                    mm
                  </td>
                )}
                {hasOpeningDeductions && (
                  <td style={cellStyle}>
                    {Math.round(row.openingDeductionMM || 0)} mm
                  </td>
                )}
                <td style={cellStyle}>
                  {Math.round(row.widthMM)} mm
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasOpeningDeductions && (
        <p style={{ margin: "8px 0 0", color: "#555" }}>
          A net figure may represent separate lath pieces on either
          side of a roof opening; individual opening-side cuts will be
          detailed by the future manufacture cutting list.
        </p>
      )}
    </details>
  );
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

        facets: facets.map((facet, index) => ({
          ...facet,

          id: `facet-${index + 1}`,
          label: `F${index + 1}`,

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

      {allFacetsValid && (
        <RoofTilingTotals
          result={roofResult}
          itemWord={itemWord}
        />
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
              className="tiling-facet-result"
              key={facet.id}
              style={{
                padding: 14,
                border: "1px solid #93c5fd",
                borderRadius: 7,
                background: "#fff",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                F{index + 1} — Facet {index + 1}
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

                {isSyntheticSlate && (
                  <label>
                    Top edge finishes at
                    <select
                      value={facet.topEdgeType}
                      onChange={(event) =>
                        updateFacet(
                          index,
                          "topEdgeType",
                          event.target.value
                        )
                      }
                      style={fieldStyle}
                    >
                      <option value="none">
                        Other / no ridge course
                      </option>
                      <option value="ridge">Ridge</option>
                      <option value="wallAbutment">
                        Wall / abutment
                      </option>
                      <option value="hipOrApex">
                        Hip or apex
                      </option>
                    </select>
                  </label>
                )}
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
                  <strong>Total lath</strong>
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
                <LathScheduleTable
                  result={result}
                  facetNumber={index + 1}
                />
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

      <style>{`
        @media print {
          .tiling-facet-result {
            break-inside: avoid-page;
            page-break-inside: avoid;
          }
          .lath-schedule > summary { display: none; }
          .lath-schedule > *:not(summary) { display: block !important; }
          .lath-schedule table,
          .lath-schedule tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

    </section>
  );
}
