// src/app/routes.js

import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import QuoteWizard from "../pages/QuoteWizard";
import LeanToLanding from "../pages/lean-to/LeanToLanding";
import LeanToPlanManufacture from "../pages/lean-to/LeanToPlanManufacture";
//import GeometryPage from "../GeometryPage";
import Materials from "../pages/Materials";
//import LeanToPlan from "../styles/LeanToPlan"; // (optional) simple plan page
import TilesLaths from "../pages/TilesLaths"; // ✅ NEW: Tiles & Laths manual calculator
import IdiotList from "../pages/IdiotList";
import Quotes from "../pages/Quotes";
import Summary from "../pages/Summary";
//import { Link } from "react-router-dom";

// Simple inline placeholder so /design/:design won't 404 while we build pages
function DesignPlaceholder() {
  const { design } = useParams();
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2>{(design || "").replace(/-/g, " ")} — coming soon</h2>
      <p>For now, only Lean-To has its own dedicated page.</p>
      <a href="/quote">← Back to Styles</a>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default redirect to /quote */}
        <Route path="/" element={<Navigate to="/quote" replace />} />

        <Route path="/summary" element={<Summary />} />


        {/* Quote style grid */}
        <Route path="/quote" element={<QuoteWizard />} />

        {/* Lean-To main configurator */}
        <Route path="/quote/lean-to" element={<LeanToLanding />} />

        {/* Combined Plan + Manufacture (print-ready) */}
        <Route path="/quote/lean-to/plan-manufacture" element={<LeanToPlanManufacture />} />

        {/* (Optional) keep the simple plan page if you still link to it */}
        {/* <Route path="/quote/lean-to/plan" element={<LeanToPlan />} /> */}

        {/* Geometry scratch page */}
      {/* <Route path="/geometry" element={<GeometryPage />} /> */}

        {/* Materials (localStorage-backed) */}
        <Route path="/materials" element={<Materials />} />

        {/* Tiles & Laths manual calculator */}
        <Route path="/tiles-laths" element={<TilesLaths />} />

        {/* Placeholder for other designs */}
        <Route path="/design/:design" element={<DesignPlaceholder />} />
        <Route path="/idiot-list" element={<IdiotList />} />
        {/* Catch-all → /quote */}
        <Route path="*" element={<Navigate to="/quote" replace />} />
        <Route path="/quotes" element={<Quotes />} />

      </Routes>
    </BrowserRouter>
  );
}
