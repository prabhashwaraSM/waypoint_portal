import React from "react";
import { AlertTriangle, ChevronRight, ClipboardList, Layers3, Truck, Warehouse } from "lucide-react";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/LoaderStatCard";
import { loaderTrips, tripTotals } from "../data/loaderData";
import { BRAND_SHORT, statusClass } from "../utils/formatters";

export default function OverviewPage({ stats, tripStatuses, issues, onOpenTrip, onOpenPlan, onOpenIssues }) {
  const activeTrips = loaderTrips.filter(function (trip) {
    return tripStatuses[trip.id] !== "Ready";
  }).slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="WAREHOUSE CONTROL"
        title="Loader Operations"
        description="Execute the dispatcher plan, load in reverse stop order, protect temperature-sensitive goods, and report shortfalls before departure."
        actions={<button className="loader-primary-btn" onClick={onOpenPlan}><ClipboardList size={17} /> Open loading plan</button>}
      />

      <section className="loader-stats-grid">
        <StatCard icon={Truck} tone="indigo" value={stats.vehicles} label="Assigned vehicles" meta="Today's depot plan" />
        <StatCard icon={Warehouse} tone="blue" value={stats.orders} label="Delivery stops" meta={String(stats.routes) + " planned routes"} />
        <StatCard icon={Layers3} tone="green" value={stats.itemLines} label="Item lines" meta="Across all trips" />
        <StatCard icon={AlertTriangle} tone="red" value={stats.openIssues} label="Open shortfalls" meta="Need dispatcher attention" />
      </section>

      <section className="loader-overview-grid">
        <div className="loader-panel">
          <div className="loader-panel-head">
            <div><h2>Next vehicles at the dock</h2><p>Work queue ordered by planned departure.</p></div>
            <button className="loader-text-btn" onClick={onOpenPlan}>View full plan <ChevronRight size={15} /></button>
          </div>
          <div className="loader-trip-cards">
            {activeTrips.map(function (trip) {
              const totals = tripTotals(trip);
              return (
                <button className="loader-trip-card" key={trip.id} onClick={function () { onOpenTrip(trip.id); }}>
                  <div className="loader-trip-card-top">
                    <span className="loader-vehicle-icon"><Truck size={20} /></span>
                    <div><strong>{trip.vehicleId}</strong><small>{trip.vehicleType}</small></div>
                    <b className={"loader-status " + statusClass(tripStatuses[trip.id])}>{tripStatuses[trip.id]}</b>
                  </div>
                  <div className="loader-trip-route">
                    <span>{BRAND_SHORT[trip.brand]} • {trip.district}</span>
                    <b>{trip.routeCode} • Trip {trip.tripNo}</b>
                  </div>
                  <div className="loader-trip-card-meta">
                    <span><small>Bay</small><b>{trip.loadingBay}</b></span>
                    <span><small>Stops</small><b>{trip.stops.length}</b></span>
                    <span><small>Departure</small><b>{trip.plannedDeparture}</b></span>
                  </div>
                  <div className="loader-util-line"><i><em style={{ width: String(totals.volumePct) + "%" }} /></i><span>{totals.volumePct}% volume</span></div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="loader-panel">
          <div className="loader-panel-head">
            <div><h2>Dock exceptions</h2><p>Shortfalls reported before departure.</p></div>
            <button className="loader-text-btn" onClick={onOpenIssues}>Open issue desk <ChevronRight size={15} /></button>
          </div>
          <div className="loader-issue-list">
            {issues.slice(0, 4).map(function (issue) {
              return (
                <div className="loader-issue-row" key={issue.id}>
                  <span className="loader-alert-icon"><AlertTriangle size={17} /></span>
                  <div><strong>{issue.item}</strong><small>{issue.vehicleId} • {issue.outlet}</small></div>
                  <b>{issue.available}/{issue.expected} {issue.unit}</b>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
