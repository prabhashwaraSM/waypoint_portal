import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Siren, PhoneCall, Eye, Send, CheckCircle2, MapPinned, X, Phone, Clock3, Truck, Store, CalendarClock
} from "lucide-react";
import DriverIssueForm from "../../components/DriverIssueForm";
import { buildTrip, toHHMM, toMinutes } from "../../data/tripSim";
import { loadDrivers } from "../../data/dispatchStore";
import { addOffRoad, PLANNING_START } from "../../data/delayStore";
import { fmtDate } from "../../data/fleetStore";
import { getSession } from "../../../../shared/auth/auth";
import {
  getDriverIssues, subscribeDriverIssues, acknowledgeIssue, notifyStoresOfDelay, resolveIssue,
  issueLabel, continueLabel, STATUS, SEVERITY_LABEL, RESOLUTIONS, buildDelayMessage, defaultReasonText
} from "../../data/driverIssueStore";
import "../../styles/driverNotifications.css";

const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h < 24 ? `${h} hr ago` : `${Math.round(h / 24)} d ago`;
};
const clock = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const addMin = (hhmm, min) => (hhmm ? toHHMM(toMinutes(hhmm) + (Number(min) || 0)) : "");

// ---------------------------------------------------------------------------
function NotifyStoresModal({ issue, dispatcher, onClose }) {
  const already = new Set((issue.storesNotified || []).map((s) => s.outletId));
  const [reasonText, setReasonText] = useState(issue.delayReasonText || defaultReasonText(issue));
  const [stores, setStores] = useState(() =>
    (issue.affectedStops || []).map((s) => ({
      ...s,
      newEta: issue.delayMin ? addMin(s.plannedEta, issue.delayMin) : "",
      on: !already.has(s.outletId)
    }))
  );
  const [preview, setPreview] = useState(0);
  const [done, setDone] = useState(false);

  const chosen = stores.filter((s) => s.on);
  const messageFor = (s) => buildDelayMessage({ store: s, issue, reasonText: reasonText.trim(), dispatcher });
  const shown = stores[preview];

  const send = () => {
    if (!chosen.length || !reasonText.trim()) return;
    notifyStoresOfDelay(issue.id, { stores: chosen, reasonText: reasonText.trim(), messageFor, by: dispatcher });
    setDone(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card dn-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="dn-notify-title">
        <div className="modal-head">
          <h3 id="dn-notify-title">{done ? "Store managers notified" : "Tell store managers about the delay"}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {done ? (
          <div className="dn-done">
            <CheckCircle2 size={32} />
            <p>{chosen.map((s) => s.outletId).join(", ")} {chosen.length === 1 ? "has" : "have"} the new arrival time and an apology. The driver has been told too.</p>
            <div className="modal-actions"><button className="fl-btn primary" onClick={onClose}>Done</button></div>
          </div>
        ) : (
          <>
            <p className="modal-sub">
              {issueLabel(issue.type)} on {issue.tripId} ({issue.vehicleId}). Choose the stores to tell and check their new arrival times.
            </p>

            <div className="fl-table-wrap">
              <table className="fl-table compact">
                <thead>
                  <tr><th></th><th>Store</th><th>Planned</th><th>New arrival</th><th></th></tr>
                </thead>
                <tbody>
                  {stores.map((s, i) => (
                    <tr key={s.outletId} className={i === preview ? "dn-row-on" : ""} onClick={() => setPreview(i)}>
                      <td className="center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={s.on}
                          onChange={() => setStores((l) => l.map((x, j) => (j === i ? { ...x, on: !x.on } : x)))}
                          aria-label={`Notify ${s.outletId}`}
                        />
                      </td>
                      <td>{s.outletId}<span className="fl-sub">{s.district}</span></td>
                      <td>{s.plannedEta || "—"}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="time"
                          className="dn-time"
                          value={s.newEta}
                          onChange={(e) => setStores((l) => l.map((x, j) => (j === i ? { ...x, newEta: e.target.value } : x)))}
                          aria-label={`New arrival time for ${s.outletId}`}
                        />
                      </td>
                      <td>{already.has(s.outletId) && <span className="fl-badge good">Told earlier</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <label className="modal-field" style={{ marginTop: 14 }}>
              <span>Reason given to the stores (finishes “…will be late because …”)</span>
              <input value={reasonText} onChange={(e) => setReasonText(e.target.value)} />
            </label>

            {shown && (
              <div className="dn-preview">
                <span>Message to {shown.outletId}</span>
                <pre>{messageFor(shown)}</pre>
              </div>
            )}

            {!reasonText.trim() && <p className="fl-error">Say why the delivery will be late.</p>}
            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={onClose}>Cancel</button>
              <button className="fl-btn primary" onClick={send} disabled={!chosen.length || !reasonText.trim()}>
                <Send size={15} /> Notify {chosen.length} store{chosen.length === 1 ? "" : "s"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function IssueDetail({ issue, dispatcher, onNotify }) {
  const navigate = useNavigate();
  const [reply, setReply] = useState("");
  const [resolution, setResolution] = useState(RESOLUTIONS[0]);
  const [offRoadDone, setOffRoadDone] = useState(false);
  useEffect(() => {
    setReply("");
    setOffRoadDone(false);
  }, [issue.id]);

  const status = STATUS[issue.status];
  const notified = new Map((issue.storesNotified || []).map((s) => [s.outletId, s]));
  const vehicleOut = issue.canContinue !== "continue";

  return (
    <div className="dn-detail">
      <div className="dn-detail-head">
        <div>
          <h2>{issueLabel(issue.type)}</h2>
          <p>
            {issue.tripId} · {issue.vehicleId}{issue.vehicleReg ? ` (${issue.vehicleReg})` : ""} · reported {clock(issue.createdAt)}, {timeAgo(issue.createdAt)}
          </p>
        </div>
        <div className="dn-badges">
          <span className={`fl-badge ${issue.severity === "high" ? "bad" : issue.severity === "medium" ? "fair" : ""}`}>{SEVERITY_LABEL[issue.severity]}</span>
          <span className={`fl-badge ${status.cls}`}>{status.label}</span>
        </div>
      </div>

      <dl className="dn-facts">
        <div><dt>Driver</dt><dd>{issue.driverName}{issue.driverPhone && <a href={`tel:${issue.driverPhone}`} className="dn-phone"><Phone size={12} /> {issue.driverPhone}</a>}</dd></div>
        <div><dt>Where</dt><dd>{issue.location || "Not given"}</dd></div>
        <div><dt>Expected hold-up</dt><dd>{issue.delayMin ? `About ${issue.delayMin} min` : "Not sure yet"}</dd></div>
        <div><dt>Can carry on?</dt><dd className={vehicleOut ? "bad" : ""}>{continueLabel(issue.canContinue)}</dd></div>
        <div><dt>Depot and brand</dt><dd>{issue.depot}, {issue.brand}</dd></div>
        <div><dt>Reported by</dt><dd>{issue.reportedVia === "phone_call" ? `Phone call, logged by ${issue.loggedBy}` : "Driver app"}</dd></div>
        {issue.note && <div className="wide"><dt>Driver's note</dt><dd>“{issue.note}”</dd></div>}
      </dl>

      <h3 className="fl-section-title">Stores still waiting on this trip</h3>
      {issue.affectedStops?.length ? (
        <div className="fl-table-wrap">
          <table className="fl-table compact">
            <thead><tr><th>Store</th><th>Planned arrival</th><th>Likely arrival</th><th>Store manager</th></tr></thead>
            <tbody>
              {issue.affectedStops.map((s) => {
                const n = notified.get(s.outletId);
                return (
                  <tr key={s.outletId} style={{ cursor: "default" }}>
                    <td>{s.outletId}<span className="fl-sub">{s.district}</span></td>
                    <td>{s.plannedEta || "—"}</td>
                    <td>{n?.newEta || (issue.delayMin ? addMin(s.plannedEta, issue.delayMin) : "—")}</td>
                    <td>{n ? <span className="fl-badge good">Told at {clock(n.at)}</span> : <span className="fl-badge bad">Not told yet</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="fl-muted">The driver had finished all drops when reporting.</p>
      )}
      {issue.orderRefs?.length > 0 && <p className="fl-muted small">Orders on this trip: {issue.orderRefs.join(", ")}</p>}

      {issue.status !== "resolved" && (
        <div className="dn-actions">
          {issue.status === "new" && (
            <div className="dn-action">
              <h4><Eye size={15} /> 1. Let the driver know you've seen it</h4>
              <div className="dn-inline">
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to driver (optional), e.g. Stay with the vehicle, a replacement is coming" />
                <button className="fl-btn" onClick={() => acknowledgeIssue(issue.id, dispatcher, reply.trim())}>Mark as seen</button>
              </div>
            </div>
          )}
          <div className="dn-action">
            <h4><Store size={15} /> {issue.status === "new" ? "2. " : ""}Tell the store managers</h4>
            <p className="fl-muted small">Send each waiting store its new arrival time with an apology.</p>
            <button className="fl-btn primary" onClick={onNotify} disabled={!issue.affectedStops?.length}>
              <Send size={15} /> Notify store managers
            </button>
          </div>
          {vehicleOut && (
            <div className="dn-action">
              <h4><Truck size={15} /> Tomorrow's plan</h4>
              <p className="fl-muted small">Take {issue.vehicleId} out of the dispatch plan for {fmtDate(PLANNING_START)} so orders are not booked on it.</p>
              {offRoadDone ? (
                <p className="dn-ok"><CheckCircle2 size={14} /> {issue.vehicleId} is off the road. <button className="dl-link-inline" onClick={() => navigate("/dispatch/shortages")}>See Shortages & Delays</button></p>
              ) : (
                <button
                  className="fl-btn"
                  onClick={() => {
                    addOffRoad({ vehicleId: issue.vehicleId, date: PLANNING_START, reason: issueLabel(issue.type) });
                    setOffRoadDone(true);
                  }}
                >
                  <CalendarClock size={15} /> Take off the road
                </button>
              )}
            </div>
          )}
          <div className="dn-action">
            <h4><CheckCircle2 size={15} /> Close the issue</h4>
            <div className="dn-inline">
              <select className="fl-select" value={resolution} onChange={(e) => setResolution(e.target.value)} aria-label="Resolution">
                {RESOLUTIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <button className="fl-btn" onClick={() => resolveIssue(issue.id, { resolution, by: dispatcher })}>Mark resolved</button>
            </div>
          </div>
        </div>
      )}

      <div className="dn-footer">
        <button className="fl-btn" onClick={() => navigate(`/fleet/tracking?trip=${issue.tripId}`)}><MapPinned size={15} /> Show trip on map</button>
      </div>

      <h3 className="fl-section-title">What happened so far</h3>
      <ol className="dn-timeline">
        {issue.timeline.map((t, i) => (
          <li key={i}><time>{clock(t.at)}</time><span>{t.text}</span></li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
export default function DriverNotifications() {
  const { fleet } = useOutletContext();
  const session = getSession() || {};
  const dispatcher = session.name || "Dispatcher";

  const [issues, setIssues] = useState(getDriverIssues);
  const [filter, setFilter] = useState("open");
  const [selectedId, setSelectedId] = useState(null);
  const [logging, setLogging] = useState(false);
  const [notifyFor, setNotifyFor] = useState(null);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => subscribeDriverIssues(() => setIssues(getDriverIssues())), []);
  useEffect(() => {
    loadDrivers().then(setDrivers);
  }, []);

  const vehicleMap = useMemo(() => Object.fromEntries(fleet.vehicles.map((v) => [v.id, v])), [fleet.vehicles]);
  const plans = useMemo(
    () =>
      fleet.trips
        .map((t) => buildTrip(t, vehicleMap[t.vehicle_id] || { id: t.vehicle_id }, fleet.outletMap, fleet.allowanceMap))
        .filter((p) => p.stops.length),
    [fleet, vehicleMap]
  );
  const driversByName = useMemo(() => Object.fromEntries(drivers.map((d) => [d.driver_name, d])), [drivers]);

  const counts = {
    new: issues.filter((i) => i.status === "new").length,
    seen: issues.filter((i) => i.status === "seen").length,
    stores_notified: issues.filter((i) => i.status === "stores_notified").length,
    resolved: issues.filter((i) => i.status === "resolved").length
  };
  const visible = issues.filter((i) => (filter === "open" ? i.status !== "resolved" : filter === "all" ? true : i.status === filter));
  const selected = issues.find((i) => i.id === selectedId) || visible[0] || null;

  const tile = (key, label, cls) => (
    <button className={`fl-cond-tile ${cls} ${filter === key ? "on" : ""}`} onClick={() => setFilter(filter === key ? "open" : key)} aria-pressed={filter === key}>
      <strong>{counts[key]}</strong>
      <span>{label}</span>
    </button>
  );

  return (
    <>
      <div className="fl-condition-strip">
        {tile("new", "New from drivers", "bad")}
        {tile("seen", "Seen, stores not told", "fair")}
        {tile("stores_notified", "Stores told", "shop")}
        {tile("resolved", "Resolved", "good")}
        <button className="fl-btn primary fl-register-btn" onClick={() => setLogging(true)}>
          <PhoneCall size={17} /> Log a driver's call
        </button>
      </div>

      {issues.length === 0 ? (
        <section className="fl-card dn-empty">
          <Siren size={28} />
          <strong>No problems reported by drivers.</strong>
          <p>
            Drivers report breakdowns, accidents and other hold-ups from the driver app (sign in as <b>driver / Driver@2026</b> to try it).
            Reports appear here straight away. If a driver phones in instead, log the call.
          </p>
          <button className="fl-btn primary" onClick={() => setLogging(true)}><PhoneCall size={15} /> Log a driver's call</button>
        </section>
      ) : (
        <div className="dn-layout">
          <section className="fl-card dn-list-card">
            <div className="fl-seg small" role="tablist">
              {[["open", "Open"], ["all", "All"], ["resolved", "Resolved"]].map(([k, l]) => (
                <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>{l}</button>
              ))}
            </div>
            <div className="dn-list">
              {visible.length === 0 && <p className="fl-muted">Nothing here.</p>}
              {visible.map((i) => (
                <button
                  key={i.id}
                  className={`dn-item ${selected?.id === i.id ? "on" : ""} ${i.status === "new" ? "unread" : ""}`}
                  onClick={() => setSelectedId(i.id)}
                >
                  <span className={`dn-dot sev-${i.severity}`} aria-hidden="true" />
                  <span className="dn-item-body">
                    <strong>{issueLabel(i.type)}</strong>
                    <span>{i.vehicleId} · {i.driverName}</span>
                    <span className="dn-item-meta">
                      <Clock3 size={11} /> {timeAgo(i.createdAt)} · {STATUS[i.status].label}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="fl-card">
            {selected ? (
              <IssueDetail issue={selected} dispatcher={dispatcher} onNotify={() => setNotifyFor(selected)} />
            ) : (
              <p className="fl-muted">Choose a report to see the details.</p>
            )}
          </section>
        </div>
      )}

      {logging && (
        <div className="modal-overlay" onClick={() => setLogging(false)}>
          <div className="modal-card dn-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="dn-log-title">
            <div className="modal-head">
              <h3 id="dn-log-title">Log a driver's call</h3>
              <button className="modal-close" onClick={() => setLogging(false)} aria-label="Close"><X size={18} /></button>
            </div>
            <p className="modal-sub">Record what the driver told you on the phone. It's handled the same way as a report from the driver app.</p>
            <DriverIssueForm
              plans={plans}
              via="phone_call"
              driversByName={driversByName}
              loggedBy={dispatcher}
              onSent={(issue) => {
                setLogging(false);
                setFilter("open");
                setSelectedId(issue.id);
              }}
            />
          </div>
        </div>
      )}

      {notifyFor && (
        <NotifyStoresModal
          issue={issues.find((i) => i.id === notifyFor.id) || notifyFor}
          dispatcher={dispatcher}
          onClose={() => setNotifyFor(null)}
        />
      )}
    </>
  );
}
