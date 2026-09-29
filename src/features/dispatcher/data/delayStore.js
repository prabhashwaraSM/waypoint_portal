// src/data/delayStore.js
// Shortages & Delays (Dispatch sub-page): approved orders that cannot leave
// on their required date because of a vehicle or capacity shortage, the new
// date given to the store, the apology sent, and the delay report.
// Everything the dispatcher records is kept in localStorage for the prototype.

import { loadCsv, loadFleet, REFERENCE_DATE } from "./fleetStore";
import { getAppDispatchRecords, BRAND_FULL } from "./dispatchStore";
import { getAppOrders, updateAppOrderStatus } from "./orderPlacementStore";
import { pushNotification } from "./notificationStore";
import { DEFAULT_SETTINGS, addDaysIso } from "./capacityPlanner";

const LS_DELAYS = "wp_order_delays";
const LS_OFFROAD = "wp_vehicles_off_road";
const LS_SETTINGS = "wp_capacity_settings";
const EVENT_NAME = "wp:delays-changed";

// Orders that are approved but have not left the depot yet.
export const AWAITING_DISPATCH = ["approved", "pending_planning", "pending_load", "loading"];

// First date that can still be dispatched (the day after the reference "today").
export const PLANNING_START = addDaysIso(REFERENCE_DATE.toISOString().slice(0, 10), 1);

export const REASON_TYPES = [
  { value: "vehicle_shortage", label: "Vehicle shortage" },
  { value: "capacity_shortage", label: "Capacity shortage" },
  { value: "vehicle_breakdown", label: "Vehicle breakdown" },
  { value: "driver_unavailable", label: "Driver unavailable" },
  { value: "other", label: "Other operational reason" }
];
export const reasonLabel = (code) => REASON_TYPES.find((r) => r.value === code)?.label || code;

export const OFF_ROAD_REASONS = ["No driver available", "Breakdown", "Accident repair", "Booked for another job", "Permit or document issue"];

const read = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export function subscribeDelays(callback) {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}

// ---------- settings ----------
export const getPlanningSettings = () => ({ ...DEFAULT_SETTINGS, ...read(LS_SETTINGS, {}) });
export const savePlanningSettings = (s) => write(LS_SETTINGS, s);

// ---------- vehicles off the road ----------
export const getOffRoad = () => read(LS_OFFROAD, []);
export function addOffRoad({ vehicleId, date, reason }) {
  const list = getOffRoad().filter((o) => !(o.vehicleId === vehicleId && o.date === date));
  write(LS_OFFROAD, [...list, { id: `OFR-${Date.now()}`, vehicleId, date, reason, addedAt: new Date().toISOString() }]);
}
export const removeOffRoad = (id) => write(LS_OFFROAD, getOffRoad().filter((o) => o.id !== id));

// ---------- delay records ----------
export const getDelayRecords = () => read(LS_DELAYS, []);

/** Latest delay per order (an order can be rescheduled more than once). */
export function latestDelayByOrder() {
  const map = {};
  getDelayRecords().forEach((d) => {
    if (!map[d.orderRef] || d.createdAt > map[d.orderRef].createdAt) map[d.orderRef] = d;
  });
  return map;
}

/**
 * Saves the new date, sends the apology to the store manager, and keeps the
 * record for the delay report.
 */
export function rescheduleOrder({ order, newDate, reasonCode, reasonText, apology, source, createdBy }) {
  const record = {
    id: `DLY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    orderRef: order.ref,
    outletId: order.outletId,
    storeLabel: order.storeLabel,
    brand: order.brand,
    depot: order.depot,
    district: order.district,
    category: order.category,
    units: order.units,
    temp: order.temp,
    originalDate: order.originalDate || order.requiredDate,
    previousDate: order.requiredDate,
    newDate,
    reasonCode,
    reasonText,
    apology,
    source,
    createdBy,
    createdAt: new Date().toISOString(),
    notifiedAt: new Date().toISOString()
  };
  write(LS_DELAYS, [record, ...getDelayRecords()]);

  pushNotification({
    role: "store_manager",
    outletId: order.outletId,
    type: "rescheduled",
    orderRef: order.ref,
    title: `Order ${order.ref} will be dispatched on ${newDate}`,
    message: apology
  });

  if (order.source === "app") {
    updateAppOrderStatus(order.ref, { delayDate: newDate, delayReason: reasonText, delayMessage: apology });
  }
  return record;
}

// ---------- inputs for the planner ----------
export async function loadPlanningInputs() {
  const [csvOrders, fleet] = await Promise.all([loadCsv("/waypoint_1500_orders_all_120_stores.csv"), loadFleet()]);
  const dispatched = new Set(getAppDispatchRecords().map((r) => r.order_ref));
  const latest = latestDelayByOrder();

  const normalise = (r, source) => {
    const brand = BRAND_FULL[r.brand] || r.brand;
    const delay = latest[r.order_ref];
    return {
      ref: r.order_ref,
      source,
      status: r.status,
      brand,
      outletId: r.outlet_id,
      storeLabel: r.outlet_name || `${brand} ${r.outlet_id}`,
      district: r.district,
      depot: r.depot || "Peliyagoda",
      category: r.category,
      temp: r.temp_requirement === "chilled" ? "chilled" : "ambient",
      parkingConstraint: r.parking_constraint || "",
      units: Number(r.order_units) || 0,
      weightKg: Number(r.order_weight_kg) || 0,
      volumeM3: Number(r.order_volume_m3) || 0,
      orderDate: r.order_date || "",
      window: r.window_open_time ? `${r.window_open_time}–${r.window_close_time}` : "",
      originalDate: r.required_date,
      // A rescheduled order is planned on its new date.
      requiredDate: delay ? delay.newDate : r.required_date,
      delay: delay || null
    };
  };

  const orders = [
    ...getAppOrders().filter((o) => AWAITING_DISPATCH.includes(o.status)).map((o) => normalise(o, "app")),
    ...csvOrders.filter((o) => AWAITING_DISPATCH.includes(o.status)).map((o) => normalise(o, "history"))
  ].filter((o) => !dispatched.has(o.ref) && o.requiredDate);

  return { orders, fleet };
}

// ---------- apology text ----------
const fmt = (iso) =>
  iso ? new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) : "";

export function buildApology({ order, newDate, reasonText, dispatcher }) {
  return [
    `Dear ${order.storeLabel} team,`,
    ``,
    `We are sorry. Your order ${order.ref} (${order.category}, ${order.units} units) was due to be dispatched on ${fmt(order.requiredDate)}, but it cannot leave the ${order.depot} depot on that day because ${reasonText}.`,
    ``,
    `We have booked it on the next available vehicle. It will now be dispatched on ${fmt(newDate)}${order.window ? ` and delivered in your usual ${order.window} window` : ""}. You will get another update when it is on the way.`,
    ``,
    `We apologise for the inconvenience and thank you for your patience.`,
    `${dispatcher || "Dispatch team"}, Waypoint Dispatch (${order.depot} depot)`
  ].join("\n");
}

// ---------- report export ----------
export function delaysToCsv(records) {
  const cols = [
    ["Order", "orderRef"], ["Store", "outletId"], ["Store name", "storeLabel"], ["Brand", "brand"], ["Depot", "depot"],
    ["District", "district"], ["Category", "category"], ["Units", "units"], ["Original date", "originalDate"],
    ["New dispatch date", "newDate"], ["Days delayed", "daysDelayed"], ["Reason type", "reasonLabel"], ["Reason", "reasonText"],
    ["Found by", "source"], ["Store notified", "notifiedAt"], ["Recorded by", "createdBy"]
  ];
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.map((c) => c[0]).join(","), ...records.map((r) => cols.map((c) => esc(r[c[1]])).join(","))].join("\n");
}
