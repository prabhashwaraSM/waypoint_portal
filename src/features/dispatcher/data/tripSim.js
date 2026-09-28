// src/data/tripSim.js
// Builds a timeline for each trip (depot -> outlets -> depot) and simulates
// what a GPS / telematics unit would report at any moment of the day:
// position, speed, fuel level, engine & reefer temperature and alerts.
// Replace `vehicleStateAt` with live telematics data once a GPS feed exists.

import { DEPOT_COORDS } from "./fleetStore";

const ROAD_FACTOR = 1.35; // straight-line km -> road km
const URBAN = new Set(["Colombo", "Gampaha"]);
export const SPEED_LIMIT = 70;

export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || "00:00").split(":").map(Number);
  return h * 60 + (m || 0);
};
export const toHHMM = (mins) => {
  const m = Math.max(0, Math.round(mins));
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export function haversineKm([lat1, lng1], [lat2, lng2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const hashSeed = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return (h % 1000) / 10;
};
const wave = (t, seed, a = 1) => Math.sin(t * 0.21 + seed) * 0.6 * a + Math.sin(t * 0.057 + seed * 2) * 0.4 * a;

const shortBrand = (b = "") => (b.includes("Style") ? "Style" : b.includes("Tech") ? "Tech" : "Fresh");

/**
 * Build the static plan of a trip.
 * trip: { trip_id, vehicle_id, driver_name, brand, depot, departure_time, stops ("OUT1|OUT2" or array), start_fuel_pct }
 */
export function buildTrip(trip, vehicle, outletMap, allowanceMap) {
  const depotCoord = DEPOT_COORDS[trip.depot] || DEPOT_COORDS.Peliyagoda;
  const stopIds = Array.isArray(trip.stops) ? trip.stops : String(trip.stops || "").split("|").filter(Boolean);

  const stops = stopIds
    .map((id) => outletMap[id])
    .filter((o) => o && o.lat)
    .map((o) => ({
      id: o.outlet_id,
      name: o.outlet_name || o.outlet_id,
      district: o.district,
      coord: [o.lat, o.lng],
      dockType: o.dock_type || "street",
      windowOpen: o.window_open_time || "",
      windowClose: o.window_close_time || "",
      dwellMin: allowanceMap[`${shortBrand(trip.brand)}|${o.dock_type || "street"}`] || 20
    }));

  const points = [
    { id: "DEPOT", name: `${trip.depot} Depot`, coord: depotCoord, district: trip.depot },
    ...stops,
    { id: "DEPOT_RETURN", name: `${trip.depot} Depot`, coord: depotCoord, district: trip.depot }
  ];

  // legs + timeline
  let t = toMinutes(trip.departure_time);
  const legs = [];
  const timeline = [{ type: "depart", at: t, pointIndex: 0 }];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const km = Math.max(0.8, haversineKm(a.coord, b.coord) * ROAD_FACTOR);
    const urban = URBAN.has(a.district) && URBAN.has(b.district);
    const avgSpeed = urban ? 27 : km > 40 ? 45 : 36;
    const minutes = (km / avgSpeed) * 60;
    legs.push({ from: i, to: i + 1, km, start: t, end: t + minutes, avgSpeed, geometry: [a.coord, b.coord] });
    t += minutes;
    timeline.push({ type: i + 1 === points.length - 1 ? "return" : "arrive", at: t, pointIndex: i + 1 });
    if (i + 1 < points.length - 1) {
      const dwell = points[i + 1].dwellMin;
      timeline.push({ type: "leave", at: t + dwell, pointIndex: i + 1 });
      t += dwell;
    }
  }

  const totalKm = legs.reduce((s, l) => s + l.km, 0);
  return {
    ...trip,
    vehicle,
    stops,
    points,
    legs,
    timeline,
    totalKm,
    startMin: toMinutes(trip.departure_time),
    endMin: t,
    seed: hashSeed(trip.trip_id || "x")
  };
}

// Attach road geometry fetched from OSRM (one polyline for the whole trip),
// split back into legs by finding the closest polyline vertex to every stop.
export function applyRoadGeometry(plan, coords) {
  if (!coords || coords.length < 2) return plan;
  let cursor = 0;
  const cutIdx = [0];
  for (let p = 1; p < plan.points.length; p++) {
    const target = plan.points[p].coord;
    let best = cursor;
    let bestD = Infinity;
    const limit = p === plan.points.length - 1 ? coords.length : coords.length;
    for (let i = cursor; i < limit; i++) {
      const d = (coords[i][0] - target[0]) ** 2 + (coords[i][1] - target[1]) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
      if (p < plan.points.length - 1 && d < 1e-8) break;
    }
    if (p === plan.points.length - 1) best = coords.length - 1;
    cutIdx.push(best);
    cursor = best;
  }
  const legs = plan.legs.map((leg, i) => {
    const seg = coords.slice(cutIdx[i], cutIdx[i + 1] + 1);
    return { ...leg, geometry: seg.length >= 2 ? seg : leg.geometry };
  });
  return { ...plan, legs, roadGeometry: true };
}

function pointAlong(geometry, fraction) {
  if (geometry.length < 2) return geometry[0];
  const segs = [];
  let total = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    const d = haversineKm(geometry[i], geometry[i + 1]);
    segs.push(d);
    total += d;
  }
  let target = total * Math.min(1, Math.max(0, fraction));
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? target / segs[i] : 0;
      const [a, b] = [geometry[i], geometry[i + 1]];
      return { coord: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], segIndex: i, heading: bearing(a, b) };
    }
    target -= segs[i];
  }
  return { coord: geometry[geometry.length - 1], segIndex: segs.length - 1, heading: 0 };
}

function bearing([lat1, lng1], [lat2, lng2]) {
  const y = Math.sin(((lng2 - lng1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(((lng2 - lng1) * Math.PI) / 180);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Everything the telematics unit reports at `now` (minutes since midnight). */
export function vehicleStateAt(plan, now) {
  const v = plan.vehicle || {};
  const kmPerL = v.fuel?.actualKmPerL || v.kmPerL || 5;
  const tank = v.tankCapacityL || 150;
  const startFuelPct = Number(plan.start_fuel_pct) || 90;
  const seed = plan.seed;

  let phase = "scheduled";
  let legIndex = -1;
  let atPoint = 0;
  let kmDone = 0;
  let position = plan.points[0].coord;
  let heading = 0;
  let donePath = [];

  if (now >= plan.endMin) {
    phase = "completed";
    kmDone = plan.totalKm;
    atPoint = plan.points.length - 1;
    position = plan.points[atPoint].coord;
    donePath = plan.legs.flatMap((l) => l.geometry);
  } else if (now >= plan.startMin) {
    for (let i = 0; i < plan.legs.length; i++) {
      const leg = plan.legs[i];
      if (now < leg.start) {
        // unloading at point i (between previous leg end and this leg start)
        phase = "unloading";
        atPoint = i;
        position = plan.points[i].coord;
        break;
      }
      if (now <= leg.end) {
        phase = i === plan.legs.length - 1 ? "returning" : "moving";
        legIndex = i;
        const frac = (now - leg.start) / (leg.end - leg.start || 1);
        const p = pointAlong(leg.geometry, frac);
        position = p.coord;
        heading = p.heading;
        kmDone += leg.km * frac;
        donePath.push(...leg.geometry.slice(0, p.segIndex + 1), p.coord);
        break;
      }
      kmDone += leg.km;
      donePath.push(...leg.geometry);
    }
  }

  const moving = phase === "moving" || phase === "returning";
  const leg = legIndex >= 0 ? plan.legs[legIndex] : null;

  // speed
  let speed = 0;
  if (moving && leg) {
    const base = leg.avgSpeed * 1.25;
    speed = Math.max(4, base + wave(now, seed, 14));
    // an overspeed burst on longer legs for some vehicles
    if (leg.km > 15 && Math.sin(now * 0.09 + seed) > 0.93) speed = SPEED_LIMIT + 6 + (seed % 10);
  }

  // fuel (+ small idle burn while unloading)
  const idleMinutes = plan.timeline.filter((e) => e.type === "leave" && e.at <= now).length * 0.4;
  const litresUsed = kmDone / kmPerL + idleMinutes;
  const fuelL = Math.max(0, (startFuelPct / 100) * tank - litresUsed);
  const fuelPct = (fuelL / tank) * 100;
  const rangeKm = fuelL * kmPerL;

  // engine
  const poor = v.condition === "Needs attention";
  const engineTemp = phase === "scheduled" || phase === "completed" ? 32 : moving ? 89 + wave(now, seed, 3) + (poor ? 9 : 0) : 84 + (poor ? 6 : 0);
  const battery = phase === "scheduled" || phase === "completed" ? 12.6 : 13.9 + wave(now, seed + 3, 0.2);
  const tyreFront = 105 + wave(0, seed, 3);
  const tyreRear = (poor ? 88 : 104) + wave(0, seed + 1, 3);

  // reefer
  let reeferTemp = null;
  if (v.temp === "reefer") {
    reeferTemp = 3 + wave(now, seed + 5, 0.8);
    if (phase === "unloading") {
      const since = now - (plan.timeline.find((e) => e.type === "arrive" && e.pointIndex === atPoint)?.at || now);
      reeferTemp += Math.min(5.5, since * 0.35);
    }
  }

  const alerts = [];
  if (fuelPct < 20 && phase !== "scheduled") alerts.push({ level: "bad", text: `Low fuel: ${fuelPct.toFixed(0)}% left` });
  if (speed > SPEED_LIMIT) alerts.push({ level: "bad", text: `Overspeed: ${speed.toFixed(0)} km/h (limit ${SPEED_LIMIT})` });
  if (engineTemp > 100) alerts.push({ level: "bad", text: `Engine running hot: ${engineTemp.toFixed(0)} °C` });
  if (reeferTemp !== null && reeferTemp > 5) alerts.push({ level: "warn", text: `Reefer above 5 °C (${reeferTemp.toFixed(1)} °C)` });
  if (tyreRear < 95) alerts.push({ level: "warn", text: `Rear tyre pressure low (${tyreRear.toFixed(0)} psi)` });
  if (v.maintStatus === "Overdue") alerts.push({ level: "warn", text: "Vehicle service is overdue" });
  if (v.lastInspection?.result === "Fail") alerts.push({ level: "warn", text: "Vehicle failed its last inspection" });

  // next stop + ETA
  let nextStop = null;
  let eta = null;
  if (phase === "scheduled") {
    nextStop = plan.points[1];
    eta = plan.timeline.find((e) => e.type === "arrive" && e.pointIndex === 1)?.at;
  } else if (moving && leg) {
    nextStop = plan.points[leg.to];
    eta = leg.end;
  } else if (phase === "unloading") {
    nextStop = plan.points[atPoint + 1];
    eta = plan.legs[atPoint]?.end;
  }

  const stopsDone = plan.timeline.filter((e) => e.type === "leave" && e.at <= now).length;

  return {
    phase,
    position,
    heading,
    speed,
    kmDone,
    progress: plan.totalKm ? kmDone / plan.totalKm : 0,
    fuelPct,
    fuelL,
    rangeKm,
    engineTemp,
    battery,
    tyreFront,
    tyreRear,
    reeferTemp,
    alerts,
    nextStop,
    eta,
    atPoint,
    stopsDone,
    donePath
  };
}

export const phaseLabel = (s, plan) => {
  switch (s.phase) {
    case "scheduled":
      return `Departs ${toHHMM(plan.startMin)}`;
    case "moving":
      return `En route to ${s.nextStop?.id}`;
    case "unloading":
      return `Unloading at ${plan.points[s.atPoint]?.id}`;
    case "returning":
      return "Returning to depot";
    case "completed":
      return "Trip completed";
    default:
      return "";
  }
};

/** Movement log: every event up to `now`, newest first. */
export function movementLog(plan, now) {
  const events = [];
  plan.timeline.forEach((e) => {
    if (e.at > now) return;
    const p = plan.points[e.pointIndex];
    if (e.type === "depart") events.push({ at: e.at, kind: "depart", text: `Departed ${p.name}`, detail: `${plan.stops.length} drops planned, ${plan.totalKm.toFixed(0)} km route` });
    if (e.type === "arrive") {
      const late = p.windowClose && e.at > toMinutes(p.windowClose);
      events.push({
        at: e.at,
        kind: late ? "late" : "arrive",
        text: `Arrived at ${p.id} (${p.district})`,
        detail: p.windowClose ? `Delivery window ${p.windowOpen}–${p.windowClose}${late ? " · missed" : ""}` : ""
      });
    }
    if (e.type === "leave") events.push({ at: e.at, kind: "leave", text: `Delivered and left ${p.id}`, detail: `${p.dwellMin} min on site (${p.dockType.replace("_", " ")})` });
    if (e.type === "return") events.push({ at: e.at, kind: "return", text: `Returned to ${p.name}`, detail: "Trip closed" });
  });
  // overspeed samples on each leg
  plan.legs.forEach((leg) => {
    if (leg.km <= 15) return;
    for (let t = Math.ceil(leg.start); t < Math.min(leg.end, now); t += 1) {
      if (Math.sin(t * 0.09 + plan.seed) > 0.93) {
        events.push({ at: t, kind: "alert", text: `Overspeed recorded`, detail: `${SPEED_LIMIT + 6 + (plan.seed % 10)} km/h in a ${SPEED_LIMIT} km/h zone` });
        t += 25;
      }
    }
  });
  return events.sort((a, b) => b.at - a.at);
}

// Fetch road-following geometry from the public OSRM demo server.
// Falls back silently to straight lines if offline or rate-limited.
const geometryCache = {};
export async function fetchRoadGeometry(plan) {
  if (geometryCache[plan.trip_id]) return geometryCache[plan.trip_id];
  const coordStr = plan.points.map((p) => `${p.coord[1]},${p.coord[0]}`).join(";");
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`);
    if (!res.ok) return null;
    const json = await res.json();
    const coords = json.routes?.[0]?.geometry?.coordinates?.map(([lng, lat]) => [lat, lng]);
    if (coords) geometryCache[plan.trip_id] = coords;
    return coords || null;
  } catch {
    return null;
  }
}
