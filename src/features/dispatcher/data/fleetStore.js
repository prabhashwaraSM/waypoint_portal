// src/data/fleetStore.js
// Shared data layer for the Fleet & Tracking section (and the Dispatch page).
// Loads the fleet CSVs from /public, merges vehicles registered in the UI
// (kept in localStorage), and computes vehicle condition from maintenance,
// inspection and fuel records.

import Papa from "papaparse";

// All "due / overdue" calculations are made against this date so the sample
// data stays meaningful. Change it to `new Date()` once real data is connected.
export const REFERENCE_DATE = new Date("2026-09-27T00:00:00");

export const VEHICLE_TYPES = [
  { value: "van", label: "Van" },
  { value: "truck", label: "Lorry / Truck" }
];
export const TEMP_SPECS = [
  { value: "ambient", label: "Ambient (non-refrigerated)" },
  { value: "reefer", label: "Reefer (refrigerated)" }
];
export const DEPOTS = ["Peliyagoda", "Kandy"];
export const BRAND_OPTIONS = ["Waypoint Fresh", "Waypoint Style", "Waypoint Tech", "Shared"];
export const FUEL_TYPES = ["diesel", "petrol"];

export const DEPOT_COORDS = {
  Peliyagoda: [6.9632, 79.8856],
  Kandy: [7.2955, 80.61]
};

const LS_REGISTERED = "fleet_registered_vehicles";
const LS_MAINT = "fleet_added_maintenance";
const LS_FUEL = "fleet_added_fuel";
const LS_TRIPS = "fleet_dispatched_trips";

// ---------- helpers ----------
const readLS = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};
const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

export const loadCsv = (path) =>
  new Promise((resolve) => {
    Papa.parse(path, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data),
      error: () => resolve([])
    });
  });

export const daysBetween = (from, to = REFERENCE_DATE) =>
  Math.round((new Date(to) - new Date(from)) / 86400000);

export const addDays = (iso, days) => {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const fmtDate = (iso) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const typeLabel = (t) => (t === "van" ? "Van" : "Lorry / Truck");
export const tempLabel = (t) => (t === "reefer" ? "Reefer" : "Ambient");

// ---------- registration ----------
export const getRegisteredVehicles = () => readLS(LS_REGISTERED);

export const registerVehicle = (vehicle) => {
  const list = readLS(LS_REGISTERED);
  writeLS(LS_REGISTERED, [...list, { ...vehicle, registered_in_app: true }]);
};

export const removeRegisteredVehicle = (vehicleId) => {
  writeLS(LS_REGISTERED, readLS(LS_REGISTERED).filter((v) => v.vehicle_id !== vehicleId));
};

export const addMaintenanceRecord = (rec) => writeLS(LS_MAINT, [...readLS(LS_MAINT), rec]);
export const addFuelRecord = (rec) => writeLS(LS_FUEL, [...readLS(LS_FUEL), rec]);

export const getDispatchedTrips = () => readLS(LS_TRIPS);
export const saveDispatchedTrip = (trip) => writeLS(LS_TRIPS, [trip, ...readLS(LS_TRIPS)]);

// Vehicles only (used by Dispatch so newly registered vehicles can be assigned)
export async function loadVehicleList() {
  const base = await loadCsv("/vehicles.csv");
  const registered = getRegisteredVehicles();
  return [...base, ...registered].map(normaliseVehicle);
}

function normaliseVehicle(r) {
  return {
    id: r.vehicle_id,
    type: r.type || "truck",
    temp: r.temp || "ambient",
    weightCapKg: Number(r.weight_cap_kg) || 0,
    volumeCapM3: Number(r.volume_cap_m3) || 0,
    fuelType: r.fuel_type || "diesel",
    kmPerL: Number(r.km_per_l) || 0,
    weeklyFuelQuotaL: Number(r.weekly_fuel_quota_l) || 0,
    depot: r.depot || "Peliyagoda",
    registeredInApp: !!r.registered_in_app
  };
}

// ---------- full fleet load ----------
export async function loadFleet() {
  const [base, profiles, maint, fuel, inspections, trips, outletLocs, outlets, allowance] = await Promise.all([
    loadCsv("/vehicles.csv"),
    loadCsv("/vehicle_profiles.csv"),
    loadCsv("/vehicle_maintenance.csv"),
    loadCsv("/vehicle_fuel_log.csv"),
    loadCsv("/vehicle_inspections.csv"),
    loadCsv("/vehicle_tracking.csv"),
    loadCsv("/outlet_locations.csv"),
    loadCsv("/outlets.csv"),
    loadCsv("/service_allowance.csv")
  ]);

  const registered = getRegisteredVehicles();
  const profileMap = Object.fromEntries(profiles.map((p) => [p.vehicle_id, p]));

  const maintenance = [...maint, ...readLS(LS_MAINT)].map((m) => ({
    ...m,
    odometer_km: Number(m.odometer_km) || 0,
    cost_lkr: Number(m.cost_lkr) || 0
  }));
  const fuelLog = [...fuel, ...readLS(LS_FUEL)].map((f) => ({
    ...f,
    litres: Number(f.litres) || 0,
    cost_lkr: Number(f.cost_lkr) || 0,
    odometer_km: Number(f.odometer_km) || 0,
    km_since_last_fill: Number(f.km_since_last_fill) || 0
  }));

  const vehicles = [...base, ...registered].map((r) => {
    const v = normaliseVehicle(r);
    const p = r.registered_in_app ? r : profileMap[r.vehicle_id] || {};
    return {
      ...v,
      registrationNo: p.registration_no || "—",
      makeModel: p.make_model || "—",
      year: p.year || "—",
      tankCapacityL: Number(p.tank_capacity_l) || (v.type === "van" ? 70 : 150),
      odometerKm: Number(p.odometer_km) || 0,
      driver: p.driver_name || "Unassigned",
      assignedBrand: p.assigned_brand || "Shared",
      serviceIntervalKm: Number(p.service_interval_km) || (v.type === "van" ? 7500 : 10000),
      serviceIntervalDays: Number(p.service_interval_days) || 90,
      baseLastServiceDate: p.last_service_date || "",
      baseLastServiceKm: Number(p.last_service_km) || 0,
      insuranceExpiry: p.insurance_expiry || "",
      licenceExpiry: p.revenue_licence_expiry || "",
      operationalStatus: p.status || "active"
    };
  });

  const inspectionsByVehicle = groupBy(inspections, "vehicle_id");
  const maintByVehicle = groupBy(maintenance, "vehicle_id");
  const fuelByVehicle = groupBy(fuelLog, "vehicle_id");

  const enriched = vehicles.map((v) =>
    computeCondition(v, maintByVehicle[v.id] || [], inspectionsByVehicle[v.id] || [], fuelByVehicle[v.id] || [])
  );

  const outletMap = {};
  outlets.forEach((o) => (outletMap[o.outlet_id] = { ...o }));
  outletLocs.forEach((l) => {
    outletMap[l.outlet_id] = {
      ...(outletMap[l.outlet_id] || {}),
      outlet_id: l.outlet_id,
      district: l.district,
      lat: Number(l.latitude),
      lng: Number(l.longitude)
    };
  });
  const allowanceMap = {};
  allowance.forEach((a) => (allowanceMap[`${a.brand}|${a.dock_type}`] = Number(a.service_allowance_min)));

  const dispatched = getDispatchedTrips();

  return {
    vehicles: enriched,
    maintenance,
    fuelLog,
    inspections,
    trips: [...dispatched, ...trips],
    outletMap,
    allowanceMap
  };
}

function groupBy(list, key) {
  return list.reduce((acc, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item);
    return acc;
  }, {});
}

// ---------- condition ----------
export function computeCondition(v, maint, insp, fuel) {
  // Maintenance: latest completed service
  const completed = maint
    .filter((m) => m.status === "Completed")
    .sort((a, b) => (a.service_date < b.service_date ? 1 : -1));
  const latest = completed[0];
  const lastServiceDate = latest?.service_date || v.baseLastServiceDate;
  const lastServiceKm = latest ? Math.max(latest.odometer_km, 0) : v.baseLastServiceKm;
  const inWorkshop = maint.some((m) => m.status === "In Progress") || v.operationalStatus === "in_workshop";

  const nextDueDate = lastServiceDate ? addDays(lastServiceDate, v.serviceIntervalDays) : "";
  const nextDueKm = lastServiceKm + v.serviceIntervalKm;
  const daysToService = nextDueDate ? daysBetween(REFERENCE_DATE, nextDueDate) : null;
  const kmToService = v.odometerKm ? nextDueKm - v.odometerKm : null;

  let maintStatus = "On schedule";
  if (!lastServiceDate) maintStatus = "No record";
  else if ((daysToService !== null && daysToService < 0) || (kmToService !== null && kmToService < 0)) maintStatus = "Overdue";
  else if ((daysToService !== null && daysToService <= 14) || (kmToService !== null && kmToService <= 1000)) maintStatus = "Due soon";

  // Inspection
  const inspSorted = [...insp].sort((a, b) => (a.inspection_date < b.inspection_date ? 1 : -1));
  const lastInspection = inspSorted[0] || null;
  const daysSinceInspection = lastInspection ? daysBetween(lastInspection.inspection_date) : null;
  const inspectionOverdue = daysSinceInspection === null || daysSinceInspection > 30;

  // Fuel efficiency (last 28 days)
  const kmTotal = fuel.reduce((s, f) => s + f.km_since_last_fill, 0);
  const litresTotal = fuel.reduce((s, f) => s + f.litres, 0);
  const costTotal = fuel.reduce((s, f) => s + f.cost_lkr, 0);
  const actualKmPerL = litresTotal > 0 ? kmTotal / litresTotal : 0;
  const efficiencyPct = v.kmPerL && actualKmPerL ? (actualKmPerL / v.kmPerL) * 100 : null;
  const weeklyAvgL = litresTotal / 4;
  const quotaUsePct = v.weeklyFuelQuotaL ? (weeklyAvgL / v.weeklyFuelQuotaL) * 100 : null;
  let fuelStatus = "No data";
  if (efficiencyPct !== null) fuelStatus = efficiencyPct < 85 ? "Poor" : efficiencyPct < 95 ? "Watch" : "Good";

  // Documents
  const insuranceDays = v.insuranceExpiry ? daysBetween(REFERENCE_DATE, v.insuranceExpiry) : null;
  const licenceDays = v.licenceExpiry ? daysBetween(REFERENCE_DATE, v.licenceExpiry) : null;

  // Health score
  let score = 100;
  const issues = [];
  if (maintStatus === "Overdue") { score -= 30; issues.push("Service overdue"); }
  else if (maintStatus === "Due soon") { score -= 10; issues.push("Service due soon"); }
  if (lastInspection?.result === "Fail") { score -= 30; issues.push("Failed last inspection"); }
  else if (lastInspection?.result === "Pass with notes") { score -= 10; issues.push("Inspection defects noted"); }
  if (inspectionOverdue) { score -= 15; issues.push("Inspection overdue"); }
  if (fuelStatus === "Poor") { score -= 20; issues.push("Poor fuel efficiency"); }
  else if (fuelStatus === "Watch") { score -= 8; issues.push("Fuel efficiency dropping"); }
  if (insuranceDays !== null && insuranceDays < 0) { score -= 25; issues.push("Insurance expired"); }
  else if (insuranceDays !== null && insuranceDays <= 30) { score -= 5; issues.push("Insurance expiring"); }
  if (licenceDays !== null && licenceDays < 0) { score -= 25; issues.push("Revenue licence expired"); }
  if (inWorkshop) issues.unshift("In workshop");
  score = Math.max(0, score);

  const condition = inWorkshop ? "In workshop" : score >= 80 ? "Good" : score >= 60 ? "Fair" : "Needs attention";

  return {
    ...v,
    lastServiceDate,
    lastServiceKm,
    nextDueDate,
    nextDueKm,
    daysToService,
    kmToService,
    maintStatus,
    lastInspection,
    daysSinceInspection,
    inspectionOverdue,
    fuel: {
      kmTotal,
      litresTotal,
      costTotal,
      actualKmPerL,
      efficiencyPct,
      weeklyAvgL,
      quotaUsePct,
      status: fuelStatus,
      fills: fuel.length
    },
    insuranceDays,
    licenceDays,
    healthScore: score,
    condition,
    issues,
    inWorkshop
  };
}

export const conditionClass = (c) =>
  ({ Good: "good", Fair: "fair", "Needs attention": "bad", "In workshop": "shop" }[c] || "");
