import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Play, Pause, Gauge, Fuel, Thermometer, Snowflake, BatteryCharging, CircleDot,
  AlertTriangle, MapPin, Clock, Route, Search, ClipboardList
} from "lucide-react";
import { DEPOT_COORDS, conditionClass, typeLabel, tempLabel } from "../../data/fleetStore";
import {
  buildTrip, vehicleStateAt, movementLog, phaseLabel, toHHMM, toMinutes,
  fetchRoadGeometry, applyRoadGeometry, SPEED_LIMIT
} from "../../data/tripSim";

const DAY_START = 4 * 60;
const DAY_END = 20 * 60;
const SPEEDS = [1, 10, 30, 60];

export default function VehicleTracking() {
  const { fleet, warehouse = "Peliyagoda" } = useOutletContext();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const vehicleMap = useMemo(() => Object.fromEntries(fleet.vehicles.map((v) => [v.id, v])), [fleet.vehicles]);
  const basePlans = useMemo(
    () => fleet.trips.map((t) => buildTrip(t, vehicleMap[t.vehicle_id] || { id: t.vehicle_id }, fleet.outletMap, fleet.allowanceMap)).filter((p) => p.stops.length),
    [fleet.trips, vehicleMap, fleet.outletMap, fleet.allowanceMap]
  );
  const [roadGeo, setRoadGeo] = useState({});
  const plans = useMemo(() => basePlans.map((p) => (roadGeo[p.trip_id] ? applyRoadGeometry(p, roadGeo[p.trip_id]) : p)), [basePlans, roadGeo]);

  const requested = params.get("trip");
  const [selectedId, setSelectedId] = useState(requested || null);
  const [clock, setClock] = useState(() => {
    const req = basePlans.find((p) => p.trip_id === requested);
    return req ? req.startMin + 5 : 7 * 60 + 30;
  });
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(10);
  const [depotFilter, setDepotFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // simulated clock
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      setClock((c) => (c + speed / 60 >= DAY_END ? DAY_START : c + speed / 60));
    }, 1000);
    return () => clearInterval(id);
  }, [playing, speed]);

  const states = useMemo(() => Object.fromEntries(plans.map((p) => [p.trip_id, vehicleStateAt(p, clock)])), [plans, clock]);

  const visible = plans
    .filter((p) => depotFilter === "ALL" || p.depot === depotFilter)
    .filter((p) => {
      const q = search.trim().toLowerCase();
      return !q || [p.trip_id, p.vehicle_id, p.driver_name].some((x) => String(x).toLowerCase().includes(q));
    })
    .sort((a, b) => (a.depot === warehouse ? 0 : 1) - (b.depot === warehouse ? 0 : 1) || a.startMin - b.startMin);

  const selected = plans.find((p) => p.trip_id === selectedId) || null;
  const selState = selected ? states[selected.trip_id] : null;

  useEffect(() => {
    if (selectedId || !visible.length) return;
    const active = visible.find((p) => ["moving", "returning", "unloading"].includes(states[p.trip_id]?.phase));
    setSelectedId((active || visible[0]).trip_id);
  }, [selectedId, visible, states]);

  // road geometry for the selected trip
  useEffect(() => {
    if (!selected || roadGeo[selected.trip_id]) return;
    let cancelled = false;
    fetchRoadGeometry(selected).then((coords) => {
      if (!cancelled && coords) setRoadGeo((g) => ({ ...g, [selected.trip_id]: coords }));
    });
    return () => {
      cancelled = true;
    };
  }, [selected, roadGeo]);

  const selectTrip = (id) => {
    setSelectedId(id);
    setParams({ trip: id }, { replace: true });
  };

  const counts = {
    moving: plans.filter((p) => ["moving", "returning"].includes(states[p.trip_id].phase)).length,
    unloading: plans.filter((p) => states[p.trip_id].phase === "unloading").length,
    scheduled: plans.filter((p) => states[p.trip_id].phase === "scheduled").length,
    done: plans.filter((p) => states[p.trip_id].phase === "completed").length,
    alerts: plans.reduce((s, p) => s + states[p.trip_id].alerts.filter((a) => a.level === "bad").length, 0)
  };

  if (!plans.length) {
    return (
      <div className="fl-card">
        <div className="fl-empty">
          No trips to track yet. Create a route on the Dispatch page and it will appear here.
          <br />
          <button className="fl-btn primary" style={{ marginTop: 12 }} onClick={() => navigate("/dispatch")}>Go to Dispatch</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Simulation clock */}
      <section className="fl-clockbar">
        <div className="fl-clock">
          <Clock size={18} />
          <strong>{toHHMM(clock)}</strong>
          <span>trip clock</span>
        </div>
        <button className="fl-btn" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? "Pause" : "Play"}
        </button>
        <div className="fl-seg small" aria-label="Playback speed">
          {SPEEDS.map((s) => (
            <button key={s} className={speed === s ? "on" : ""} onClick={() => setSpeed(s)}>{s}×</button>
          ))}
        </div>
        <input
          className="fl-range"
          type="range"
          min={DAY_START}
          max={DAY_END}
          step={1}
          value={clock}
          onChange={(e) => setClock(Number(e.target.value))}
          aria-label="Trip clock"
        />
        <div className="fl-clock-stats">
          <span><b>{counts.moving}</b> moving</span>
          <span><b>{counts.unloading}</b> unloading</span>
          <span><b>{counts.scheduled}</b> not departed</span>
          <span><b>{counts.done}</b> completed</span>
          <span className={counts.alerts ? "bad" : ""}><b>{counts.alerts}</b> critical alerts</span>
        </div>
      </section>

      <div className="fl-track-grid">
        {/* Trip list */}
        <aside className="fl-card fl-trip-list">
          <div className="fl-trip-list-head">
            <label className="fl-search">
              <Search size={15} />
              <input placeholder="Trip, vehicle or driver" value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>
            <select className="fl-select" value={depotFilter} onChange={(e) => setDepotFilter(e.target.value)}>
              <option value="ALL">All depots</option>
              <option value="Peliyagoda">Peliyagoda</option>
              <option value="Kandy">Kandy</option>
            </select>
          </div>
          <ul>
            {visible.map((p) => {
              const s = states[p.trip_id];
              const v = p.vehicle;
              const bad = s.alerts.some((a) => a.level === "bad");
              return (
                <li key={p.trip_id}>
                  <button className={`fl-trip ${selected?.trip_id === p.trip_id ? "on" : ""}`} onClick={() => selectTrip(p.trip_id)}>
                    <span className="fl-trip-top">
                      <strong>{p.vehicle_id}</strong>
                      <span className={`fl-phase ${s.phase}`}>{phaseLabel(s, p)}</span>
                    </span>
                    <span className="fl-trip-meta">
                      {p.trip_id}, {p.driver_name}
                    </span>
                    <span className="fl-trip-bars">
                      <span className="fl-progress" title={`${Math.round(s.progress * 100)}% of route`}>
                        <span style={{ width: `${s.progress * 100}%` }} />
                      </span>
                      <span className={`fl-fuel-mini ${s.fuelPct < 20 ? "bad" : s.fuelPct < 35 ? "fair" : ""}`}>
                        <Fuel size={11} /> {s.fuelPct.toFixed(0)}%
                      </span>
                      <span className={`fl-dot ${conditionClass(v.condition)}`} title={`Condition: ${v.condition || "unknown"}`} />
                      {bad && <AlertTriangle size={13} className="fl-mark bad" aria-label="Critical alert" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Map */}
        <section className="fl-card fl-map-card">
          <FleetMap plans={visible} states={states} selected={selected} onSelect={selectTrip} />
          {selected && (
            <div className="fl-map-caption">
              <Route size={15} />
              <span>
                <b>{selected.trip_id}</b> {selected.depot} depot → {selected.stops.length} drops → depot, {selected.totalKm.toFixed(0)} km,
                {" "}{toHHMM(selected.startMin)}–{toHHMM(selected.endMin)}
                {!selected.roadGeometry && " (straight-line preview; road route loads when online)"}
              </span>
            </div>
          )}
        </section>

        {/* Telemetry */}
        {selected && selState && (
          <aside className="fl-telemetry">
            <TelemetryPanel plan={selected} s={selState} onOpenVehicle={() => navigate("/fleet/vehicles")} />
          </aside>
        )}
      </div>

      {selected && selState && (
        <div className="fl-track-bottom">
          <section className="fl-card">
            <h3 className="fl-section-title first">Route stops</h3>
            <StopTable plan={selected} clock={clock} />
          </section>
          <section className="fl-card">
            <h3 className="fl-section-title first">Movement log</h3>
            <MovementLog plan={selected} clock={clock} />
          </section>
        </div>
      )}
    </>
  );
}

/* ---------------- map ---------------- */

function vehicleIcon(selected, phase, alert) {
  const cls = `fl-veh-marker ${selected ? "sel" : ""} ${phase} ${alert ? "alert" : ""}`;
  return L.divIcon({ className: "", html: `<span class="${cls}"></span>`, iconSize: selected ? [22, 22] : [14, 14], iconAnchor: selected ? [11, 11] : [7, 7] });
}
function stopIcon(n, state) {
  return L.divIcon({ className: "", html: `<span class="fl-stop-marker ${state}">${n}</span>`, iconSize: [22, 22], iconAnchor: [11, 11] });
}
const depotIcon = L.divIcon({ className: "", html: `<span class="fl-depot-marker">D</span>`, iconSize: [26, 26], iconAnchor: [13, 13] });

function FleetMap({ plans, states, selected, onSelect }) {
  const el = useRef(null);
  const map = useRef(null);
  const layers = useRef({ others: null, route: null });
  const lastFit = useRef(null);

  useEffect(() => {
    if (map.current) return undefined;
    map.current = L.map(el.current, { zoomControl: true, attributionControl: true }).setView(DEPOT_COORDS.Peliyagoda, 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap contributors"
    }).addTo(map.current);
    Object.entries(DEPOT_COORDS).forEach(([name, c]) => L.marker(c, { icon: depotIcon }).bindTooltip(`${name} Depot`).addTo(map.current));
    layers.current.others = L.layerGroup().addTo(map.current);
    layers.current.route = L.layerGroup().addTo(map.current);
    return () => {
      map.current.remove();
      map.current = null;
    };
  }, []);

  // other vehicles
  useEffect(() => {
    const g = layers.current.others;
    if (!g) return;
    g.clearLayers();
    plans.forEach((p) => {
      if (p.trip_id === selected?.trip_id) return;
      const s = states[p.trip_id];
      if (s.phase === "scheduled" || s.phase === "completed") return;
      L.marker(s.position, { icon: vehicleIcon(false, s.phase, s.alerts.some((a) => a.level === "bad")) })
        .bindTooltip(`${p.vehicle_id}: ${phaseLabel(s, p)}`)
        .on("click", () => onSelect(p.trip_id))
        .addTo(g);
    });
  }, [plans, states, selected, onSelect]);

  // selected route
  useEffect(() => {
    const g = layers.current.route;
    if (!g || !selected) return;
    g.clearLayers();
    const s = states[selected.trip_id];
    const full = selected.legs.flatMap((l) => l.geometry);
    L.polyline(full, { color: "#94a3b8", weight: 4, dashArray: "6 8", opacity: 0.9 }).addTo(g);
    if (s.donePath.length > 1) L.polyline(s.donePath, { color: "#4f46e5", weight: 5, opacity: 0.95 }).addTo(g);
    selected.stops.forEach((st, i) => {
      const pointIndex = i + 1;
      const state = s.stopsDone >= pointIndex ? "done" : s.phase === "unloading" && s.atPoint === pointIndex ? "now" : "todo";
      L.marker(st.coord, { icon: stopIcon(i + 1, state) })
        .bindTooltip(`${i + 1}. ${st.id} (${st.district})${st.windowOpen ? `, window ${st.windowOpen}–${st.windowClose}` : ""}`)
        .addTo(g);
    });
    L.marker(s.position, { icon: vehicleIcon(true, s.phase, s.alerts.some((a) => a.level === "bad")), zIndexOffset: 1000 })
      .bindTooltip(`${selected.vehicle_id}, ${s.speed.toFixed(0)} km/h`, { direction: "top", offset: [0, -10] })
      .addTo(g);

    const key = `${selected.trip_id}-${selected.roadGeometry ? "r" : "s"}`;
    if (lastFit.current !== key) {
      map.current.invalidateSize();
      map.current.fitBounds(L.latLngBounds(full), { padding: [40, 40], animate: false });
      lastFit.current = key;
    }
  }, [selected, states]);

  useEffect(() => {
    const t = setTimeout(() => map.current?.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, []);

  return <div ref={el} className="fl-map" role="application" aria-label="Vehicle tracking map" />;
}

/* ---------------- telemetry ---------------- */

function Dial({ icon: Icon, label, value, unit, tone = "", sub }) {
  return (
    <div className={`fl-dial ${tone}`}>
      <span className="fl-dial-label"><Icon size={14} /> {label}</span>
      <strong>{value}<small>{unit}</small></strong>
      {sub && <span className="fl-dial-sub">{sub}</span>}
    </div>
  );
}

function TelemetryPanel({ plan, s, onOpenVehicle }) {
  const v = plan.vehicle;
  const idle = s.phase === "scheduled" || s.phase === "completed";
  return (
    <>
      <section className="fl-card fl-tele-head">
        <div className="fl-tele-title">
          <div>
            <h2>{plan.vehicle_id}</h2>
            <p>{v.registrationNo}, {typeLabel(v.type)}, {tempLabel(v.temp)}</p>
            <p>{plan.driver_name} · {plan.brand}</p>
          </div>
          <span className={`fl-phase big ${s.phase}`}>{phaseLabel(s, plan)}</span>
        </div>
        {s.nextStop && (
          <p className="fl-next">
            <MapPin size={14} /> Next: <b>{s.nextStop.id === "DEPOT_RETURN" ? s.nextStop.name : `${s.nextStop.id} (${s.nextStop.district})`}</b>
            {s.eta && <> · ETA <b>{toHHMM(s.eta)}</b></>}
          </p>
        )}
        <div className="fl-route-progress">
          <span style={{ width: `${s.progress * 100}%` }} />
        </div>
        <p className="fl-muted small">
          {s.kmDone.toFixed(1)} of {plan.totalKm.toFixed(0)} km, {s.stopsDone} of {plan.stops.length} drops delivered
        </p>
      </section>

      <section className="fl-card">
        <FuelGauge pct={s.fuelPct} litres={s.fuelL} tank={v.tankCapacityL} range={s.rangeKm} />
        <div className="fl-dials">
          <Dial icon={Gauge} label="Speed" value={s.speed.toFixed(0)} unit=" km/h" tone={s.speed > SPEED_LIMIT ? "bad" : ""} sub={`Limit ${SPEED_LIMIT}`} />
          <Dial icon={Thermometer} label="Engine" value={idle ? "Off" : s.engineTemp.toFixed(0)} unit={idle ? "" : " °C"} tone={s.engineTemp > 100 ? "bad" : ""} sub="Normal 85–100" />
          {s.reeferTemp !== null ? (
            <Dial icon={Snowflake} label="Cargo" value={s.reeferTemp.toFixed(1)} unit=" °C" tone={s.reeferTemp > 5 ? "fair" : ""} sub="Keep 0–5" />
          ) : (
            <Dial icon={BatteryCharging} label="Battery" value={s.battery.toFixed(1)} unit=" V" />
          )}
          <Dial icon={CircleDot} label="Tyres" value={`${s.tyreFront.toFixed(0)}/${s.tyreRear.toFixed(0)}`} unit=" psi" tone={s.tyreRear < 95 ? "fair" : ""} sub="Front / rear" />
        </div>
      </section>

      <section className="fl-card">
        <div className="fl-cond-head">
          <h3 className="fl-section-title first">Vehicle condition</h3>
          <span className={`fl-badge ${conditionClass(v.condition)}`}>{v.condition} · {v.healthScore}/100</span>
        </div>
        <dl className="fl-dl tight">
          <div><dt>Service</dt><dd className={v.maintStatus === "Overdue" ? "bad" : v.maintStatus === "Due soon" ? "fair" : ""}>{v.maintStatus}</dd></div>
          <div><dt>Last inspection</dt><dd className={v.lastInspection?.result === "Fail" ? "bad" : v.lastInspection?.result === "Pass with notes" ? "fair" : ""}>{v.lastInspection?.result || "None"}</dd></div>
          <div><dt>Fuel efficiency</dt><dd className={v.fuel?.status === "Poor" ? "bad" : v.fuel?.status === "Watch" ? "fair" : ""}>{v.fuel?.efficiencyPct ? `${v.fuel.efficiencyPct.toFixed(0)}% of rated` : "No data"}</dd></div>
        </dl>
        {s.alerts.length > 0 ? (
          <ul className="fl-alerts">
            {s.alerts.map((a) => (
              <li key={a.text} className={a.level}><AlertTriangle size={14} /> {a.text}</li>
            ))}
          </ul>
        ) : (
          <p className="fl-muted small">No alerts on this vehicle right now.</p>
        )}
        <button className="fl-btn block" onClick={onOpenVehicle}><ClipboardList size={15} /> Open vehicle information</button>
      </section>
    </>
  );
}

function FuelGauge({ pct, litres, tank, range }) {
  const tone = pct < 20 ? "bad" : pct < 35 ? "fair" : "good";
  const angle = -120 + (Math.max(0, Math.min(100, pct)) / 100) * 240;
  return (
    <div className="fl-fuel">
      <svg viewBox="0 0 120 80" className="fl-fuel-svg" aria-hidden="true">
        <path d="M 12 70 A 50 50 0 1 1 108 70" className="fl-fuel-track" />
        <path d="M 12 70 A 50 50 0 1 1 108 70" className={`fl-fuel-arc ${tone}`} pathLength="100" strokeDasharray={`${pct} 100`} />
        <line x1="60" y1="62" x2="60" y2="26" className="fl-fuel-needle" transform={`rotate(${angle} 60 62)`} />
        <circle cx="60" cy="62" r="4" className="fl-fuel-hub" />
      </svg>
      <div className="fl-fuel-read">
        <span><Fuel size={14} /> Fuel level</span>
        <strong className={tone}>{pct.toFixed(0)}%</strong>
        <small>{litres.toFixed(0)} of {tank} L, about {Math.round(range)} km range</small>
      </div>
    </div>
  );
}

/* ---------------- stops & log ---------------- */

function StopTable({ plan, clock }) {
  return (
    <div className="fl-table-wrap">
      <table className="fl-table compact">
        <thead>
          <tr><th>#</th><th>Outlet</th><th>Dock</th><th>Window</th><th>Planned arrival</th><th>Planned departure</th><th>Status</th></tr>
        </thead>
        <tbody>
          {plan.stops.map((st, i) => {
            const pi = i + 1;
            const arr = plan.timeline.find((e) => e.type === "arrive" && e.pointIndex === pi)?.at;
            const dep = plan.timeline.find((e) => e.type === "leave" && e.pointIndex === pi)?.at;
            const late = st.windowClose && arr > toMinutes(st.windowClose);
            const status = clock >= dep ? "Delivered" : clock >= arr ? "Unloading" : "Pending";
            return (
              <tr key={st.id}>
                <td>{pi}</td>
                <td><strong>{st.id}</strong><small className="fl-sub">{st.district}</small></td>
                <td>{st.dockType.replace("_", " ")}</td>
                <td>{st.windowOpen ? `${st.windowOpen}–${st.windowClose}` : "Any time"}</td>
                <td className={late ? "late" : ""}>{toHHMM(arr)}{late && <small className="fl-sub late">After window</small>}</td>
                <td>{toHHMM(dep)}</td>
                <td><span className={`fl-badge ${status === "Delivered" ? "good" : status === "Unloading" ? "shop" : ""}`}>{status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MovementLog({ plan, clock }) {
  const events = movementLog(plan, clock);
  if (!events.length) return <p className="fl-muted">The vehicle has not left the depot yet. It is scheduled to depart at {toHHMM(plan.startMin)}.</p>;
  return (
    <ol className="fl-log">
      {events.map((e, i) => (
        <li key={`${e.at}-${i}`} className={e.kind}>
          <time>{toHHMM(e.at)}</time>
          <div>
            <b>{e.text}</b>
            {e.detail && <span>{e.detail}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
