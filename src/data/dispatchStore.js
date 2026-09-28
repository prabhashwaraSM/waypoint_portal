// src/data/dispatchStore.js
// Drivers, agents/customers and dispatch records (who dispatched which order,
// on which vehicle, with which driver and invoice). Used by Dispatch and Reports.

import { loadCsv, loadFleet } from "./fleetStore";

const LS_DISPATCH = "dispatch_records";

export const DISPATCH_TYPES = [
  { value: "Store replenishment", party: "Own store", hint: "Stock sent to Waypoint outlets" },
  { value: "Agent order", party: "Agent", hint: "Sold to an agent or distributor" },
  { value: "Customer order", party: "Customer", hint: "Direct delivery to a business customer" },
  { value: "Inter-depot transfer", party: "Depot", hint: "Stock moved between Peliyagoda and Kandy" }
];

export const BRAND_FULL = { Fresh: "Waypoint Fresh", Style: "Waypoint Style", Tech: "Waypoint Tech" };

const readLS = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_DISPATCH) || "[]");
  } catch {
    return [];
  }
};

export const getAppDispatchRecords = () => readLS();

export function saveDispatchRecords(records) {
  try {
    localStorage.setItem(LS_DISPATCH, JSON.stringify([...records, ...readLS()]));
  } catch {
    /* storage unavailable */
  }
}

export const loadDrivers = () => loadCsv("/drivers.csv");
export const loadParties = () => loadCsv("/agents_customers.csv");

// Sequential-looking numbers for the prototype
export function nextInvoiceNo(date = new Date()) {
  const ym = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, "0")}`;
  return `INV-${ym}-A${String(Date.now()).slice(-5)}`;
}
export function nextDispatchNo(date = new Date()) {
  const ymd = date.toISOString().slice(2, 10).replace(/-/g, "");
  return `DSP-${ymd}-A${String(Date.now()).slice(-5)}`;
}

/** Every order joined with its dispatch record, store, vehicle and driver. */
export async function loadOrderReport() {
  const [orders, csvRecords, outlets, drivers, fleet] = await Promise.all([
    loadCsv("/waypoint_1500_orders_all_120_stores.csv"),
    loadCsv("/order_dispatch_records.csv"),
    loadCsv("/outlets.csv"),
    loadDrivers(),
    loadFleet()
  ]);

  const recMap = {};
  csvRecords.forEach((r) => (recMap[r.order_ref] = { ...r, source: "history" }));
  readLS().forEach((r) => (recMap[r.order_ref] = { ...r, source: "app" })); // app dispatches override

  const outletMap = Object.fromEntries(outlets.map((o) => [o.outlet_id, o]));
  const driverMap = Object.fromEntries(drivers.map((d) => [d.driver_id, d]));
  const driverByName = Object.fromEntries(drivers.map((d) => [d.driver_name, d]));
  const vehicleMap = Object.fromEntries(fleet.vehicles.map((v) => [v.id, v]));

  const rows = orders.map((o) => {
    const rec = recMap[o.order_ref];
    const outlet = outletMap[o.outlet_id] || {};
    const vehicle = rec ? vehicleMap[rec.vehicle_id] : null;
    const driver = rec ? driverMap[rec.driver_id] || driverByName[rec.driver_name] : null;
    let status = o.status;
    if (rec?.source === "app" && ["approved", "pending_load", "loading", "pending_planning"].includes(status)) status = "dispatched";

    return {
      orderRef: o.order_ref,
      orderDate: o.order_date,
      requiredDate: o.required_date,
      deliveredDate: o.delivered_date || "",
      status,
      brand: BRAND_FULL[o.brand] || o.brand,
      category: o.category,
      temp: o.temp_requirement,
      units: Number(o.order_units) || 0,
      weightKg: Number(o.order_weight_kg) || 0,
      volumeM3: Number(o.order_volume_m3) || 0,
      warehouse: o.depot,
      storeId: o.outlet_id,
      storeName: o.outlet_name || `${BRAND_FULL[o.brand] || o.brand} ${o.outlet_id}`,
      district: o.district,
      dockType: outlet.dock_type || o.dock_type,
      parking: outlet.parking_constraint || o.parking_constraint,
      window: o.window_open_time ? `${o.window_open_time}–${o.window_close_time}` : "",
      dispatchNo: rec?.dispatch_no || "",
      invoiceNo: rec?.invoice_no || "",
      dispatchDate: rec?.dispatch_date || "",
      dispatchTime: rec?.dispatch_time || "",
      dispatchType: rec?.dispatch_type || "",
      customerAgent: rec?.customer_agent || "",
      partyType: rec?.party_type || "",
      tripId: rec?.trip_id || "",
      vehicleId: rec?.vehicle_id || "",
      vehicleReg: vehicle?.registrationNo || "",
      vehicleType: vehicle ? `${vehicle.type === "van" ? "Van" : "Lorry"}, ${vehicle.temp === "reefer" ? "Reefer" : "Ambient"}` : "",
      vehicleModel: vehicle?.makeModel || "",
      driverId: driver?.driver_id || rec?.driver_id || "",
      driverName: driver?.driver_name || rec?.driver_name || "",
      driverPhone: driver?.phone || rec?.driver_phone || "",
      driverLicence: driver?.licence_no || "",
      dispatchedBy: rec?.dispatched_by || "",
      source: rec?.source || ""
    };
  });

  return rows;
}

export const STATUS_LABELS = {
  pending_approval: "Pending approval",
  approved: "Approved",
  pending_planning: "Pending planning",
  pending_load: "Pending load",
  loading: "Loading",
  dispatched: "Dispatched",
  in_transit: "In transit",
  delivered: "Delivered",
  deferred: "Deferred",
  cancelled: "Cancelled"
};
