// src/components/NavTabs.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const tabsLeft = [
  { to: "/quote", label: "Home", exact: true },
   { to: "/quote/lean-to", label: "Design/Options", exact: true },
  { to: "/quote/lean-to/plan-manufacture", label: "Manufacture Book" },
  // { to: "/quote/lean-to/tiles-laths", label: "Tiles & Laths" },
  { to: "/idiot-list", label: "Idiot List" },
  { to: "/summary", label: "Summary" },
  { to: "/quotes", label: "Quotes" },
];

export default function NavTabs() {
  return (
    <div className="print:hidden nav-strip">
      <div className="nav-inner">
        {/* Left-side tabs */}
        <div className="nav-tabs-left">
          {tabsLeft.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.exact}
              className={({ isActive }) =>
                "nav-tab" + (isActive ? " nav-tab-active" : "")
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        {/* Right-side: Print + Materials */}
        <div className="nav-tabs-right">
          <button
            type="button"
            onClick={() => window.print()}
            className="nav-tab nav-tab-ghost"
          >
            Print
          </button>

          <NavLink
            to="/materials"
            className={({ isActive }) =>
              "nav-tab" + (isActive ? " nav-tab-active" : "")
            }
          >
            Materials
          </NavLink>
        </div>
      </div>
    </div>
  );
}
