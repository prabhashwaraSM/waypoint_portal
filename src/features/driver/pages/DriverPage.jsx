import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, LayoutDashboard, MapPin, MessageSquare, RefreshCw, Siren, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PortalChrome from "../../../shared/components/PortalChrome";
import { getSession, logout } from "../../../shared/auth/auth";
import DriverIssueForm from "../../dispatcher/components/DriverIssueForm";
import { loadFleet } from "../../dispatcher/data/fleetStore";
import { buildTrip, toHHMM, vehicleStateAt } from "../../dispatcher/data/tripSim";
import { getIssuesForDriver, issueLabel, STATUS, subscribeDriverIssues } from "../../dispatcher/data/driverIssueStore";
import "../../dispatcher/styles/fleet.css";
import "../../dispatcher/styles/driverNotifications.css";
import "../styles/driver.css";
import "../../../shared/styles/portalLayout.css";

const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const clock = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export default function DriverPage() {
  const navigate = useNavigate();
  const session = getSession() || {};
  const [plans, setPlans] = useState(null);
  const [issues, setIssues] = useState(() => getIssuesForDriver(session.name));
  const [tripId, setTripId] = useState(null);
  const [sentMessage, setSentMessage] = useState("");

  useEffect(() => {
    loadFleet().then((fleet) => {
      const vehicleMap = Object.fromEntries(fleet.vehicles.map((vehicle) => [vehicle.id, vehicle]));
      const nextPlans = fleet.trips
        .filter((trip) => trip.driver_name === session.name)
        .map((trip) => buildTrip(trip, vehicleMap[trip.vehicle_id] || { id: trip.vehicle_id }, fleet.outletMap, fleet.allowanceMap))
        .filter((plan) => plan.stops.length);
      setPlans(nextPlans);
    });

    return subscribeDriverIssues(() => setIssues(getIssuesForDriver(session.name)));
  }, [session.name]);

  const trip = useMemo(() => plans?.find((plan) => plan.trip_id === tripId) || plans?.[0], [plans, tripId]);
  const state = trip ? vehicleStateAt(trip, nowMinutes()) : null;

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const nav = (
    <button className="portal-nav-item active" type="button">
      <LayoutDashboard size={20} />
      <span>Today's Trip</span>
    </button>
  );

  return (
    <PortalChrome
      theme="driver-theme"
      product="Driver"
      accent="#0284c7"
      session={session}
      role="Driver"
      nav={nav}
      notificationCount={issues.filter((issue) => issue.status !== "resolved").length}
      onLogout={signOut}
      contentClassName="driver-content"
    >
      <div className="driver-page">
        <div className="driver-page-heading"><h1>Today's Trip</h1></div>

        {!plans ? (
          <div className="driver-panel driver-loading"><RefreshCw size={20} className="fl-spin" /> Loading your trip...</div>
        ) : (
          <>
            <section className="driver-panel">
              <div className="driver-panel-head"><h2><Truck size={18} /> Trip & Stops</h2></div>
              {!trip ? (
                <p className="driver-empty">No trip is assigned to you today.</p>
              ) : (
                <div className="driver-panel-body">
                  {plans.length > 1 && (
                    <div className="driver-trip-switch">
                      {plans.map((plan) => (
                        <button key={plan.trip_id} className={plan.trip_id === trip.trip_id ? "active" : ""} onClick={() => setTripId(plan.trip_id)}>
                          {plan.trip_id}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="driver-trip-meta">
                    <span><small>Trip</small><b>{trip.trip_id}</b></span>
                    <span><small>Vehicle</small><b>{trip.vehicle_id}</b></span>
                    <span><small>Depot</small><b>{trip.depot}</b></span>
                    <span><small>Departure</small><b>{trip.departure_time}</b></span>
                  </div>

                  <ol className="driver-stops">
                    {trip.stops.map((stop, index) => {
                      const arrive = trip.timeline.find((entry) => entry.type === "arrive" && entry.pointIndex === index + 1)?.at;
                      const done = state && state.stopsDone > index;
                      return (
                        <li key={stop.id} className={done ? "done" : ""}>
                          <span className="driver-stop-mark">{done ? <CheckCircle2 size={16} /> : index + 1}</span>
                          <span className="driver-stop-body">
                            <strong>{stop.id}</strong>
                            <small><MapPin size={12} /> {stop.district} • {String(stop.dockType || "street").replace("_", " ")}</small>
                          </span>
                          <time>{arrive != null ? toHHMM(arrive) : ""}</time>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </section>

            <section className="driver-panel">
              <div className="driver-panel-head"><h2><Siren size={18} /> Report a Problem</h2></div>
              <div className="driver-panel-body">
                {sentMessage && <div className="driver-success">{sentMessage}</div>}
                <DriverIssueForm
                  plans={trip ? [trip, ...plans.filter((plan) => plan.trip_id !== trip.trip_id)] : []}
                  via="driver_app"
                  driver={{ driver_id: session.driverId, driver_name: session.name, phone: session.phone }}
                  compact
                  onSent={() => setSentMessage("Sent to Dispatch. You will see their reply here.")}
                />
              </div>
            </section>

            <section className="driver-panel">
              <div className="driver-panel-head"><h2><MessageSquare size={18} /> My Reports</h2></div>
              <div className="driver-panel-body driver-report-list">
                {issues.length === 0 ? (
                  <p className="driver-empty">No problems reported today.</p>
                ) : issues.map((issue) => (
                  <article key={issue.id}>
                    <div><strong>{issueLabel(issue.type)}</strong><small>{issue.tripId} • Sent {clock(issue.createdAt)}</small></div>
                    <span className={"fl-badge " + STATUS[issue.status].cls}>{STATUS[issue.status].label}</span>
                    {issue.replyToDriver && <p>Dispatch: “{issue.replyToDriver}”</p>}
                    {issue.resolution && <p>Closed: {issue.resolution}</p>}
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </PortalChrome>
  );
}
