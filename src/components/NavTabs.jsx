import "./AppPageLayout.css";
import {useRememberRoofNavigation,readRoofNavigation,roofFamilyFromPath} from '../lib/roofNavigation';
import GableNavigation from '../pages/gable/GableNavigation';
import EdwardianNavigation from '../pages/edwardian/EdwardianNavigation';
import VictorianNavigation from '../pages/victorian/VictorianNavigation';
import VictorianHippedNavigation from '../pages/victorian-hipped/VictorianHippedNavigation';
// src/components/NavTabs.jsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { isAdminUser, isTradeUser } from "../lib/userRole";

const publicTabsLeft = [
  { to: "/quote", label: "Home", exact: true },
  { to: "/quote/lean-to", label: "Design/Options", exact: true },
];

const adminTabsLeft = [
  ...publicTabsLeft,
  { to: "/quote/lean-to/plan-manufacture", label: "Manufacture Book" },
  { to: "/quote/lean-to/technical", label: "Technical" },
    {
    to: "/tiles-laths?mode=auto",
    label: "Tiles/Laths",
  },
  { to: "/idiot-list", label: "Idiot List" },
  { to: "/summary", label: "Summary" },
  { to: "/quotes", label: "Quotes" },
  { to: "/jobs", label: "Jobs" },
  { to: "/customers", label: "Customers" },
];

export default function NavTabs() {
  const {pathname}=useLocation();
  const routeFamily=roofFamilyFromPath(pathname);
  useRememberRoofNavigation(routeFamily);
  // Shared administration pages return to the roof being worked on.
  const shared=['/quotes','/jobs','/customers','/materials','/my-quotes'].some(p=>pathname===p||pathname.startsWith(p+'/'));
  const family=shared?readRoofNavigation():routeFamily;
  if(family==='gable')return <GableNavigation/>;
  if(family==='edwardian')return <EdwardianNavigation/>;
  if(family==='victorian-hipped')return <VictorianHippedNavigation/>;
  if(family==='victorian'||family==='victorian-five')return <VictorianNavigation five={family==='victorian-five'}/>;
  const tabsLeft = isAdminUser() ? adminTabsLeft : [...publicTabsLeft,...(isTradeUser()?[{to:"/my-quotes",label:"My Quotes"}]:[])];
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

        {/* Right-side: Print + Materials (Admin only) */}
{isAdminUser() && (
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
)}
      </div>
    </div>
  );
}
