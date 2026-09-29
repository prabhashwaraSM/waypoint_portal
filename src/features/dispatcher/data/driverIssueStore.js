// src/data/driverIssueStore.js
// Problems reported by drivers during a trip (Fleet & Tracking > Driver
// Notifications). The driver reports, the dispatcher acknowledges, tells the
// affected store managers about the delay, and closes the issue.
// Kept in localStorage for the prototype, with a window event so every open
// screen (driver phone, dispatcher console, store manager) updates live.

import { pushNotification } from "./notificationStore";

const LS_KEY = "wp_driver_issues";
const EVENT_NAME = "wp:driver-issues-changed";

export const ISSUE_TYPES = [
  { value: "breakdown", label: "Vehicle breakdown", severity: "high" },
  { value: "flat_tyre", label: "Flat tyre", severity: "medium" },
  { value: "accident", label: "Accident", severity: "high" },
  { value: "reefer_failure", label: "Cooling (reefer) not working", severity: "high" },
  { value: "fuel", label: "Fuel problem", severity: "medium" },
  { value: "driver_unwell", label: "Driver unwell", severity: "high" },
  { value: "traffic", label: "Heavy traffic or road closed", severity: "low" },
  { value: "weather", label: "Bad weather or flooding", severity: "medium" },
  { value: "store_closed", label: "Can't unload at a store", severity: "low" },
  { value: "other", label: "Something else", severity: "medium" }
];
export const issueLabel = (v) => ISSUE_TYPES.find((t) => t.value === v)?.label || v;

export const CONTINUE_OPTIONS = [
  { value: "continue", label: "I can carry on after the delay" },
  { value: "replacement_vehicle", label: "I need a replacement vehicle" },
  { value: "relief_driver", label: "I need a relief driver" },
  { value: "return_depot", label: "I have to return to the depot" }
];
export const continueLabel = (v) => CONTINUE_OPTIONS.find((t) => t.value === v)?.label || v;

export const SEVERITY_LABEL = { high: "Urgent", medium: "Needs action", low: "For information" };

export const STATUS = {
  new: { label: "New", cls: "bad" },
  seen: { label: "Seen by dispatcher", cls: "fair" },
  stores_notified: { label: "Stores told", cls: "shop" },
  resolved: { label: "Resolved", cls: "good" }
};

export const RESOLUTIONS = [
  "Driver carried on, trip completed",
  "Replacement vehicle sent",
  "Relief driver sent",
  "Remaining drops moved to another trip",
  "Trip cancelled, orders rescheduled"
];

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
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const getDriverIssues = () => readAll();
export const getIssuesForDriver = (driverName) => readAll().filter((i) => i.driverName === driverName);

export function subscribeDriverIssues(callback) {
  const onStorage = (e) => e.key === LS_KEY && callback();
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", onStorage); // driver phone open in another tab
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", onStorage);
  };
}

const patch = (id, fn) => {
  let updated = null;
  writeAll(
    readAll().map((i) => {
      if (i.id !== id) return i;
      updated = fn(i);
      return updated;
    })
  );
  return updated;
};

const event = (text, by) => ({ at: new Date().toISOString(), text, by });

/**
 * Driver side: report a problem on the current trip.
 * @param {Object} r { tripId, vehicleId, driverName, driverId, driverPhone, depot, brand, type, note,
 *                     location, nextStopId, affectedStops: [{ outletId, name, district, plannedEta }],
 *                     orderRefs, delayMin, canContinue, reportedVia: "driver_app"|"phone_call", loggedBy }
 */
export function reportDriverIssue(r) {
  const type = ISSUE_TYPES.find((t) => t.value === r.type);
  const issue = {
    id: `DRI-${Date.now().toString().slice(-7)}`,
    createdAt: new Date().toISOString(),
    status: "new",
    severity: r.severity || type?.severity || "medium",
    storesNotified: [],
    ...r,
    timeline: [
      event(
        r.reportedVia === "phone_call"
          ? `Logged from a phone call by ${r.loggedBy || "dispatcher"}`
          : `Reported by ${r.driverName} from the driver app`,
        r.reportedVia === "phone_call" ? r.loggedBy : r.driverName
      )
    ]
  };
  writeAll([issue, ...readAll()]);

  pushNotification({
    role: "dispatcher",
    type: "driver_issue",
    orderRef: issue.tripId,
    title: `${issueLabel(issue.type)}: ${issue.vehicleId} (${issue.tripId})`,
    message: `${issue.driverName}${issue.location ? ` near ${issue.location}` : ""}. ${
      issue.delayMin ? `About ${issue.delayMin} min delay. ` : ""
    }${continueLabel(issue.canContinue)}.${issue.note ? ` “${issue.note}”` : ""}`
  });
  return issue;
}

/** Dispatcher has seen it — the driver gets a confirmation on the phone. */
export function acknowledgeIssue(id, by, replyToDriver) {
  const issue = patch(id, (i) => ({
    ...i,
    status: i.status === "new" ? "seen" : i.status,
    seenAt: i.seenAt || new Date().toISOString(),
    seenBy: by,
    replyToDriver: replyToDriver || i.replyToDriver,
    timeline: [...i.timeline, event(`Seen by ${by}${replyToDriver ? `. Reply to driver: “${replyToDriver}”` : ""}`, by)]
  }));
  if (issue) {
    pushNotification({
      role: "driver",
      driverName: issue.driverName,
      type: "info",
      orderRef: issue.tripId,
      title: `Dispatch has seen your report (${issue.tripId})`,
      message: replyToDriver || "The dispatcher is working on it. Stay safe and wait for instructions."
    });
  }
  return issue;
}

/** Tell each affected store manager that the delivery will be late. */
export function notifyStoresOfDelay(id, { stores, reasonText, messageFor, by }) {
  const now = new Date().toISOString();
  const sent = stores.map((s) => {
    const message = messageFor(s);
    pushNotification({
      role: "store_manager",
      outletId: s.outletId,
      type: "delay",
      orderRef: s.orderRef || undefined,
      title: `Delivery delayed${s.newEta ? `: now around ${s.newEta}` : ""}`,
      message
    });
    return { outletId: s.outletId, name: s.name, plannedEta: s.plannedEta, newEta: s.newEta, message, at: now };
  });

  const issue = patch(id, (i) => ({
    ...i,
    status: i.status === "resolved" ? "resolved" : "stores_notified",
    seenAt: i.seenAt || now,
    seenBy: i.seenBy || by,
    delayReasonText: reasonText,
    storesNotified: [...(i.storesNotified || []), ...sent],
    timeline: [...i.timeline, event(`${by} told ${sent.length} store${sent.length === 1 ? "" : "s"} about the delay: ${sent.map((s) => s.outletId).join(", ")}`, by)]
  }));
  if (issue) {
    pushNotification({
      role: "driver",
      driverName: issue.driverName,
      type: "info",
      orderRef: issue.tripId,
      title: "Stores have been told you'll be late",
      message: `${sent.map((s) => s.outletId).join(", ")} know about the delay.`
    });
  }
  return issue;
}

export function resolveIssue(id, { resolution, by }) {
  const issue = patch(id, (i) => ({
    ...i,
    status: "resolved",
    resolution,
    resolvedAt: new Date().toISOString(),
    timeline: [...i.timeline, event(`Resolved by ${by}: ${resolution}`, by)]
  }));
  if (issue) {
    pushNotification({
      role: "driver",
      driverName: issue.driverName,
      type: "info",
      orderRef: issue.tripId,
      title: `Issue closed (${issue.tripId})`,
      message: resolution
    });
  }
  return issue;
}

// ---------- store message ----------
export function buildDelayMessage({ store, issue, reasonText, dispatcher }) {
  return [
    `Dear ${store.name || store.outletId} team,`,
    ``,
    `We are sorry to let you know that today's delivery to your store${issue.orderRefs?.length ? ` (${issue.orderRefs.join(", ")})` : ""} on trip ${issue.tripId} will be late because ${reasonText}.`,
    store.plannedEta && store.newEta
      ? `It was planned to arrive around ${store.plannedEta}; we now expect it around ${store.newEta}.`
      : store.newEta
        ? `We now expect it around ${store.newEta}.`
        : `We will send you a new arrival time as soon as we have one.`,
    ``,
    `Please keep a member of staff ready to receive it. We apologise for the inconvenience.`,
    `${dispatcher || "Dispatch team"}, Waypoint Dispatch (${issue.depot} depot)`
  ].join("\n");
}

/** Plain-language reason for the store, from the driver's report. */
export function defaultReasonText(issue) {
  switch (issue.type) {
    case "breakdown": return "the delivery vehicle has broken down on the way";
    case "flat_tyre": return "the delivery vehicle has a flat tyre";
    case "accident": return "the delivery vehicle was involved in a road incident";
    case "reefer_failure": return "the vehicle's cooling unit needs attention before chilled goods can be delivered";
    case "fuel": return "the delivery vehicle has a fuel problem";
    case "driver_unwell": return "the driver has been taken ill and a relief driver is on the way";
    case "traffic": return "of heavy traffic and a road closure on the route";
    case "weather": return "of bad weather on the route";
    case "store_closed": return "an earlier drop on the route took longer than planned";
    default: return "of a problem on the route";
  }
}
