// src/data/capacityPlanner.js
// Day-by-day dispatch capacity plan for each depot.
//
// Approved orders are placed onto the vehicles that are actually available on
// each date (not in the workshop, not taken off the road by the dispatcher).
// Every vehicle class has a daily capacity: drops (stops), weight and volume.
// An order that cannot be placed on its required date is carried to the next
// day, and the first date it fits becomes the proposed new dispatch date.
//
// Pure functions only (no browser APIs) so the plan can be tested in Node.

export const DEFAULT_SETTINGS = {
  vanDropsPerTrip: 3, // van-only outlets are in narrow streets with short windows
  truckDropsPerTrip: 5,
  tripsPerDay: 1,
  horizonDays: 7 // how far ahead to look for a new date
};

export const POOLS = [
  { key: "reefer_van", label: "Reefer van", type: "van", temp: "reefer" },
  { key: "ambient_van", label: "Ambient van", type: "van", temp: "ambient" },
  { key: "reefer_truck", label: "Reefer lorry", type: "truck", temp: "reefer" },
  { key: "ambient_truck", label: "Ambient lorry", type: "truck", temp: "ambient" }
];
const POOL_LABEL = Object.fromEntries(POOLS.map((p) => [p.key, p.label]));

export const addDaysIso = (iso, days) => {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
export const daysBetweenIso = (a, b) => Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);

/** Which vehicle classes can carry an order, most suitable first. */
export function eligiblePools(order) {
  const chilled = order.temp === "chilled";
  const vanOnly = order.parkingConstraint === "van_only";
  if (vanOnly) return chilled ? ["reefer_van"] : ["ambient_van", "reefer_van"];
  if (chilled) return ["reefer_truck", "reefer_van"];
  return ["ambient_truck", "reefer_truck", "ambient_van", "reefer_van"];
}

function buildDayPools(depot, date, vehicles, settings, offRoad) {
  const offToday = new Set(offRoad.filter((o) => o.date === date).map((o) => o.vehicleId));
  const pools = {};
  POOLS.forEach((p) => {
    const all = vehicles.filter((v) => v.depot === depot && v.type === p.type && v.temp === p.temp);
    // Biggest vehicles are sent out first.
    const usable = all
      .filter((v) => !v.inWorkshop && !offToday.has(v.id))
      .sort((a, b) => b.weightCapKg - a.weightCapKg);
    const slots = [];
    for (let t = 0; t < settings.tripsPerDay; t++) usable.forEach((v) => slots.push(v));
    pools[p.key] = {
      ...p,
      total: all.length,
      inWorkshop: all.filter((v) => v.inWorkshop).length,
      offRoad: all.filter((v) => !v.inWorkshop && offToday.has(v.id)).length,
      available: usable.length,
      dropsPerTrip: p.type === "van" ? settings.vanDropsPerTrip : settings.truckDropsPerTrip,
      maxWeight: Math.max(0, ...usable.map((v) => v.weightCapKg)),
      maxVolume: Math.max(0, ...usable.map((v) => v.volumeCapM3)),
      slots, // vehicle-trips that can still leave the depot today
      trips: [], // trips opened today: { vehicleId, route, drops, weight, volume, cap }
      orders: 0
    };
  });
  return pools;
}

// A trip serves one brand in one district: stock for Fresh, Style and Tech
// is loaded separately, and a lorry does not cross the country between drops.
const routeKey = (o) => `${o.brand}|${o.district}`;

function findSpace(pool, o) {
  if (pool.available === 0 || pool.maxWeight < o.weightKg || pool.maxVolume < o.volumeM3) return null;
  const open = pool.trips.find(
    (t) =>
      t.route === routeKey(o) &&
      t.drops + 1 <= pool.dropsPerTrip &&
      t.weight + o.weightKg <= t.cap.weightCapKg &&
      t.volume + o.volumeM3 <= t.cap.volumeCapM3
  );
  if (open) return { trip: open };
  const slotIndex = pool.slots.findIndex((v) => v.weightCapKg >= o.weightKg && v.volumeCapM3 >= o.volumeM3);
  if (slotIndex === -1) return null;
  return { slotIndex };
}

function place(pool, o, space) {
  let trip = space.trip;
  if (!trip) {
    const [v] = pool.slots.splice(space.slotIndex, 1);
    trip = { vehicleId: v.id, route: routeKey(o), drops: 0, weight: 0, volume: 0, cap: v };
    pool.trips.push(trip);
  }
  trip.drops += 1;
  trip.weight += o.weightKg;
  trip.volume += o.volumeM3;
  pool.orders += 1;
}

/** Why the order's first-choice vehicle class could not take it. */
function explain(pool, o) {
  const name = pool.label.toLowerCase();
  if (pool.total === 0) return { code: "vehicle_shortage", text: `there is no ${name} at the ${o.depot} depot` };
  if (pool.available === 0) {
    const why = pool.inWorkshop && pool.offRoad ? "in the workshop or off the road" : pool.inWorkshop ? "in the workshop" : "off the road";
    return { code: "vehicle_shortage", text: `every ${name} is ${why}` };
  }
  if (pool.maxWeight < o.weightKg || pool.maxVolume < o.volumeM3)
    return { code: "capacity_shortage", text: `the order is bigger than any available ${name}` };
  const sameRoute = pool.trips.filter((t) => t.route === routeKey(o));
  if (pool.slots.length === 0 && sameRoute.length && sameRoute.every((t) => t.drops < pool.dropsPerTrip))
    return { code: "capacity_shortage", text: `the ${name}s going to ${o.district} are already full by weight or volume` };
  return {
    code: "vehicle_shortage",
    text:
      pool.available === 1
        ? `the only available ${name} is already booked for another route`
        : `${pool.available === 2 ? "both" : `all ${pool.available}`} ${name}s are already booked for other routes`
  };
}

function explainAll(pools, o) {
  const first = explain(pools[0], o);
  if (pools.length === 1) return first;
  const usable = pools.filter((p) => p.available > 0 && p.maxWeight >= o.weightKg && p.maxVolume >= o.volumeM3);
  if (usable.length === 0) return first;
  const list = usable.map((p) => `${p.available} ${p.label.toLowerCase()}${p.available === 1 ? "" : "s"}`).join(" and ");
  return {
    code: first.code,
    text:
      first.code === "capacity_shortage"
        ? first.text
        : `every suitable vehicle (${list}) is already booked for other routes`
  };
}

/**
 * @param {Object} p
 * @param {Array}  p.orders   [{ ref, depot, brand, district, requiredDate, orderDate, temp: "chilled"|"ambient", parkingConstraint, weightKg, volumeM3, ... }]
 * @param {Array}  p.vehicles fleet vehicles (fleetStore.loadFleet().vehicles)
 * @param {string} p.startDate first date that can still be dispatched
 * @param {Object} [p.settings]
 * @param {Array}  [p.offRoad] [{ vehicleId, date, reason }]
 */
export function planCapacity({ orders, vehicles, startDate, settings = DEFAULT_SETTINGS, offRoad = [] }) {
  const s = { ...DEFAULT_SETTINGS, ...settings };
  const depots = [...new Set([...vehicles.map((v) => v.depot), ...orders.map((o) => o.depot)])].sort();
  const lastRequired = orders.reduce((m, o) => (o.requiredDate > m ? o.requiredDate : m), startDate);
  const endDate = addDaysIso(lastRequired, s.horizonDays);

  const days = {}; // depot -> date -> { pools, demand, placed, short }
  const results = new Map(); // ref -> { plannedDate, reason, pool }

  depots.forEach((depot) => {
    days[depot] = {};
    // Anything required before the start date is already late: plan it first thing.
    const byDate = {};
    orders
      .filter((o) => o.depot === depot)
      .forEach((o) => {
        const due = o.requiredDate < startDate ? startDate : o.requiredDate;
        (byDate[due] = byDate[due] || []).push(o);
      });

    let carry = [];
    for (let date = startDate; date <= endDate; date = addDaysIso(date, 1)) {
      const pools = buildDayPools(depot, date, vehicles, s, offRoad);
      const due = byDate[date] || [];
      // Oldest commitments first; within a date the most constrained orders
      // (van-only, then chilled) go first so they are not crowded out.
      const rank = (o) => (o.parkingConstraint === "van_only" ? 0 : o.temp === "chilled" ? 1 : 2);
      const queue = [...carry, ...due].sort(
        (a, b) =>
          a.requiredDate.localeCompare(b.requiredDate) ||
          rank(a) - rank(b) ||
          (a.orderDate || "").localeCompare(b.orderDate || "") ||
          a.ref.localeCompare(b.ref)
      );

      const nextCarry = [];
      let placed = 0;
      queue.forEach((o) => {
        const options = eligiblePools(o);
        let key = null;
        let space = null;
        for (const k of options) {
          space = findSpace(pools[k], o);
          if (space) { key = k; break; }
        }
        const prev = results.get(o.ref);
        if (key) {
          place(pools[key], o, space);
          placed += 1;
          results.set(o.ref, { ...(prev || {}), plannedDate: date, pool: key });
        } else {
          // Keep the reason from the order's required date: that is the shortage the store feels.
          if (!prev?.reason) results.set(o.ref, { reason: explainAll(options.map((k) => pools[k]), o), shortOn: date, pool: null });
          nextCarry.push(o);
        }
      });

      days[depot][date] = {
        pools,
        demand: queue.length,
        carriedIn: carry.length,
        placed,
        short: nextCarry.length
      };
      carry = nextCarry;
    }
    carry.forEach((o) => {
      const prev = results.get(o.ref) || {};
      results.set(o.ref, { ...prev, plannedDate: null });
    });
  });

  const atRisk = orders
    .map((o) => ({ order: o, ...results.get(o.ref) }))
    .filter((r) => r.reason)
    .map((r) => {
      const effective = r.order.requiredDate < startDate ? startDate : r.order.requiredDate;
      return {
        ...r,
        effectiveDate: effective,
        proposedDate: r.plannedDate,
        daysLate: r.plannedDate ? daysBetweenIso(r.order.requiredDate, r.plannedDate) : null
      };
    })
    .sort((a, b) => a.order.requiredDate.localeCompare(b.order.requiredDate) || a.order.ref.localeCompare(b.order.ref));

  return { startDate, endDate, depots, days, atRisk, results, settings: s };
}

export const poolLabel = (key) => POOL_LABEL[key] || key;
