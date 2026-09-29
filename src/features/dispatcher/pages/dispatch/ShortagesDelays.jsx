import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CalendarClock, CheckCircle2, Download, Printer, RefreshCw, Search, Snowflake,
  Store, Truck, X, Plus, Trash2, Settings2, Send, ClipboardList
} from "lucide-react";
import DispatchSubnav from "./DispatchSubnav";
import { planCapacity, POOLS, addDaysIso, daysBetweenIso } from "../../data/capacityPlanner";
import {
  PLANNING_START, REASON_TYPES, reasonLabel, OFF_ROAD_REASONS,
  loadPlanningInputs, getPlanningSettings, savePlanningSettings, getOffRoad, addOffRoad, removeOffRoad,
  getDelayRecords, rescheduleOrder, buildApology, delaysToCsv, subscribeDelays
} from "../../data/delayStore";
import { fmtDate } from "../../data/fleetStore";
import { getSession } from "../../../../shared/auth/auth";
import "../../styles/delays.css";

const shortDate = (iso) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }) : "—";

function ReasonBadge({ code }) {
  const cls = code === "capacity_shortage" ? "fair" : code === "vehicle_shortage" ? "bad" : "shop";
  return <span className={`fl-badge ${cls}`}>{reasonLabel(code)}</span>;
}

function Needs({ order }) {
  return (
    <span className="fl-chips">
      {order.temp === "chilled" ? <span className="fl-chip cold"><Snowflake size={11} /> Chilled</span> : <span className="fl-chip">Ambient</span>}
      {order.parkingConstraint === "van_only" && <span className="fl-chip">Van only</span>}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Reschedule + apology modal (one or many orders)
// ---------------------------------------------------------------------------
function RescheduleModal({ items, dispatcher, onClose, onDone }) {
  const [rows, setRows] = useState(() =>
    items.map((it) => ({
      order: it.order,
      newDate: it.proposedDate || addDaysIso(it.order.requiredDate < PLANNING_START ? PLANNING_START : it.order.requiredDate, 1),
      reasonCode: it.reason?.code || "vehicle_shortage",
      reasonText: it.reason?.text || "",
      source: it.source || "detected",
      apology: null // null = generated from the fields; a string once the dispatcher edits it
    }))
  );
  const [active, setActive] = useState(0);
  const [sent, setSent] = useState(false);

  const update = (i, patch) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const textFor = (r) =>
    r.apology ?? buildApology({ order: r.order, newDate: r.newDate, reasonText: r.reasonText || "of an operational issue", dispatcher });

  const problems = rows
    .map((r) => {
      if (!r.newDate) return `${r.order.ref}: choose a new dispatch date.`;
      if (r.newDate <= r.order.requiredDate) return `${r.order.ref}: the new date must be after ${fmtDate(r.order.requiredDate)}.`;
      if (!r.reasonText.trim()) return `${r.order.ref}: say why the order is delayed.`;
      return null;
    })
    .filter(Boolean);

  const send = () => {
    if (problems.length) return;
    rows.forEach((r) =>
      rescheduleOrder({
        order: r.order,
        newDate: r.newDate,
        reasonCode: r.reasonCode,
        reasonText: r.reasonText.trim(),
        apology: textFor(r),
        source: r.source,
        createdBy: dispatcher
      })
    );
    setSent(true);
  };

  const r = rows[active];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card dl-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="dl-modal-title">
        <div className="modal-head">
          <h3 id="dl-modal-title">
            {sent ? "Stores notified" : rows.length === 1 ? `Reschedule ${r.order.ref}` : `Reschedule ${rows.length} orders`}
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {sent ? (
          <div className="dl-sent">
            <CheckCircle2 size={34} />
            <p>
              {rows.length === 1 ? "The new date and apology were" : `New dates and apologies for ${rows.length} orders were`} sent to
              the store manager{rows.length === 1 ? "" : "s"}. The delay{rows.length === 1 ? " is" : "s are"} now in the delay report.
            </p>
            <div className="modal-actions">
              <button className="fl-btn primary" onClick={onDone}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <p className="modal-sub">
              Give each order a new dispatch date. The store manager gets the new date with an apology, and the delay is added to the report.
            </p>

            {rows.length > 1 && (
              <div className="dl-modal-list" role="tablist">
                {rows.map((row, i) => (
                  <button
                    key={row.order.ref}
                    role="tab"
                    aria-selected={i === active}
                    className={`dl-modal-tab ${i === active ? "on" : ""}`}
                    onClick={() => setActive(i)}
                  >
                    <strong>{row.order.ref}</strong>
                    <span>{row.order.outletId} → {shortDate(row.newDate)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="dl-modal-order">
              <strong>{r.order.storeLabel}</strong>
              <span>
                {r.order.outletId}, {r.order.district} · {r.order.category}, {r.order.units} units · due {fmtDate(r.order.requiredDate)}
              </span>
            </div>

            <div className="dl-modal-grid">
              <label className="modal-field">
                <span>New dispatch date</span>
                <input
                  type="date"
                  value={r.newDate}
                  min={addDaysIso(r.order.requiredDate, 1)}
                  onChange={(e) => update(active, { newDate: e.target.value })}
                />
              </label>
              <label className="modal-field">
                <span>Reason type</span>
                <select value={r.reasonCode} onChange={(e) => update(active, { reasonCode: e.target.value })}>
                  {REASON_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
            </div>

            <label className="modal-field">
              <span>Reason given to the store (finishes the sentence “…cannot leave the depot because …”)</span>
              <input value={r.reasonText} onChange={(e) => update(active, { reasonText: e.target.value, apology: null })} />
            </label>

            <label className="modal-field">
              <span className="dl-field-head">
                Apology message
                {r.apology !== null && (
                  <button type="button" className="dl-link" onClick={() => update(active, { apology: null })}>Rewrite from the details</button>
                )}
              </span>
              <textarea rows={9} value={textFor(r)} onChange={(e) => update(active, { apology: e.target.value })} />
            </label>

            {problems.length > 0 && <p className="fl-error">{problems[0]}</p>}
            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={onClose}>Cancel</button>
              <button className="fl-btn primary" onClick={send} disabled={problems.length > 0}>
                <Send size={15} /> Send to {rows.length === 1 ? "store" : `${new Set(rows.map((x) => x.order.outletId)).size} stores`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manual delay: pick any approved order that is waiting for dispatch
// ---------------------------------------------------------------------------
function ManualPicker({ orders, onPick, onClose }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orders
      .filter((o) => !s || [o.ref, o.outletId, o.storeLabel, o.district].some((x) => String(x).toLowerCase().includes(s)))
      .slice(0, 40);
  }, [orders, q]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card dl-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="dl-pick-title">
        <div className="modal-head">
          <h3 id="dl-pick-title">Delay an order</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <p className="modal-sub">For shortages the plan can't see, such as a driver calling in sick. Pick the order to reschedule.</p>
        <div className="fl-search">
          <Search size={15} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order, store or district" />
        </div>
        <div className="dl-pick-list">
          {list.map((o) => (
            <button key={o.ref} className="dl-pick" onClick={() => onPick(o)}>
              <strong>{o.ref}</strong>
              <span>{o.outletId}, {o.district} · {o.brand.replace("Waypoint ", "")} · due {shortDate(o.requiredDate)}</span>
            </button>
          ))}
          {list.length === 0 && <p className="fl-muted">No approved order waiting for dispatch matches “{q}”.</p>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ShortagesDelays() {
  const session = getSession() || {};
  const dispatcher = session.name || "Dispatcher";

  const [inputs, setInputs] = useState(null);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(getPlanningSettings);
  const [offRoad, setOffRoad] = useState(getOffRoad);
  const [records, setRecords] = useState(getDelayRecords);
  const [tab, setTab] = useState("risk");

  const [depot, setDepot] = useState("ALL");
  const [brand, setBrand] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [modalItems, setModalItems] = useState(null);
  const [picking, setPicking] = useState(false);

  const reload = useCallback(async () => {
    try {
      setInputs(await loadPlanningInputs());
      setError("");
    } catch (e) {
      console.error(e);
      setError("Orders and vehicles could not be loaded. Check that the CSV files are in the public folder.");
    }
  }, []);

  useEffect(() => {
    reload();
    return subscribeDelays(() => {
      setOffRoad(getOffRoad());
      setRecords(getDelayRecords());
      setSettings(getPlanningSettings());
      reload();
    });
  }, [reload]);

  const plan = useMemo(() => {
    if (!inputs) return null;
    return planCapacity({ orders: inputs.orders, vehicles: inputs.fleet.vehicles, startDate: PLANNING_START, settings, offRoad });
  }, [inputs, settings, offRoad]);

  const atRisk = useMemo(() => {
    if (!plan) return [];
    const q = search.trim().toLowerCase();
    return plan.atRisk
      .filter((r) => depot === "ALL" || r.order.depot === depot)
      .filter((r) => brand === "ALL" || r.order.brand === brand)
      .filter((r) => !q || [r.order.ref, r.order.outletId, r.order.storeLabel, r.order.district].some((x) => String(x).toLowerCase().includes(q)));
  }, [plan, depot, brand, search]);

  const reportRows = useMemo(
    () =>
      records
        .map((d) => ({
          ...d,
          daysDelayed: daysBetweenIso(d.originalDate, d.newDate),
          reasonLabel: reasonLabel(d.reasonCode),
          source: d.source === "manual" ? "Dispatcher" : "Capacity plan"
        }))
        .filter((d) => depot === "ALL" || d.depot === depot)
        .filter((d) => brand === "ALL" || d.brand === brand),
    [records, depot, brand]
  );

  const stats = useMemo(() => {
    const allRisk = plan?.atRisk || [];
    const days = reportRows.map((r) => r.daysDelayed);
    return {
      risk: allRisk.length,
      riskStores: new Set(allRisk.map((r) => r.order.outletId)).size,
      rescheduled: new Set(reportRows.map((r) => r.orderRef)).size,
      stores: new Set(reportRows.map((r) => r.outletId)).size,
      avg: days.length ? days.reduce((a, b) => a + b, 0) / days.length : 0,
      max: days.length ? Math.max(...days) : 0
    };
  }, [plan, reportRows]);

  const toggle = (ref) => setSelected((s) => (s.includes(ref) ? s.filter((x) => x !== ref) : [...s, ref]));
  const allVisibleSelected = atRisk.length > 0 && atRisk.every((r) => selected.includes(r.order.ref));

  const openReschedule = (items) => setModalItems(items);
  const closeModal = () => setModalItems(null);
  const finishModal = () => {
    setModalItems(null);
    setSelected([]);
    setRecords(getDelayRecords());
    reload();
  };

  if (error) return <div className="fl-page"><div className="fl-empty">{error}</div></div>;

  return (
    <div className="fl-page dl-page">
      <div className="fl-heading dl-noprint">
        <div>
          <h1>Shortages & Delays</h1>
          <p>Approved orders that can't be dispatched on their required date, the new date each store was given, and the delay report.</p>
        </div>
        <DispatchSubnav />
      </div>

      {!plan ? (
        <div className="fl-loading"><RefreshCw size={22} className="fl-spin" /> Checking approved orders against available vehicles…</div>
      ) : (
        <>
          <div className="fl-condition-strip dl-noprint">
            <button className={`fl-cond-tile bad ${tab === "risk" ? "on" : ""}`} onClick={() => setTab("risk")}>
              <strong>{stats.risk}</strong>
              <span>Orders that won't make their date</span>
            </button>
            <button className={`fl-cond-tile fair ${tab === "report" ? "on" : ""}`} onClick={() => setTab("report")}>
              <strong>{stats.rescheduled}</strong>
              <span>Rescheduled, store told</span>
            </button>
            <div className="fl-cond-tile">
              <strong>{stats.riskStores}</strong>
              <span>Stores waiting for an update</span>
            </div>
            <div className="fl-cond-tile">
              <strong>{stats.avg ? `${stats.avg.toFixed(1)} d` : "—"}</strong>
              <span>Average delay given</span>
            </div>
          </div>

          <section className="fl-card">
            <div className="fl-tabs dl-noprint" role="tablist">
              <button role="tab" aria-selected={tab === "risk"} className={`fl-tab ${tab === "risk" ? "active" : ""}`} onClick={() => setTab("risk")}>
                <AlertTriangle size={15} /> Orders at risk
              </button>
              <button role="tab" aria-selected={tab === "capacity"} className={`fl-tab ${tab === "capacity" ? "active" : ""}`} onClick={() => setTab("capacity")}>
                <Truck size={15} /> Capacity by day
              </button>
              <button role="tab" aria-selected={tab === "report"} className={`fl-tab ${tab === "report" ? "active" : ""}`} onClick={() => setTab("report")}>
                <ClipboardList size={15} /> Delay report
              </button>
            </div>

            <div className="fl-filters dl-noprint">
              {tab !== "capacity" && (
                <div className="fl-search">
                  <Search size={15} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order, store or district" aria-label="Search" />
                </div>
              )}
              <select className="fl-select" value={depot} onChange={(e) => setDepot(e.target.value)} aria-label="Depot">
                <option value="ALL">All depots</option>
                {plan.depots.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {tab !== "capacity" && (
                <select className="fl-select" value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Brand">
                  <option value="ALL">All brands</option>
                  <option>Waypoint Fresh</option>
                  <option>Waypoint Style</option>
                  <option>Waypoint Tech</option>
                </select>
              )}
              {tab === "risk" && (
                <>
                  <span className="fl-count">{atRisk.length} order{atRisk.length === 1 ? "" : "s"}</span>
                  <button className="fl-btn" onClick={() => setPicking(true)}><Plus size={15} /> Delay an order</button>
                  <button
                    className="fl-btn primary"
                    disabled={selected.length === 0}
                    onClick={() => openReschedule(plan.atRisk.filter((r) => selected.includes(r.order.ref)))}
                  >
                    <CalendarClock size={15} /> Reschedule & notify ({selected.length})
                  </button>
                </>
              )}
            </div>

            {tab === "risk" && (
              <RiskTable
                rows={atRisk}
                horizon={settings.horizonDays}
                selected={selected}
                toggle={toggle}
                allSelected={allVisibleSelected}
                toggleAll={() => setSelected(allVisibleSelected ? [] : atRisk.map((r) => r.order.ref))}
                onReschedule={(r) => openReschedule([r])}
                goCapacity={() => setTab("capacity")}
              />
            )}

            {tab === "capacity" && (
              <CapacityView
                plan={plan}
                depot={depot}
                vehicles={inputs.fleet.vehicles}
                settings={settings}
                offRoad={offRoad}
              />
            )}

            {tab === "report" && <DelayReport rows={reportRows.filter((r) => {
              const q = search.trim().toLowerCase();
              return !q || [r.orderRef, r.outletId, r.storeLabel, r.district].some((x) => String(x).toLowerCase().includes(q));
            })} depot={depot} brand={brand} />}
          </section>
        </>
      )}

      {modalItems && <RescheduleModal items={modalItems} dispatcher={dispatcher} onClose={closeModal} onDone={finishModal} />}
      {picking && inputs && (
        <ManualPicker
          orders={inputs.orders}
          onClose={() => setPicking(false)}
          onPick={(o) => {
            setPicking(false);
            openReschedule([{ order: o, reason: { code: "driver_unavailable", text: "" }, proposedDate: null, source: "manual" }]);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function RiskTable({ rows, horizon, selected, toggle, allSelected, toggleAll, onReschedule, goCapacity }) {
  if (rows.length === 0) {
    return (
      <div className="dl-empty">
        <CheckCircle2 size={28} />
        <strong>Every approved order fits on the available vehicles for its date.</strong>
        <p>
          If a vehicle can't go out, or a driver isn't available, take the vehicle off the road in{" "}
          <button className="dl-link" onClick={goCapacity}>Capacity by day</button> and the affected orders show up here.
        </p>
      </div>
    );
  }
  return (
    <div className="fl-table-wrap">
      <table className="fl-table">
        <thead>
          <tr>
            <th className="center"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all orders" /></th>
            <th>Order</th>
            <th>Store</th>
            <th>Depot</th>
            <th>Needs</th>
            <th>Required</th>
            <th>Shortage</th>
            <th>Next available</th>
            <th className="num">Days late</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.order.ref} onClick={() => toggle(r.order.ref)} className={selected.includes(r.order.ref) ? "dl-row-on" : ""}>
              <td className="center" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={selected.includes(r.order.ref)} onChange={() => toggle(r.order.ref)} aria-label={`Select ${r.order.ref}`} />
              </td>
              <td>
                <strong className="dl-ref">{r.order.ref}</strong>
                <span className="fl-sub">{r.order.brand.replace("Waypoint ", "")} · {r.order.category}</span>
              </td>
              <td>
                {r.order.outletId}
                <span className="fl-sub">{r.order.district}</span>
              </td>
              <td>{r.order.depot}</td>
              <td><Needs order={r.order} /></td>
              <td>
                {shortDate(r.order.requiredDate)}
                {r.order.delay && <span className="fl-sub late">Already moved once</span>}
              </td>
              <td className="wrap">
                <ReasonBadge code={r.reason.code} />
                <span className="dl-reason">{r.reason.text}</span>
              </td>
              <td>{r.proposedDate ? <strong>{shortDate(r.proposedDate)}</strong> : <span className="fl-sub late">None in the next {horizon} days</span>}</td>
              <td className="num">{r.daysLate ?? "—"}</td>
              <td onClick={(e) => e.stopPropagation()}>
                <button className="fl-btn" onClick={() => onReschedule(r)}>Reschedule</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
function CapacityView({ plan, depot, vehicles, settings, offRoad }) {
  const depots = depot === "ALL" ? plan.depots : [depot];
  const [draft, setDraft] = useState(settings);
  const [form, setForm] = useState({ vehicleId: "", date: PLANNING_START, reason: OFF_ROAD_REASONS[0] });
  useEffect(() => setDraft(settings), [settings]);

  const changed = JSON.stringify(draft) !== JSON.stringify(settings);
  const vehicleOptions = vehicles
    .filter((v) => depot === "ALL" || v.depot === depot)
    .filter((v) => !v.inWorkshop)
    .sort((a, b) => a.id.localeCompare(b.id));
  const vehicleMap = Object.fromEntries(vehicles.map((v) => [v.id, v]));
  const offList = offRoad
    .filter((o) => depot === "ALL" || vehicleMap[o.vehicleId]?.depot === depot)
    .sort((a, b) => a.date.localeCompare(b.date));

  const num = (key, min, max) => (
    <input
      type="number"
      min={min}
      max={max}
      value={draft[key]}
      onChange={(e) => setDraft((d) => ({ ...d, [key]: Math.max(min, Math.min(max, Number(e.target.value) || min)) }))}
    />
  );

  return (
    <div className="dl-capacity">
      {depots.map((d) => {
        const dates = Object.keys(plan.days[d] || {}).filter((date) => {
          const day = plan.days[d][date];
          return day.demand > 0 || date <= addDaysIso(plan.startDate, 4);
        });
        return (
          <div key={d} className="dl-depot">
            <h3 className="fl-section-title first">{d} depot</h3>
            <div className="fl-table-wrap">
              <table className="fl-table compact dl-cap-table">
                <thead>
                  <tr>
                    <th>Dispatch date</th>
                    <th className="num">Orders</th>
                    {POOLS.map((p) => <th key={p.key}>{p.label} trips</th>)}
                    <th className="num">Can't go</th>
                  </tr>
                </thead>
                <tbody>
                  {dates.map((date) => {
                    const day = plan.days[d][date];
                    return (
                      <tr key={date} className={day.short ? "dl-short-row" : ""}>
                        <td>
                          <strong>{shortDate(date)}</strong>
                          {day.carriedIn > 0 && <span className="fl-sub late">{day.carriedIn} carried from earlier</span>}
                        </td>
                        <td className="num">{day.demand}</td>
                        {POOLS.map((p) => {
                          const pool = day.pools[p.key];
                          const used = pool.trips.length;
                          const pct = pool.available ? (used / pool.available) * 100 : 0;
                          const full = pool.available > 0 && used >= pool.available;
                          return (
                            <td key={p.key}>
                              {pool.total === 0 ? (
                                <span className="fl-sub">None at depot</span>
                              ) : (
                                <div className="dl-pool">
                                  <span className={`dl-pool-num ${full ? "full" : ""}`}>
                                    {used} of {pool.available}
                                  </span>
                                  <span className="dl-meter"><i style={{ width: `${Math.min(100, pct)}%` }} className={full ? "full" : ""} /></span>
                                  {(pool.inWorkshop > 0 || pool.offRoad > 0) && (
                                    <span className="fl-sub">
                                      {[pool.inWorkshop && `${pool.inWorkshop} in workshop`, pool.offRoad && `${pool.offRoad} off road`].filter(Boolean).join(", ")}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className={`num ${day.short ? "late" : ""}`}>{day.short ? <strong>{day.short}</strong> : "0"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
      <p className="fl-muted small">
        Each vehicle makes {settings.tripsPerDay} trip{settings.tripsPerDay === 1 ? "" : "s"} a day. A trip carries one brand to one district, with up to{" "}
        {settings.vanDropsPerTrip} drops for a van and {settings.truckDropsPerTrip} for a lorry, within the vehicle's weight and volume. Orders that
        don't fit roll to the next day.
      </p>

      <div className="dl-side-by-side">
        <div className="dl-box">
          <h3 className="fl-section-title first"><Truck size={15} /> Vehicles off the road</h3>
          <p className="fl-muted small">Take a vehicle out of the plan for a day, for example when its driver is off or it has broken down.</p>
          <div className="dl-offroad-form">
            <select className="fl-select" value={form.vehicleId} onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))} aria-label="Vehicle">
              <option value="">Choose a vehicle</option>
              {vehicleOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} · {v.type === "van" ? "Van" : "Lorry"}, {v.temp} · {v.depot}
                </option>
              ))}
            </select>
            <input className="fl-select" type="date" min={PLANNING_START} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} aria-label="Date" />
            <select className="fl-select" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} aria-label="Reason">
              {OFF_ROAD_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <button
              className="fl-btn primary"
              disabled={!form.vehicleId || !form.date}
              onClick={() => {
                addOffRoad(form);
                setForm((f) => ({ ...f, vehicleId: "" }));
              }}
            >
              <Plus size={15} /> Take off road
            </button>
          </div>
          {offList.length === 0 ? (
            <p className="fl-muted small">No vehicles are off the road{depot === "ALL" ? "" : ` at ${depot}`}.</p>
          ) : (
            <ul className="dl-offroad-list">
              {offList.map((o) => {
                const v = vehicleMap[o.vehicleId];
                return (
                  <li key={o.id}>
                    <div>
                      <strong>{o.vehicleId}</strong> {v ? `${v.type === "van" ? "van" : "lorry"}, ${v.temp}, ${v.depot}` : ""}
                      <span className="fl-sub">{shortDate(o.date)} · {o.reason}</span>
                    </div>
                    <button className="fl-icon-btn" onClick={() => removeOffRoad(o.id)} aria-label={`Put ${o.vehicleId} back in the plan`} title="Put back in the plan">
                      <Trash2 size={15} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="dl-box">
          <h3 className="fl-section-title first"><Settings2 size={15} /> Planning rules</h3>
          <div className="dl-settings">
            <label>Drops per van trip {num("vanDropsPerTrip", 1, 10)}</label>
            <label>Drops per lorry trip {num("truckDropsPerTrip", 1, 12)}</label>
            <label>Trips per vehicle per day {num("tripsPerDay", 1, 3)}</label>
            <label>Look ahead for a new date (days) {num("horizonDays", 1, 21)}</label>
          </div>
          <button className="fl-btn primary block" disabled={!changed} onClick={() => savePlanningSettings(draft)}>
            {changed ? "Save rules and re-plan" : "Rules saved"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function DelayReport({ rows, depot, brand }) {
  const [reason, setReason] = useState("ALL");
  const [open, setOpen] = useState(null);
  const list = rows.filter((r) => reason === "ALL" || r.reasonCode === reason);

  const byReason = REASON_TYPES.map((t) => ({ ...t, count: list.filter((r) => r.reasonCode === t.value).length })).filter((t) => t.count);
  const byDepot = [...new Set(list.map((r) => r.depot))].map((d) => ({ depot: d, count: list.filter((r) => r.depot === d).length }));
  const days = list.map((r) => r.daysDelayed);
  const avg = days.length ? days.reduce((a, b) => a + b, 0) / days.length : 0;
  const generated = new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const download = () => {
    const blob = new Blob([delaysToCsv(list)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delayed-orders-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const print = () => {
    document.body.classList.add("dl-printing");
    const done = () => {
      document.body.classList.remove("dl-printing");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  return (
    <div className="dl-report">
      <div className="dl-report-head">
        <div>
          <h2>Delayed orders report</h2>
          <p className="fl-muted small">
            {depot === "ALL" ? "All depots" : `${depot} depot`}, {brand === "ALL" ? "all brands" : brand}
            {reason !== "ALL" ? `, ${reasonLabel(reason).toLowerCase()} only` : ""}. Generated {generated}.
          </p>
        </div>
        <div className="dl-report-actions dl-noprint">
          <select className="fl-select" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason type">
            <option value="ALL">All reasons</option>
            {REASON_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <button className="fl-btn" onClick={download} disabled={!list.length}><Download size={15} /> Download CSV</button>
          <button className="fl-btn" onClick={print} disabled={!list.length}><Printer size={15} /> Print report</button>
        </div>
      </div>

      <div className="dl-report-stats">
        <div><strong>{list.length}</strong><span>Delays recorded</span></div>
        <div><strong>{new Set(list.map((r) => r.outletId)).size}</strong><span>Stores notified</span></div>
        <div><strong>{avg ? avg.toFixed(1) : "0"}</strong><span>Average days delayed</span></div>
        <div><strong>{days.length ? Math.max(...days) : 0}</strong><span>Longest delay (days)</span></div>
        <div className="dl-breakdown">
          <span>By reason</span>
          {byReason.length ? byReason.map((t) => <em key={t.value}>{t.label} <b>{t.count}</b></em>) : <em>—</em>}
        </div>
        <div className="dl-breakdown">
          <span>By depot</span>
          {byDepot.length ? byDepot.map((d) => <em key={d.depot}>{d.depot} <b>{d.count}</b></em>) : <em>—</em>}
        </div>
      </div>

      {list.length > 0 && <p className="fl-muted small dl-noprint">Select a row to read the apology that was sent to the store.</p>}
      {list.length === 0 ? (
        <div className="dl-empty">
          <Store size={26} />
          <strong>No delays recorded yet.</strong>
          <p>When you reschedule an order and notify the store, it's added here with the reason and the new date.</p>
        </div>
      ) : (
        <div className="fl-table-wrap">
          <table className="fl-table compact dl-report-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Store</th>
                <th>Depot</th>
                <th>Was due</th>
                <th>New date</th>
                <th className="num">Days</th>
                <th>Reason</th>
                <th>Store notified</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <React.Fragment key={r.id}>
                <tr
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpen(open === r.id ? null : r.id))}
                  aria-expanded={open === r.id}
                  className={open === r.id ? "dl-row-on" : ""}
                >
                  <td>
                    <strong className="dl-ref">{r.orderRef}</strong>
                    <span className="fl-sub">{r.brand?.replace("Waypoint ", "")} · {r.category}</span>
                  </td>
                  <td>{r.outletId}<span className="fl-sub">{r.district}</span></td>
                  <td>{r.depot}</td>
                  <td>{shortDate(r.originalDate)}</td>
                  <td><strong>{shortDate(r.newDate)}</strong></td>
                  <td className="num">{r.daysDelayed}</td>
                  <td className="wrap"><ReasonBadge code={r.reasonCode} /><span className="dl-reason">{r.reasonText}</span></td>
                  <td>
                    {new Date(r.notifiedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    <span className="fl-sub">{r.source}</span>
                  </td>
                  <td>{r.createdBy}</td>
                </tr>
                {open === r.id && (
                  <tr className="dl-apology-row">
                    <td colSpan={9}>
                      <span className="dl-apology-label">Message sent to the store</span>
                      <pre className="dl-apology">{r.apology}</pre>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
