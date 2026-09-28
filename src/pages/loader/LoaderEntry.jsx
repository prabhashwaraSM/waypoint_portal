import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LogOut,
  PackageCheck,
  ShieldCheck,
  Truck,
  Warehouse
} from "lucide-react";
import Logo from "../../components/Logo";
import { getSession, logout } from "../../auth/auth";
import "./loader.css";

const previewTrips = [
  { vehicle: "VEH014", brand: "Fresh", route: "Colombo • Trip 1", type: "Reefer", stops: 6, volume: 68, status: "Loading" },
  { vehicle: "VEH021", brand: "Style", route: "Kandy • Trip 1", type: "Ambient", stops: 5, volume: 45, status: "Waiting" },
  { vehicle: "VEH032", brand: "Fresh", route: "Negombo • Trip 2", type: "Reefer", stops: 8, volume: 85, status: "Ready" }
];

export default function LoaderEntry() {
  const navigate = useNavigate();
  const session = getSession();

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="loader-entry-shell">
      <aside className="loader-entry-sidebar">
        <Logo size={38} product="Loader" subtitle="Warehouse Operations" accent="#f8c20a" />
        <div className="loader-role-pill"><ShieldCheck size={13} /> Role: <b>Loader</b></div>

        <nav>
          <button className="active"><ClipboardList size={18} /> Loading Plan</button>
          <button disabled><PackageCheck size={18} /> Load Sequence</button>
          <button disabled><Boxes size={18} /> Inventory</button>
        </nav>

        <div className="loader-user">
          <div className="loader-avatar">WL</div>
          <div><strong>{session?.name || "Warehouse Loader"}</strong><small>{session?.depot || "Peliyagoda"} depot</small></div>
          <button onClick={signOut} title="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>

      <main className="loader-entry-main">
        <header>
          <div>
            <span className="loader-kicker">WAREHOUSE DELIVERY PLANNING</span>
            <h1>Today's Loading Plan</h1>
            <p>The Loader workspace is connected. The detailed loading screens will be added in the next UI step.</p>
          </div>
          <div className="loader-entry-date"><Clock3 size={17} /> UI prototype</div>
        </header>

        <section className="loader-stat-grid">
          <article><span className="loader-stat-icon blue"><Truck size={20} /></span><div><strong>12</strong><small>Vehicles</small></div></article>
          <article><span className="loader-stat-icon green"><Boxes size={20} /></span><div><strong>38</strong><small>Orders</small></div></article>
          <article><span className="loader-stat-icon amber"><Warehouse size={20} /></span><div><strong>8</strong><small>Routes</small></div></article>
          <article><span className="loader-stat-icon purple"><CheckCircle2 size={20} /></span><div><strong>4</strong><small>Loading</small></div></article>
        </section>

        <section className="loader-preview-panel">
          <div className="loader-preview-head">
            <div><h2>Vehicles & Trips</h2><p>UI preview using mock data only.</p></div>
            <span className="loader-ui-badge">LOGIN + ROLE ROUTING COMPLETE</span>
          </div>

          <div className="loader-preview-table">
            <div className="loader-preview-row table-head">
              <span>Vehicle</span><span>Route / Brand</span><span>Type</span><span>Stops</span><span>Volume</span><span>Status</span>
            </div>
            {previewTrips.map((trip) => (
              <div className="loader-preview-row" key={trip.vehicle}>
                <strong>{trip.vehicle}</strong>
                <span><b>{trip.route}</b><small>{trip.brand}</small></span>
                <span>{trip.type}</span>
                <span>{trip.stops}</span>
                <span className="loader-meter-wrap"><i className="loader-meter"><em style={{ width: `${trip.volume}%` }} /></i>{trip.volume}%</span>
                <span><b className={`loader-status ${trip.status.toLowerCase()}`}>{trip.status}</b></span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
