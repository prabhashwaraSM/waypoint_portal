// src/data/notificationStore.js
// Lightweight cross-page notification bus for the four roles.
// Persisted to localStorage so it survives refresh; broadcasts a
// window CustomEvent so open pages/components update immediately
// (localStorage's own "storage" event only fires in *other* tabs).

const LS_KEY = "wp_notifications";
const EVENT_NAME = "wp:notifications-changed";

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

/**
 * @param {Object} n
 * @param {"store_manager"|"stock_manager"|"dispatcher"|"driver"} n.role  target audience
 * @param {string} [n.outletId]  when set, only that outlet's Store Manager sees it
 * @param {string} [n.driverName]  when set, only that driver sees it
 * @param {"deferred"|"shortfall"|"eta"|"confirmed"|"info"|"rescheduled"|"delay"|"driver_issue"} n.type
 * @param {string} n.title
 * @param {string} n.message
 * @param {string} [n.orderRef]
 */
export function pushNotification(n) {
  const list = readAll();
  const entry = {
    id: `NTF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...n
  };
  writeAll([entry, ...list].slice(0, 300)); // cap so localStorage doesn't grow unbounded
  return entry;
}

export function getNotifications({ role, outletId, driverName } = {}) {
  return readAll().filter((n) => {
    if (role && n.role !== role) return false;
    if (outletId && n.outletId && n.outletId !== outletId) return false;
    if (driverName && n.driverName && n.driverName !== driverName) return false;
    return true;
  });
}

export function unreadCount(filter) {
  return getNotifications(filter).filter((n) => !n.read).length;
}

export function markRead(id) {
  writeAll(readAll().map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function markAllRead(filter) {
  const targetIds = new Set(getNotifications(filter).map((n) => n.id));
  writeAll(readAll().map((n) => (targetIds.has(n.id) ? { ...n, read: true } : n)));
}

/** Subscribe to live changes. Returns an unsubscribe function. */
export function subscribeNotifications(callback) {
  const handler = (e) => callback(e.detail || readAll());
  // Other tabs (e.g. the driver's phone view) change localStorage directly.
  const onStorage = (e) => e.key === LS_KEY && callback(readAll());
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", onStorage);
  };
}

// ---------- convenience builders for this feature ----------

export function notifyDeferral({ orderRef, outletId, storeLabel, reason, newDate }) {
  pushNotification({
    role: "store_manager",
    outletId,
    type: "deferred",
    orderRef,
    title: `Order ${orderRef} deferred`,
    message: `${storeLabel ? storeLabel + ": " : ""}Your order has been moved to ${newDate}. Reason: ${reason}`
  });
}

export function notifyShortfall({ orderRef, outletId, depot, brand, category, shortfallUnits, reason }) {
  pushNotification({
    role: "stock_manager",
    outletId,
    type: "shortfall",
    orderRef,
    title: `Stock shortfall: ${brand} / ${category}`,
    message: `Order ${orderRef} at ${outletId} (${depot}) deferred due to insufficient supply. Short by ~${shortfallUnits} unit(s). Reason logged: ${reason}`
  });
}

export function notifyConfirmed({ orderRef, outletId, storeLabel }) {
  pushNotification({
    role: "store_manager",
    outletId,
    type: "confirmed",
    orderRef,
    title: `Order ${orderRef} received`,
    message: `${storeLabel ? storeLabel + ": " : ""}Your order has been confirmed and is queued for planning.`
  });
}

export function notifyEta({ orderRef, outletId, etaLabel }) {
  pushNotification({
    role: "store_manager",
    outletId,
    type: "eta",
    orderRef,
    title: `Order ${orderRef} on the way`,
    message: `Predicted arrival: ${etaLabel}. Please have staff ready to receive the delivery.`
  });
}
