// src/data/orderPlacementStore.js
// Orders placed in-app by a Store Manager. Kept separate from the seeded
// 1,500-order CSV so the two can be merged for the Dispatcher's queue while
// the Store Manager's own list stays a simple, fast local read.

import { notifyConfirmed } from "./notificationStore";

const LS_KEY = "wp_store_orders";
const EVENT_NAME = "wp:app-orders-changed";

const readAll = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
};

const writeAll = (list) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: list }));
};

export function getAppOrders({ outletId } = {}) {
  const all = readAll();
  return outletId ? all.filter((o) => o.outlet_id === outletId) : all;
}

export function subscribeAppOrders(callback) {
  const handler = (e) => callback(e.detail || readAll());
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

function nextOrderRef() {
  return `ORD-APP-${Date.now().toString().slice(-8)}`;
}

/**
 * Places a new order for the store's own outlet. Enters the queue as
 * "pending_approval" straight away so the Store Manager sees immediate
 * confirmation instead of wondering whether it was received.
 */
export function placeOrder({
  outletId,
  outletName,
  district,
  depot,
  dockType,
  parkingConstraint,
  windowOpenTime,
  windowCloseTime,
  brand,
  category,
  tempRequirement,
  units,
  weightKg,
  volumeM3,
  requiredDate
}) {
  const order = {
    order_ref: nextOrderRef(),
    scenario: "APP",
    order_date: new Date().toISOString().slice(0, 10),
    required_date: requiredDate,
    brand,
    outlet_id: outletId,
    outlet_name: outletName,
    district,
    depot,
    dock_type: dockType || "",
    parking_constraint: parkingConstraint || "",
    mall_window: "",
    window_open_time: windowOpenTime || "",
    window_close_time: windowCloseTime || "",
    category,
    temp_requirement: tempRequirement,
    order_units: Number(units) || 0,
    order_weight_kg: Number(weightKg) || 0,
    order_volume_m3: Number(volumeM3) || 0,
    status: "pending_approval",
    delivered_date: "",
    vehicle_id: "",
    trip_id: "",
    source: "app",
    placedAt: new Date().toISOString()
  };

  writeAll([order, ...readAll()]);
  notifyConfirmed({ orderRef: order.order_ref, outletId, storeLabel: outletName });
  return order;
}

/** Applies a status update coming from the Dispatcher side (approve/defer/reject). */
export function updateAppOrderStatus(orderRef, patch) {
  writeAll(readAll().map((o) => (o.order_ref === orderRef ? { ...o, ...patch } : o)));
}
