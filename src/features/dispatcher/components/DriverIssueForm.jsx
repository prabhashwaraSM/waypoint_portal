import React, { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { ISSUE_TYPES, CONTINUE_OPTIONS, reportDriverIssue } from "../data/driverIssueStore";
import { vehicleStateAt, toHHMM } from "../data/tripSim";
import "../styles/driverNotifications.css";

const DELAYS = [
  { value: 15, label: "About 15 min" },
  { value: 30, label: "About 30 min" },
  { value: 60, label: "About 1 hour" },
  { value: 90, label: "About 1½ hours" },
  { value: 120, label: "About 2 hours" },
  { value: 240, label: "Half a day or more" },
  { value: 0, label: "Not sure yet" }
];

const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

/** Stops still to be served from `fromIndex`, with the planned arrival time. */
export function remainingStops(plan, fromIndex) {
  return plan.stops.slice(fromIndex).map((s, i) => {
    const pointIndex = fromIndex + i + 1; // points[0] is the depot
    const at = plan.timeline.find((e) => e.type === "arrive" && e.pointIndex === pointIndex)?.at;
    return { outletId: s.id, name: s.name, district: s.district, plannedEta: at != null ? toHHMM(at) : "" };
  });
}

function defaultNextStop(plan) {
  const state = vehicleStateAt(plan, nowMinutes());
  if (state.phase === "scheduled" || state.phase === "completed") return 0;
  const idx = plan.stops.findIndex((s) => s.id === state.nextStop?.id);
  return idx >= 0 ? idx : 0;
}

/**
 * Report form used on the driver's phone and by the dispatcher when a driver phones in.
 * @param {Array}  plans      trip plans (tripSim.buildTrip) the reporter can choose from
 * @param {"driver_app"|"phone_call"} via
 * @param {Object} [driver]   { driver_id, driver_name, phone } of the signed-in driver
 * @param {Object} [driversByName]  lookup for phone-call mode
 * @param {string} [loggedBy]
 * @param {Function} onSent
 * @param {boolean} [compact] phone layout
 */
export default function DriverIssueForm({ plans, via, driver, driversByName = {}, loggedBy, onSent, compact = false }) {
  const [tripId, setTripId] = useState(plans[0]?.trip_id || "");
  const plan = plans.find((p) => p.trip_id === tripId);
  const [type, setType] = useState("");
  const [nextStop, setNextStop] = useState(0);
  const [location, setLocation] = useState("");
  const [delayMin, setDelayMin] = useState(30);
  const [canContinue, setCanContinue] = useState("continue");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (plan) setNextStop(defaultNextStop(plan));
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tripId && plans[0]) setTripId(plans[0].trip_id);
  }, [plans, tripId]);

  const affected = useMemo(() => (plan ? remainingStops(plan, nextStop) : []), [plan, nextStop]);

  if (!plans.length) {
    return <p className="fl-muted">There are no trips to report on{via === "driver_app" ? " for you today" : ""}.</p>;
  }

  const missing = !type ? "Choose what happened." : !plan ? "Choose the trip." : "";

  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (missing) return;
    const d = driver || driversByName[plan.driver_name] || {};
    const issue = reportDriverIssue({
      tripId: plan.trip_id,
      vehicleId: plan.vehicle_id,
      vehicleReg: plan.vehicle?.registrationNo || "",
      driverName: plan.driver_name,
      driverId: d.driver_id || "",
      driverPhone: d.phone || "",
      depot: plan.depot,
      brand: plan.brand,
      type,
      note: note.trim(),
      location: location.trim() || (affected[0] ? `on the way to ${affected[0].outletId}, ${affected[0].district}` : ""),
      nextStopId: affected[0]?.outletId || "",
      affectedStops: affected,
      orderRefs: plan.order_refs || [],
      delayMin: Number(delayMin) || 0,
      canContinue,
      reportedVia: via,
      loggedBy
    });
    setType("");
    setNote("");
    setLocation("");
    setTried(false);
    onSent?.(issue);
  };

  return (
    <form className={`dn-form ${compact ? "compact" : ""}`} onSubmit={submit} noValidate>
      <label className="dn-field">
        <span>Trip</span>
        <select value={tripId} onChange={(e) => setTripId(e.target.value)}>
          {plans.map((p) => (
            <option key={p.trip_id} value={p.trip_id}>
              {p.trip_id} · {p.vehicle_id} · {p.driver_name} · leaves {p.departure_time}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="dn-field">
        <legend>What happened?</legend>
        <div className="dn-type-grid">
          {ISSUE_TYPES.map((t) => (
            <button
              type="button"
              key={t.value}
              className={`dn-type ${type === t.value ? "on" : ""} sev-${t.severity}`}
              aria-pressed={type === t.value}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="dn-row">
        <label className="dn-field">
          <span>Next stop you haven't reached</span>
          <select value={nextStop} onChange={(e) => setNextStop(Number(e.target.value))}>
            {plan?.stops.map((s, i) => (
              <option key={s.id} value={i}>{s.id} · {s.district}</option>
            ))}
          </select>
        </label>
        <label className="dn-field">
          <span>How long will it hold you up?</span>
          <select value={delayMin} onChange={(e) => setDelayMin(e.target.value)}>
            {DELAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </label>
      </div>

      <label className="dn-field">
        <span>Where are you? (optional)</span>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Kelaniya bridge, A1 near Kadawatha" />
      </label>

      <fieldset className="dn-field">
        <legend>Can you carry on?</legend>
        <div className="dn-radio-list">
          {CONTINUE_OPTIONS.map((o) => (
            <label key={o.value} className={`dn-radio ${canContinue === o.value ? "on" : ""}`}>
              <input type="radio" name="canContinue" value={o.value} checked={canContinue === o.value} onChange={() => setCanContinue(o.value)} />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="dn-field">
        <span>Anything else dispatch should know? (optional)</span>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Engine warning light, pulled over safely" />
      </label>

      {affected.length > 0 && (
        <p className="dn-affected">
          Stores still to deliver: <strong>{affected.map((s) => s.outletId).join(", ")}</strong>
        </p>
      )}

      {tried && missing && <p className="fl-error" role="alert">{missing}</p>}
      <button type="submit" className="dn-send">
        <Send size={16} /> {via === "phone_call" ? "Log report" : "Send to dispatcher"}
      </button>
    </form>
  );
}
