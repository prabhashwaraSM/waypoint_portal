import React, { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import { ClipboardList, Navigation, RefreshCw } from "lucide-react";
import { loadFleet } from "../../data/fleetStore";
import "./fleet.css";

export default function FleetLayout() {
  const parent = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const d = await loadFleet();
      setData(d);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Fleet data could not be loaded. Check that the CSV files are in the public folder.");
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const vehicles = data?.vehicles || [];
  const counts = {
    total: vehicles.length,
    attention: vehicles.filter((v) => v.condition === "Needs attention").length,
    shop: vehicles.filter((v) => v.inWorkshop).length
  };

  return (
    <div className="fl-page">
      <div className="fl-heading">
        <div>
          <h1>Fleet & Tracking</h1>
          <p>
            {data
              ? `${counts.total} vehicles, ${counts.shop} in workshop, ${counts.attention} needing attention`
              : "Loading fleet records…"}
          </p>
        </div>
        <nav className="fl-subnav" aria-label="Fleet sections">
          <NavLink to="/fleet/vehicles" className={({ isActive }) => `fl-subnav-link ${isActive ? "active" : ""}`}>
            <ClipboardList size={17} /> Vehicle Information
          </NavLink>
          <NavLink to="/fleet/tracking" className={({ isActive }) => `fl-subnav-link ${isActive ? "active" : ""}`}>
            <Navigation size={17} /> Vehicle Tracking
          </NavLink>
        </nav>
      </div>

      {error && <div className="fl-empty">{error}</div>}
      {!data && !error && (
        <div className="fl-loading">
          <RefreshCw size={22} className="fl-spin" /> Loading vehicles, fuel, maintenance and inspection records…
        </div>
      )}
      {data && <Outlet context={{ ...parent, fleet: data, reloadFleet: reload }} />}
    </div>
  );
}
