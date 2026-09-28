import React from "react";
import { ChevronRight, Filter, Search, Truck, Wifi } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { tripTotals } from "../data/loaderData";
import { BRAND_SHORT, statusClass } from "../utils/formatters";

export default function LoadingPlanPage({ trips, tripStatuses, planSearch, setPlanSearch, planBrand, setPlanBrand, onOpenTrip }) {
  return (
    <>
      <PageHeader
        eyebrow="TODAY • PELIYAGODA"
        title="Loading Plan"
        description="Dispatcher-assigned vehicles and trips. The Loader executes this plan; vehicle allocation is not changed here."
      />

      <div className="loader-toolbar">
        <label className="loader-search"><Search size={16} /><input value={planSearch} onChange={function (e) { setPlanSearch(e.target.value); }} placeholder="Search vehicle, route, district..." /></label>
        <label className="loader-select"><Filter size={15} /><select value={planBrand} onChange={function (e) { setPlanBrand(e.target.value); }}>
          <option value="All">All brands</option>
          <option value="Waypoint Fresh">Waypoint Fresh</option>
          <option value="Waypoint Style">Waypoint Style</option>
          <option value="Waypoint Tech">Waypoint Tech</option>
        </select></label>
        <div className="loader-plan-sync"><Wifi size={15} /><span><b>Plan synced</b><small>Dispatcher changes appear here</small></span></div>
      </div>

      <section className="loader-panel loader-table-panel">
        <div className="loader-table-wrap">
          <table className="loader-data-table">
            <thead><tr><th>Vehicle / trip</th><th>Route</th><th>Vehicle type</th><th>Bay</th><th>Stops</th><th>Capacity</th><th>Departure</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {trips.map(function (trip) {
                const totals = tripTotals(trip);
                return (
                  <tr key={trip.id}>
                    <td data-label="Vehicle / trip"><div className="loader-table-primary"><span className="loader-table-icon"><Truck size={17} /></span><span><b>{trip.vehicleId}</b><small>{BRAND_SHORT[trip.brand]} • Trip {trip.tripNo}</small></span></div></td>
                    <td data-label="Route"><b>{trip.district}</b><small className="loader-cell-sub">{trip.routeCode}</small></td>
                    <td data-label="Vehicle type"><b>{trip.vehicleType}</b><small className="loader-cell-sub">{trip.vehicleTemp}</small></td>
                    <td data-label="Loading bay">{trip.loadingBay}</td>
                    <td data-label="Stops">{trip.stops.length}</td>
                    <td data-label="Capacity"><div className="loader-mini-meter"><span><i style={{ width: String(totals.volumePct) + "%" }} /></span><small>{trip.load.volume}/{trip.capacity.volume} m³</small></div></td>
                    <td data-label="Departure"><b>{trip.plannedDeparture}</b><small className="loader-cell-sub">Plan {trip.planVersion}</small></td>
                    <td data-label="Status"><b className={"loader-status " + statusClass(tripStatuses[trip.id])}>{tripStatuses[trip.id]}</b></td>
                    <td data-label="Action"><button className="loader-row-action" onClick={function () { onOpenTrip(trip.id); }}>Open load <ChevronRight size={15} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
