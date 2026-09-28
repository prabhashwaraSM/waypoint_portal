import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  Plus, Search, Snowflake, Truck, Fuel, Wrench, ClipboardCheck, X, Trash2,
  CheckCircle2, AlertTriangle, XCircle, MinusCircle, Navigation
} from "lucide-react";
import {
  VEHICLE_TYPES, TEMP_SPECS, DEPOTS, BRAND_OPTIONS, FUEL_TYPES, REFERENCE_DATE,
  registerVehicle, removeRegisteredVehicle, addMaintenanceRecord, addFuelRecord,
  fmtDate, typeLabel, tempLabel, conditionClass
} from "../../data/fleetStore";

const TABS = [
  { id: "details", label: "Vehicle details", icon: Truck },
  { id: "fuel", label: "Fuel information", icon: Fuel },
  { id: "maintenance", label: "Maintenance information", icon: Wrench },
  { id: "inspection", label: "Inspection summary", icon: ClipboardCheck }
];

const INSPECTION_ITEMS = [
  ["tyres", "Tyres"], ["brakes", "Brakes"], ["lights", "Lights"], ["engine_oil", "Engine oil"],
  ["coolant", "Coolant"], ["wipers", "Wipers"], ["body", "Body & doors"], ["reefer_unit", "Reefer unit"], ["documents", "Documents"]
];

const lkr = (n) => `Rs. ${Math.round(n).toLocaleString()}`;
const today = REFERENCE_DATE.toISOString().slice(0, 10);

export default function VehicleInformation() {
  const { fleet, reloadFleet, warehouse = "Peliyagoda" } = useOutletContext();
  const navigate = useNavigate();
  const { vehicles, maintenance, fuelLog, inspections, trips } = fleet;

  const [tab, setTab] = useState("details");
  const [search, setSearch] = useState("");
  const [depot, setDepot] = useState("ALL");
  const [type, setType] = useState("ALL");
  const [temp, setTemp] = useState("ALL");
  const [brand, setBrand] = useState("ALL");
  const [condition, setCondition] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null); // 'register' | 'service' | 'fuel'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles
      .filter((v) =>
        (!q || [v.id, v.registrationNo, v.driver, v.makeModel].some((x) => String(x).toLowerCase().includes(q))) &&
        (depot === "ALL" || v.depot === depot) &&
        (type === "ALL" || v.type === type) &&
        (temp === "ALL" || v.temp === temp) &&
        (brand === "ALL" || v.assignedBrand === brand) &&
        (condition === "ALL" || v.condition === condition)
      )
      .sort((a, b) => {
        const ad = a.depot === warehouse ? 0 : 1;
        const bd = b.depot === warehouse ? 0 : 1;
        return ad - bd || a.id.localeCompare(b.id);
      });
  }, [vehicles, search, depot, type, temp, brand, condition, warehouse]);

  const conditionCounts = ["Good", "Fair", "Needs attention", "In workshop"].map((c) => ({
    c,
    n: vehicles.filter((v) => v.condition === c).length
  }));

  const selected = vehicles.find((v) => v.id === selectedId);
  const onTripIds = new Set(trips.map((t) => t.vehicle_id));

  return (
    <>
      {/* Condition overview doubles as a filter */}
      <section className="fl-condition-strip">
        <button className={`fl-cond-tile ${condition === "ALL" ? "on" : ""}`} onClick={() => setCondition("ALL")}>
          <strong>{vehicles.length}</strong>
          <span>All vehicles</span>
        </button>
        {conditionCounts.map(({ c, n }) => (
          <button
            key={c}
            className={`fl-cond-tile ${conditionClass(c)} ${condition === c ? "on" : ""}`}
            onClick={() => setCondition(condition === c ? "ALL" : c)}
          >
            <strong>{n}</strong>
            <span>{c}</span>
          </button>
        ))}
        <button className="fl-btn primary fl-register-btn" onClick={() => setModal("register")}>
          <Plus size={17} /> Register vehicle
        </button>
      </section>

      <div className="fl-card">
        <div className="fl-tabs" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} role="tab" aria-selected={tab === id} className={`fl-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="fl-filters">
          <label className="fl-search">
            <Search size={15} />
            <input placeholder="Search ID, number plate, driver, model" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <select className="fl-select" value={depot} onChange={(e) => setDepot(e.target.value)}>
            <option value="ALL">All depots</option>
            {DEPOTS.map((d) => <option key={d} value={d}>{d} Depot</option>)}
          </select>
          <select className="fl-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="ALL">All vehicle types</option>
            {VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="fl-select" value={temp} onChange={(e) => setTemp(e.target.value)}>
            <option value="ALL">All temperature specs</option>
            {TEMP_SPECS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="fl-select" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="ALL">All brands</option>
            {BRAND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <span className="fl-count">{filtered.length} shown</span>
          {tab === "maintenance" && (
            <button className="fl-btn" onClick={() => setModal("service")}><Wrench size={15} /> Record service</button>
          )}
          {tab === "fuel" && (
            <button className="fl-btn" onClick={() => setModal("fuel")}><Fuel size={15} /> Record fuel fill</button>
          )}
        </div>

        {tab === "details" && <DetailsTable rows={filtered} onOpen={setSelectedId} onTripIds={onTripIds} />}
        {tab === "fuel" && <FuelTab rows={filtered} fuelLog={fuelLog} onOpen={setSelectedId} />}
        {tab === "maintenance" && <MaintenanceTab rows={filtered} maintenance={maintenance} onOpen={setSelectedId} />}
        {tab === "inspection" && <InspectionTab rows={filtered} inspections={inspections} onOpen={setSelectedId} />}
      </div>

      {selected && (
        <VehicleDrawer
          v={selected}
          maintenance={maintenance.filter((m) => m.vehicle_id === selected.id)}
          fuelLog={fuelLog.filter((f) => f.vehicle_id === selected.id)}
          onTrip={trips.find((t) => t.vehicle_id === selected.id)}
          onClose={() => setSelectedId(null)}
          onTrack={(tripId) => navigate(`/fleet/tracking?trip=${tripId}`)}
          onRemove={
            selected.registeredInApp
              ? () => {
                  removeRegisteredVehicle(selected.id);
                  setSelectedId(null);
                  reloadFleet();
                }
              : null
          }
        />
      )}

      {modal === "register" && (
        <RegisterVehicleModal
          existingIds={vehicles.map((v) => v.id)}
          defaultDepot={warehouse}
          onClose={() => setModal(null)}
          onSave={(v) => {
            registerVehicle(v);
            setModal(null);
            reloadFleet();
            setSelectedId(v.vehicle_id);
          }}
        />
      )}
      {modal === "service" && (
        <RecordServiceModal
          vehicles={vehicles}
          onClose={() => setModal(null)}
          onSave={(rec) => {
            addMaintenanceRecord(rec);
            setModal(null);
            reloadFleet();
          }}
        />
      )}
      {modal === "fuel" && (
        <RecordFuelModal
          vehicles={vehicles}
          onClose={() => setModal(null)}
          onSave={(rec) => {
            addFuelRecord(rec);
            setModal(null);
            reloadFleet();
          }}
        />
      )}
    </>
  );
}

/* ---------------- small building blocks ---------------- */

function CategoryChips({ v }) {
  return (
    <span className="fl-chips">
      <span className="fl-chip">{typeLabel(v.type)}</span>
      <span className={`fl-chip ${v.temp === "reefer" ? "cold" : ""}`}>
        {v.temp === "reefer" && <Snowflake size={11} />} {tempLabel(v.temp)}
      </span>
    </span>
  );
}

function ConditionBadge({ v }) {
  return <span className={`fl-badge ${conditionClass(v.condition)}`}>{v.condition}</span>;
}

function HealthBar({ score }) {
  const cls = score >= 80 ? "good" : score >= 60 ? "fair" : "bad";
  return (
    <span className="fl-health" title={`Health score ${score}/100`}>
      <span className="fl-health-track"><span className={`fl-health-fill ${cls}`} style={{ width: `${score}%` }} /></span>
      <b>{score}</b>
    </span>
  );
}

function Empty({ children }) {
  return <div className="fl-empty">{children}</div>;
}

/* ---------------- tab: details ---------------- */

function DetailsTable({ rows, onOpen, onTripIds }) {
  if (!rows.length) return <Empty>No vehicles match these filters. Clear a filter or register a new vehicle.</Empty>;
  return (
    <div className="fl-table-wrap">
      <table className="fl-table">
        <thead>
          <tr>
            <th>Vehicle</th><th>Category</th><th>Depot</th><th>Brand</th><th>Make & model</th>
            <th className="num">Capacity</th><th>Driver</th><th className="num">Odometer</th><th>Health</th><th>Condition</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((v) => (
            <tr key={v.id} onClick={() => onOpen(v.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onOpen(v.id)}>
              <td>
                <strong>{v.id}</strong>
                <small className="fl-sub">{v.registrationNo}{v.registeredInApp && " · new"}</small>
              </td>
              <td><CategoryChips v={v} /></td>
              <td>{v.depot}</td>
              <td>{v.assignedBrand}</td>
              <td>{v.makeModel}<small className="fl-sub">{v.year}</small></td>
              <td className="num">{v.weightCapKg.toLocaleString()} kg<small className="fl-sub">{v.volumeCapM3.toFixed(1)} m³</small></td>
              <td>
                {v.driver}
                {onTripIds.has(v.id) && <small className="fl-sub on-trip">On a trip today</small>}
              </td>
              <td className="num">{v.odometerKm.toLocaleString()} km</td>
              <td><HealthBar score={v.healthScore} /></td>
              <td><ConditionBadge v={v} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- tab: fuel ---------------- */

function FuelTab({ rows, fuelLog, onOpen }) {
  const ids = new Set(rows.map((r) => r.id));
  const inScope = rows.filter((r) => r.fuel.fills > 0);
  const totalL = inScope.reduce((s, v) => s + v.fuel.litresTotal, 0);
  const totalKm = inScope.reduce((s, v) => s + v.fuel.kmTotal, 0);
  const totalCost = inScope.reduce((s, v) => s + v.fuel.costTotal, 0);
  const poor = rows.filter((v) => v.fuel.status === "Poor").length;
  const overQuota = rows.filter((v) => (v.fuel.quotaUsePct || 0) > 100).length;
  const recent = fuelLog.filter((f) => ids.has(f.vehicle_id)).sort((a, b) => (a.fill_date < b.fill_date ? 1 : -1)).slice(0, 12);

  return (
    <>
      <div className="fl-kpis">
        <Kpi label="Fuel used, last 28 days" value={`${Math.round(totalL).toLocaleString()} L`} />
        <Kpi label="Distance covered" value={`${Math.round(totalKm).toLocaleString()} km`} />
        <Kpi label="Fleet average" value={`${totalL ? (totalKm / totalL).toFixed(2) : "—"} km/L`} />
        <Kpi label="Fuel cost" value={lkr(totalCost)} />
        <Kpi label="Poor efficiency" value={poor} tone={poor ? "bad" : ""} />
        <Kpi label="Over weekly quota" value={overQuota} tone={overQuota ? "warn" : ""} />
      </div>
      {!rows.length ? (
        <Empty>No vehicles match these filters.</Empty>
      ) : (
        <div className="fl-table-wrap">
          <table className="fl-table">
            <thead>
              <tr>
                <th>Vehicle</th><th>Category</th><th className="num">Rated</th><th className="num">Actual</th>
                <th>Efficiency vs rated</th><th className="num">Distance</th><th className="num">Litres</th>
                <th className="num">Cost</th><th>Weekly use vs quota</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => {
                const f = v.fuel;
                return (
                  <tr key={v.id} onClick={() => onOpen(v.id)}>
                    <td><strong>{v.id}</strong><small className="fl-sub">{v.fuelType}</small></td>
                    <td><CategoryChips v={v} /></td>
                    <td className="num">{v.kmPerL} km/L</td>
                    <td className="num"><strong>{f.actualKmPerL ? f.actualKmPerL.toFixed(2) : "—"}</strong> km/L</td>
                    <td>{f.efficiencyPct ? <Meter pct={f.efficiencyPct} max={110} tone={f.status === "Poor" ? "bad" : f.status === "Watch" ? "fair" : "good"} label={`${f.efficiencyPct.toFixed(0)}%`} /> : "—"}</td>
                    <td className="num">{Math.round(f.kmTotal).toLocaleString()} km</td>
                    <td className="num">{f.litresTotal.toFixed(0)} L</td>
                    <td className="num">{lkr(f.costTotal)}</td>
                    <td>{f.quotaUsePct ? <Meter pct={f.quotaUsePct} max={130} tone={f.quotaUsePct > 100 ? "bad" : f.quotaUsePct > 90 ? "fair" : "good"} label={`${f.weeklyAvgL.toFixed(0)} / ${v.weeklyFuelQuotaL} L`} /> : "—"}</td>
                    <td><span className={`fl-badge ${f.status === "Poor" ? "bad" : f.status === "Watch" ? "fair" : f.status === "Good" ? "good" : ""}`}>{f.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <h3 className="fl-section-title">Latest fuel fills</h3>
      <div className="fl-table-wrap">
        <table className="fl-table compact">
          <thead>
            <tr><th>Date</th><th>Vehicle</th><th>Station</th><th className="num">Litres</th><th className="num">Odometer</th><th className="num">Km since last fill</th><th className="num">Cost</th></tr>
          </thead>
          <tbody>
            {recent.map((f) => (
              <tr key={f.fuel_id}>
                <td>{fmtDate(f.fill_date)}</td><td><strong>{f.vehicle_id}</strong></td><td>{f.station}</td>
                <td className="num">{f.litres.toFixed(1)} L</td><td className="num">{f.odometer_km.toLocaleString()} km</td>
                <td className="num">{f.km_since_last_fill.toLocaleString()} km</td><td className="num">{lkr(f.cost_lkr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Kpi({ label, value, tone = "" }) {
  return (
    <div className={`fl-kpi ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Meter({ pct, max = 100, tone, label }) {
  return (
    <span className="fl-meter">
      <span className="fl-meter-track"><span className={`fl-meter-fill ${tone}`} style={{ width: `${Math.min(100, (pct / max) * 100)}%` }} /></span>
      <span className="fl-meter-label">{label}</span>
    </span>
  );
}

/* ---------------- tab: maintenance ---------------- */

function MaintenanceTab({ rows, maintenance, onOpen }) {
  const [view, setView] = useState("schedule");
  const ids = new Set(rows.map((r) => r.id));
  const overdue = rows.filter((v) => v.maintStatus === "Overdue").length;
  const soon = rows.filter((v) => v.maintStatus === "Due soon").length;
  const shop = rows.filter((v) => v.inWorkshop).length;
  const spend = maintenance.filter((m) => ids.has(m.vehicle_id)).reduce((s, m) => s + m.cost_lkr, 0);

  const order = { Overdue: 0, "Due soon": 1, "No record": 2, "On schedule": 3 };
  const sorted = [...rows].sort((a, b) => order[a.maintStatus] - order[b.maintStatus] || (a.daysToService ?? 0) - (b.daysToService ?? 0));
  const history = maintenance.filter((m) => ids.has(m.vehicle_id)).sort((a, b) => (a.service_date < b.service_date ? 1 : -1));

  return (
    <>
      <div className="fl-kpis">
        <Kpi label="Service overdue" value={overdue} tone={overdue ? "bad" : ""} />
        <Kpi label="Due in next 14 days / 1,000 km" value={soon} tone={soon ? "warn" : ""} />
        <Kpi label="In workshop now" value={shop} />
        <Kpi label="Maintenance spend on record" value={lkr(spend)} />
      </div>
      <div className="fl-seg">
        <button className={view === "schedule" ? "on" : ""} onClick={() => setView("schedule")}>Service schedule</button>
        <button className={view === "history" ? "on" : ""} onClick={() => setView("history")}>Service history</button>
      </div>
      {view === "schedule" ? (
        <div className="fl-table-wrap">
          <table className="fl-table">
            <thead>
              <tr>
                <th>Vehicle</th><th>Category</th><th>Last service</th><th className="num">At odometer</th>
                <th>Next due</th><th className="num">Due at</th><th className="num">Remaining</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v) => (
                <tr key={v.id} onClick={() => onOpen(v.id)}>
                  <td><strong>{v.id}</strong><small className="fl-sub">{v.registrationNo}</small></td>
                  <td><CategoryChips v={v} /></td>
                  <td>{fmtDate(v.lastServiceDate)}</td>
                  <td className="num">{v.lastServiceKm ? `${v.lastServiceKm.toLocaleString()} km` : "—"}</td>
                  <td>{fmtDate(v.nextDueDate)}</td>
                  <td className="num">{v.nextDueKm.toLocaleString()} km</td>
                  <td className="num">
                    {v.daysToService !== null ? `${v.daysToService} days` : "—"}
                    <small className="fl-sub">{v.kmToService !== null ? `${v.kmToService.toLocaleString()} km` : ""}</small>
                  </td>
                  <td>
                    {v.inWorkshop ? (
                      <span className="fl-badge shop">In workshop</span>
                    ) : (
                      <span className={`fl-badge ${v.maintStatus === "Overdue" ? "bad" : v.maintStatus === "Due soon" ? "fair" : "good"}`}>{v.maintStatus}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="fl-table-wrap">
          <table className="fl-table compact">
            <thead>
              <tr><th>Ref</th><th>Date</th><th>Vehicle</th><th>Service</th><th>Workshop</th><th className="num">Odometer</th><th className="num">Cost</th><th>Status</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {history.map((m) => (
                <tr key={m.maintenance_id}>
                  <td>{m.maintenance_id}</td><td>{fmtDate(m.service_date)}</td><td><strong>{m.vehicle_id}</strong></td>
                  <td>{m.service_type}</td><td>{m.workshop}</td><td className="num">{m.odometer_km.toLocaleString()} km</td>
                  <td className="num">{lkr(m.cost_lkr)}</td>
                  <td><span className={`fl-badge ${m.status === "Completed" ? "good" : "shop"}`}>{m.status}</span></td>
                  <td className="wrap">{m.technician_notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* ---------------- tab: inspections ---------------- */

function InspectionMark({ value }) {
  if (value === "OK") return <CheckCircle2 size={16} className="fl-mark ok" aria-label="OK" />;
  if (value === "Attention") return <AlertTriangle size={16} className="fl-mark warn" aria-label="Needs attention" />;
  if (value === "Fail") return <XCircle size={16} className="fl-mark bad" aria-label="Fail" />;
  return <MinusCircle size={16} className="fl-mark na" aria-label="Not applicable" />;
}

function InspectionTab({ rows, onOpen }) {
  const withInsp = rows.filter((v) => v.lastInspection);
  const pass = withInsp.filter((v) => v.lastInspection.result === "Pass").length;
  const notes = withInsp.filter((v) => v.lastInspection.result === "Pass with notes").length;
  const fail = withInsp.filter((v) => v.lastInspection.result === "Fail").length;
  const overdue = rows.filter((v) => v.inspectionOverdue).length;
  const order = { Fail: 0, "Pass with notes": 1, Pass: 2 };
  const sorted = [...rows].sort(
    (a, b) => (order[a.lastInspection?.result] ?? -1) - (order[b.lastInspection?.result] ?? -1) || (b.daysSinceInspection ?? 999) - (a.daysSinceInspection ?? 999)
  );

  return (
    <>
      <div className="fl-kpis">
        <Kpi label="Passed" value={pass} />
        <Kpi label="Passed with defects" value={notes} tone={notes ? "warn" : ""} />
        <Kpi label="Failed" value={fail} tone={fail ? "bad" : ""} />
        <Kpi label="Inspection older than 30 days" value={overdue} tone={overdue ? "warn" : ""} />
      </div>
      <div className="fl-legend">
        <span><InspectionMark value="OK" /> OK</span>
        <span><InspectionMark value="Attention" /> Needs attention</span>
        <span><InspectionMark value="Fail" /> Fail</span>
        <span><InspectionMark value="N/A" /> Not applicable</span>
      </div>
      <div className="fl-table-wrap">
        <table className="fl-table">
          <thead>
            <tr>
              <th>Vehicle</th><th>Last inspection</th>
              {INSPECTION_ITEMS.map(([k, label]) => <th key={k} className="center">{label}</th>)}
              <th>Result</th><th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((v) => {
              const i = v.lastInspection;
              return (
                <tr key={v.id} onClick={() => onOpen(v.id)}>
                  <td><strong>{v.id}</strong><small className="fl-sub">{typeLabel(v.type)}, {tempLabel(v.temp)}</small></td>
                  <td>
                    {i ? fmtDate(i.inspection_date) : "Never"}
                    <small className={`fl-sub ${v.inspectionOverdue ? "late" : ""}`}>
                      {i ? `${v.daysSinceInspection} days ago · ${i.inspector}` : "Schedule an inspection"}
                    </small>
                  </td>
                  {INSPECTION_ITEMS.map(([k]) => <td key={k} className="center">{i ? <InspectionMark value={i[k]} /> : "—"}</td>)}
                  <td>{i ? <span className={`fl-badge ${i.result === "Fail" ? "bad" : i.result === "Pass" ? "good" : "fair"}`}>{i.result}</span> : "—"}</td>
                  <td className="wrap">{i?.remarks || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ---------------- drawer ---------------- */

function VehicleDrawer({ v, maintenance, fuelLog, onTrip, onClose, onTrack, onRemove }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const history = [...maintenance].sort((a, b) => (a.service_date < b.service_date ? 1 : -1)).slice(0, 4);
  const fills = [...fuelLog].sort((a, b) => (a.fill_date < b.fill_date ? 1 : -1)).slice(0, 4);
  const docTone = (d) => (d === null ? "" : d < 0 ? "bad" : d <= 30 ? "fair" : "");

  return (
    <div className="fl-overlay" onClick={onClose}>
      <aside className="fl-drawer" onClick={(e) => e.stopPropagation()} aria-label={`Vehicle ${v.id}`}>
        <header className="fl-drawer-head">
          <div>
            <h2>{v.id}</h2>
            <p>{v.registrationNo} · {v.makeModel} ({v.year})</p>
            <CategoryChips v={v} />
          </div>
          <button className="fl-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>

        <section className={`fl-health-panel ${conditionClass(v.condition)}`}>
          <div className="fl-score">
            <strong>{v.healthScore}</strong>
            <span>/100</span>
          </div>
          <div>
            <ConditionBadge v={v} />
            <ul className="fl-issues">
              {v.issues.length ? v.issues.map((x) => <li key={x}>{x}</li>) : <li>No open issues</li>}
            </ul>
          </div>
        </section>

        {onTrip && (
          <button className="fl-btn primary block" onClick={() => onTrack(onTrip.trip_id)}>
            <Navigation size={16} /> Track trip {onTrip.trip_id}
          </button>
        )}

        <dl className="fl-dl">
          <div><dt>Depot</dt><dd>{v.depot}</dd></div>
          <div><dt>Assigned brand</dt><dd>{v.assignedBrand}</dd></div>
          <div><dt>Driver</dt><dd>{v.driver}</dd></div>
          <div><dt>Fuel type</dt><dd>{v.fuelType}</dd></div>
          <div><dt>Weight capacity</dt><dd>{v.weightCapKg.toLocaleString()} kg</dd></div>
          <div><dt>Volume capacity</dt><dd>{v.volumeCapM3.toFixed(1)} m³</dd></div>
          <div><dt>Tank</dt><dd>{v.tankCapacityL} L</dd></div>
          <div><dt>Odometer</dt><dd>{v.odometerKm.toLocaleString()} km</dd></div>
          <div><dt>Insurance expiry</dt><dd className={docTone(v.insuranceDays)}>{fmtDate(v.insuranceExpiry)}</dd></div>
          <div><dt>Revenue licence expiry</dt><dd className={docTone(v.licenceDays)}>{fmtDate(v.licenceExpiry)}</dd></div>
        </dl>

        <h3 className="fl-section-title">Fuel, last 28 days</h3>
        <dl className="fl-dl">
          <div><dt>Rated economy</dt><dd>{v.kmPerL} km/L</dd></div>
          <div><dt>Actual economy</dt><dd>{v.fuel.actualKmPerL ? `${v.fuel.actualKmPerL.toFixed(2)} km/L` : "—"}</dd></div>
          <div><dt>Efficiency</dt><dd className={v.fuel.status === "Poor" ? "bad" : v.fuel.status === "Watch" ? "fair" : ""}>{v.fuel.efficiencyPct ? `${v.fuel.efficiencyPct.toFixed(0)}% (${v.fuel.status})` : "—"}</dd></div>
          <div><dt>Weekly use / quota</dt><dd>{v.fuel.weeklyAvgL.toFixed(0)} / {v.weeklyFuelQuotaL} L</dd></div>
        </dl>
        {fills.length > 0 && (
          <ul className="fl-mini-list">
            {fills.map((f) => <li key={f.fuel_id}><span>{fmtDate(f.fill_date)}</span><span>{f.litres.toFixed(1)} L at {f.station}</span></li>)}
          </ul>
        )}

        <h3 className="fl-section-title">Maintenance</h3>
        <dl className="fl-dl">
          <div><dt>Last service</dt><dd>{fmtDate(v.lastServiceDate)}</dd></div>
          <div><dt>Next due</dt><dd className={v.maintStatus === "Overdue" ? "bad" : v.maintStatus === "Due soon" ? "fair" : ""}>{fmtDate(v.nextDueDate)} or {v.nextDueKm.toLocaleString()} km</dd></div>
        </dl>
        <ul className="fl-mini-list">
          {history.length ? history.map((m) => <li key={m.maintenance_id}><span>{fmtDate(m.service_date)}</span><span>{m.service_type} · {m.status}</span></li>) : <li>No service history</li>}
        </ul>

        <h3 className="fl-section-title">Latest inspection</h3>
        {v.lastInspection ? (
          <>
            <p className="fl-muted">{fmtDate(v.lastInspection.inspection_date)} by {v.lastInspection.inspector}: <b>{v.lastInspection.result}</b></p>
            <div className="fl-insp-grid">
              {INSPECTION_ITEMS.map(([k, label]) => (
                <span key={k}><InspectionMark value={v.lastInspection[k]} /> {label}</span>
              ))}
            </div>
            <p className="fl-muted">{v.lastInspection.remarks}</p>
          </>
        ) : (
          <p className="fl-muted">No inspection recorded yet.</p>
        )}

        {onRemove && (
          <button className="fl-btn danger block" onClick={onRemove}><Trash2 size={15} /> Remove this vehicle</button>
        )}
      </aside>
    </div>
  );
}

/* ---------------- modals ---------------- */

function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fl-overlay center" onClick={onClose}>
      <div className={`fl-modal ${wide ? "wide" : ""}`} role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="fl-modal-head">
          <h2>{title}</h2>
          <button className="fl-icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="fl-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function nextVehicleId(ids) {
  const max = ids.reduce((m, id) => Math.max(m, Number(String(id).replace(/\D/g, "")) || 0), 0);
  return `VEH${String(max + 1).padStart(3, "0")}`;
}

function RegisterVehicleModal({ existingIds, defaultDepot, onClose, onSave }) {
  const [f, setF] = useState({
    vehicle_id: nextVehicleId(existingIds),
    registration_no: "",
    type: "truck",
    temp: "ambient",
    depot: DEPOTS.includes(defaultDepot) ? defaultDepot : "Peliyagoda",
    assigned_brand: "Shared",
    fuel_type: "diesel",
    make_model: "",
    year: "2024",
    weight_cap_kg: "4000",
    volume_cap_m3: "20",
    km_per_l: "5.5",
    weekly_fuel_quota_l: "400",
    tank_capacity_l: "150",
    odometer_km: "0",
    driver_name: "",
    last_service_date: today,
    insurance_expiry: "",
    revenue_licence_expiry: ""
  });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const id = f.vehicle_id.trim().toUpperCase();
    if (!id) return setErr("Enter a vehicle ID.");
    if (existingIds.includes(id)) return setErr(`${id} is already in the fleet. Use a different ID.`);
    if (!f.registration_no.trim()) return setErr("Enter the number plate.");
    if (Number(f.weight_cap_kg) <= 0 || Number(f.volume_cap_m3) <= 0) return setErr("Capacity must be greater than zero.");
    if (Number(f.km_per_l) <= 0) return setErr("Enter the rated fuel economy in km/L.");
    onSave({
      ...f,
      vehicle_id: id,
      registration_no: f.registration_no.trim().toUpperCase(),
      last_service_km: f.odometer_km,
      service_interval_km: f.type === "van" ? 7500 : 10000,
      service_interval_days: 90,
      status: "active"
    });
  };

  return (
    <Modal title="Register vehicle" onClose={onClose} wide>
      <form onSubmit={submit} className="fl-form">
        <fieldset>
          <legend>Identity</legend>
          <Field label="Vehicle ID"><input value={f.vehicle_id} onChange={set("vehicle_id")} /></Field>
          <Field label="Number plate"><input value={f.registration_no} onChange={set("registration_no")} placeholder="WP LK-1234" /></Field>
          <Field label="Make & model"><input value={f.make_model} onChange={set("make_model")} placeholder="Isuzu Elf NPR" /></Field>
          <Field label="Year"><input type="number" value={f.year} onChange={set("year")} /></Field>
        </fieldset>
        <fieldset>
          <legend>Category</legend>
          <Field label="Vehicle type">
            <select value={f.type} onChange={set("type")}>{VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
          </Field>
          <Field label="Temperature spec">
            <select value={f.temp} onChange={set("temp")}>{TEMP_SPECS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
          </Field>
          <Field label="Depot">
            <select value={f.depot} onChange={set("depot")}>{DEPOTS.map((d) => <option key={d}>{d}</option>)}</select>
          </Field>
          <Field label="Assigned brand" hint="Chilled Waypoint Fresh orders need a reefer">
            <select value={f.assigned_brand} onChange={set("assigned_brand")}>{BRAND_OPTIONS.map((b) => <option key={b}>{b}</option>)}</select>
          </Field>
        </fieldset>
        <fieldset>
          <legend>Capacity & fuel</legend>
          <Field label="Weight capacity (kg)"><input type="number" value={f.weight_cap_kg} onChange={set("weight_cap_kg")} /></Field>
          <Field label="Volume capacity (m³)"><input type="number" step="0.1" value={f.volume_cap_m3} onChange={set("volume_cap_m3")} /></Field>
          <Field label="Fuel type">
            <select value={f.fuel_type} onChange={set("fuel_type")}>{FUEL_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Rated economy (km/L)"><input type="number" step="0.1" value={f.km_per_l} onChange={set("km_per_l")} /></Field>
          <Field label="Weekly fuel quota (L)"><input type="number" value={f.weekly_fuel_quota_l} onChange={set("weekly_fuel_quota_l")} /></Field>
          <Field label="Tank capacity (L)"><input type="number" value={f.tank_capacity_l} onChange={set("tank_capacity_l")} /></Field>
        </fieldset>
        <fieldset>
          <legend>Operation & documents</legend>
          <Field label="Driver"><input value={f.driver_name} onChange={set("driver_name")} placeholder="Driver name" /></Field>
          <Field label="Odometer (km)"><input type="number" value={f.odometer_km} onChange={set("odometer_km")} /></Field>
          <Field label="Last service date"><input type="date" value={f.last_service_date} onChange={set("last_service_date")} /></Field>
          <Field label="Insurance expiry"><input type="date" value={f.insurance_expiry} onChange={set("insurance_expiry")} /></Field>
          <Field label="Revenue licence expiry"><input type="date" value={f.revenue_licence_expiry} onChange={set("revenue_licence_expiry")} /></Field>
        </fieldset>
        {err && <p className="fl-error">{err}</p>}
        <footer className="fl-modal-foot">
          <button type="button" className="fl-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="fl-btn primary"><Plus size={16} /> Register vehicle</button>
        </footer>
      </form>
    </Modal>
  );
}

function RecordServiceModal({ vehicles, onClose, onSave }) {
  const [f, setF] = useState({ vehicle_id: vehicles[0]?.id || "", service_type: "Full service", service_date: today, odometer_km: "", cost_lkr: "", workshop: "", status: "Completed", technician_notes: "" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const v = vehicles.find((x) => x.id === f.vehicle_id);
  const submit = (e) => {
    e.preventDefault();
    if (!f.vehicle_id) return setErr("Choose a vehicle.");
    onSave({ ...f, maintenance_id: `MNT-A${Date.now().toString().slice(-6)}`, odometer_km: Number(f.odometer_km) || v?.odometerKm || 0, cost_lkr: Number(f.cost_lkr) || 0 });
  };
  return (
    <Modal title="Record service" onClose={onClose}>
      <form onSubmit={submit} className="fl-form single">
        <Field label="Vehicle">
          <select value={f.vehicle_id} onChange={set("vehicle_id")}>{vehicles.map((x) => <option key={x.id} value={x.id}>{x.id} · {x.registrationNo}</option>)}</select>
        </Field>
        <Field label="Service type">
          <select value={f.service_type} onChange={set("service_type")}>
            {["Full service", "Oil & filter change", "Brake inspection", "Tyre rotation", "Wheel alignment", "Reefer unit service", "Repair"].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Date"><input type="date" value={f.service_date} onChange={set("service_date")} /></Field>
        <Field label="Odometer (km)" hint={v ? `Current reading ${v.odometerKm.toLocaleString()} km` : ""}><input type="number" value={f.odometer_km} onChange={set("odometer_km")} /></Field>
        <Field label="Cost (LKR)"><input type="number" value={f.cost_lkr} onChange={set("cost_lkr")} /></Field>
        <Field label="Workshop"><input value={f.workshop} onChange={set("workshop")} /></Field>
        <Field label="Status">
          <select value={f.status} onChange={set("status")}><option>Completed</option><option>In Progress</option></select>
        </Field>
        <Field label="Notes"><input value={f.technician_notes} onChange={set("technician_notes")} /></Field>
        {err && <p className="fl-error">{err}</p>}
        <footer className="fl-modal-foot">
          <button type="button" className="fl-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="fl-btn primary">Save service</button>
        </footer>
      </form>
    </Modal>
  );
}

function RecordFuelModal({ vehicles, onClose, onSave }) {
  const [f, setF] = useState({ vehicle_id: vehicles[0]?.id || "", fill_date: today, litres: "", km_since_last_fill: "", odometer_km: "", station: "", price_per_l_lkr: "289" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!(Number(f.litres) > 0)) return setErr("Enter the litres filled.");
    if (!(Number(f.km_since_last_fill) > 0)) return setErr("Enter the distance driven since the last fill.");
    onSave({ ...f, fuel_id: `FUL-A${Date.now().toString().slice(-6)}`, cost_lkr: Math.round(Number(f.litres) * Number(f.price_per_l_lkr || 0)) });
  };
  return (
    <Modal title="Record fuel fill" onClose={onClose}>
      <form onSubmit={submit} className="fl-form single">
        <Field label="Vehicle">
          <select value={f.vehicle_id} onChange={set("vehicle_id")}>{vehicles.map((x) => <option key={x.id} value={x.id}>{x.id} · {x.registrationNo}</option>)}</select>
        </Field>
        <Field label="Date"><input type="date" value={f.fill_date} onChange={set("fill_date")} /></Field>
        <Field label="Litres"><input type="number" step="0.1" value={f.litres} onChange={set("litres")} /></Field>
        <Field label="Km since last fill"><input type="number" value={f.km_since_last_fill} onChange={set("km_since_last_fill")} /></Field>
        <Field label="Odometer (km)"><input type="number" value={f.odometer_km} onChange={set("odometer_km")} /></Field>
        <Field label="Price per litre (LKR)"><input type="number" value={f.price_per_l_lkr} onChange={set("price_per_l_lkr")} /></Field>
        <Field label="Station"><input value={f.station} onChange={set("station")} /></Field>
        {err && <p className="fl-error">{err}</p>}
        <footer className="fl-modal-foot">
          <button type="button" className="fl-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="fl-btn primary">Save fuel fill</button>
        </footer>
      </form>
    </Modal>
  );
}
