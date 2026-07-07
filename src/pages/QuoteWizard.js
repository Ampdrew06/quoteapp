// src/pages/QuoteWizard.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import TradeLogin from "../TradeLogin";            // path adjusted (we are in src/pages/)
import logo from "../timberlite-logo-small.jpg";  // path adjusted

const roofDesigns = [
  "Lean-To",
  "Hipped Lean-To",
  "Gable",
  "Edwardian",
  "Victorian",
  "Double Hipped Edwardian",
  "Edwardian P-Shape",
  "Victorian P-Shape"
];

export default function QuoteWizard() { 
  const [tradeDiscount, setTradeDiscount] = useState(null);
  const navigate = useNavigate();

  // 🔹 Whenever we land on this page, start a fresh quote:
  //    - Clear stored Lean-To inputs, so Design/Options will use defaults
  //    - Also clear the tile system override so it defaults back to Britmet
  useEffect(() => {
    try {
      localStorage.removeItem("leanToInputs");
      localStorage.removeItem("tl_tile_system");   // 👈 NEW LINE
    } catch (e) {
      console.warn("Could not clear lean-to storage keys", e);
    }
  }, []);


  const handleRoofSelect = (design) => {
  const slug = design.toLowerCase().replace(/\s+/g, "-");

  if (slug === "lean-to") {
    navigate("/quote/lean-to", {
      state: { fresh: true, roofStyle: "leanTo" },
    });
    return;
  }

  if (slug === "hipped-lean-to") {
    navigate("/quote/lean-to", {
      state: {
        fresh: true,
        roofStyle: "hippedLeanTo",
        hippedSides: "both",
      },
    });
    return;
  }

  // Other designs use the placeholder route for now
  navigate(`/design/${slug}`);
};
const handleLogin = (discount) => {
  setTradeDiscount(discount);
};
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <img
        src={logo}
        alt="Timberlite Logo"
        style={{
          width: "100%",
          maxWidth: 400,
          marginBottom: 20,
          display: "block",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      />

      <h1 style={{ textAlign: "center" }}>
        Welcome to Timberlite Roof Quote App
      </h1>

      <TradeLogin onLogin={handleLogin} />


      <h2>Select a Roof Design</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {roofDesigns.map((design) => (
          <button
            key={design}
            onClick={() => handleRoofSelect(design)}
            style={{
              padding: "10px 20px",
              cursor: "pointer",
              borderRadius: 5,
              border: "1px solid #333",
              background: "#eee",
              flex: "1 1 45%",
              minWidth: 120,
            }}
          >
            {design}
          </button>
        ))}
      </div>

      {/*
<Link
  to="/geometry"
  style={{ display: "block", marginTop: 30, textAlign: "center" }}
>
  Go to Geometry & Material Calculator
</Link>
*/}
    </div>
  );
}
