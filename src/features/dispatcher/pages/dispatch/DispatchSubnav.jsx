import React from "react";
import { NavLink } from "react-router-dom";
import { Truck, CalendarClock } from "lucide-react";
import "../../styles/fleet.css";

// Sub-page switcher shared by the two Dispatch sub-pages (same look as Fleet & Tracking).
export default function DispatchSubnav() {
  return (
    <nav className="fl-subnav" aria-label="Dispatch sections">
      <NavLink to="/dispatch/plan" className={({ isActive }) => `fl-subnav-link ${isActive ? "active" : ""}`}>
        <Truck size={17} /> Dispatch Planning
      </NavLink>
      <NavLink to="/dispatch/shortages" className={({ isActive }) => `fl-subnav-link ${isActive ? "active" : ""}`}>
        <CalendarClock size={17} /> Shortages & Delays
      </NavLink>
    </nav>
  );
}
