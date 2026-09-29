// src/data/fleetCapacityStore.js
// Fleet capacity pre-check for Order Management: given an order and the
// current fleet (from fleetStore.loadFleet), work out whether at least one
// available vehicle could actually carry it, applying every hard constraint
// from the Challenge Booklet's Operating Constraints section.

import { normaliseDepot } from "./inventoryStore";

/**
 * @param {Object} order  { depot, temp_requirement, parking_constraint, order_weight_kg, order_volume_m3 }
 * @param {Array} vehicles  the `vehicles` array returned by fleetStore.loadFleet()
 */
export function checkFleetCapacity(order, vehicles) {
  const depot = normaliseDepot(order.depot);
  const needsReefer = (order.temp_requirement || "").toLowerCase() === "chilled";
  const vanOnly = (order.parking_constraint || "") === "van_only";
  const weightKg = Number(order.order_weight_kg) || 0;
  const volumeM3 = Number(order.order_volume_m3) || 0;

  const candidates = vehicles.filter((v) => normaliseDepot(v.depot) === depot);

  const eligible = candidates.filter((v) => {
    if (v.inWorkshop) return false;
    if (needsReefer && v.temp !== "reefer") return false;
    if (vanOnly && v.type !== "van") return false;
    if (v.weightCapKg < weightKg) return false;
    if (v.volumeCapM3 < volumeM3) return false;
    return true;
  });

  const reasons = [];
  if (candidates.length === 0) reasons.push(`No vehicles registered at ${depot}.`);
  else if (eligible.length === 0) {
    if (needsReefer && !candidates.some((v) => v.temp === "reefer" && !v.inWorkshop))
      reasons.push("No refrigerated vehicle available at this depot.");
    if (vanOnly && !candidates.some((v) => v.type === "van" && !v.inWorkshop))
      reasons.push("Outlet requires a van, none available at this depot.");
    if (!candidates.some((v) => v.weightCapKg >= weightKg && !v.inWorkshop))
      reasons.push("No vehicle with sufficient weight capacity.");
    if (!candidates.some((v) => v.volumeCapM3 >= volumeM3 && !v.inWorkshop))
      reasons.push("No vehicle with sufficient volume capacity.");
    if (reasons.length === 0) reasons.push("All matching vehicles are currently in the workshop.");
  }

  return {
    depot,
    sufficient: eligible.length > 0,
    eligibleCount: eligible.length,
    eligibleVehicleIds: eligible.map((v) => v.id),
    reasons
  };
}
