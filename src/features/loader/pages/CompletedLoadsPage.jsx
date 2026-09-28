import React from "react";
import { CheckCircle2, Inbox } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { loaderTrips } from "../data/loaderData";
import { BRAND_SHORT } from "../utils/formatters";

export default function CompletedLoadsPage({ tripStatuses }) {
  const readyTrips = loaderTrips.filter(function (trip) { return tripStatuses[trip.id] === "Ready"; });

  return (
    <>
      <PageHeader
        eyebrow="SHIFT RECORD"
        title="Completed Loads"
        description="Vehicles already cleared by the Loader for driver handover. This provides a simple operational audit trail for the prototype."
      />
      <section className="loader-history-grid">
        {readyTrips.map(function (trip) {
          return (
            <article className="loader-history-card" key={trip.id}>
              <div className="loader-history-icon"><CheckCircle2 size={21} /></div>
              <div><span className="loader-kicker">{trip.id}</span><h3>{trip.vehicleId} • {trip.routeCode}</h3><p>{BRAND_SHORT[trip.brand]} • {trip.district} • Trip {trip.tripNo}</p></div>
              <div className="loader-history-meta"><span><small>Bay</small><b>{trip.loadingBay}</b></span><span><small>Departure</small><b>{trip.plannedDeparture}</b></span><span><small>Plan</small><b>{trip.planVersion}</b></span></div>
            </article>
          );
        })}
        {!readyTrips.length && <div className="loader-empty"><Inbox size={28} /><b>No completed loads yet</b><span>Vehicles marked Ready will appear here.</span></div>}
      </section>
    </>
  );
}
