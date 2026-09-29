// src/data/inventoryStore.js
// Inventory validation for the Order Management workflow.
//
// The order records only carry (depot, brand, category, order_units) — not a
// specific product_id — so supply is checked at the depot+brand+category
// level: total available_stock across every product in that group, from
// waypoint_warehouse_inventory_700_items.csv. This is documented here
// because it's a modelling choice, not something the dataset states.
//
// Depot naming is inconsistent across the seed files ("Peliyagoda" vs
// "Paliyagoda"), so names are normalised before grouping.

import Papa from "papaparse";

const LS_RESERVED = "wp_inventory_reserved_units";

export const normaliseDepot = (d) => {
  const s = (d || "").trim().toLowerCase();
  if (s.startsWith("pel") || s.startsWith("pal")) return "Peliyagoda";
  if (s.startsWith("kan")) return "Kandy";
  return d || "Peliyagoda";
};

const groupKey = (depot, brand, category) => `${normaliseDepot(depot)}|${brand}|${category}`;

const loadCsv = (path) =>
  new Promise((resolve) => {
    Papa.parse(path, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data),
      error: () => resolve([])
    });
  });

const readReserved = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_RESERVED) || "{}");
  } catch {
    return {};
  }
};
const writeReserved = (obj) => {
  try {
    localStorage.setItem(LS_RESERVED, JSON.stringify(obj));
  } catch {
    /* storage unavailable */
  }
};

/**
 * Loads and aggregates warehouse inventory into a Map keyed by
 * "depot|brand|category" -> { availableStock, demand, reorderLevel }.
 * Call once per page load; cheap enough not to need extra caching here.
 */
export async function loadInventoryAggregate() {
  const rows = await loadCsv("/waypoint_warehouse_inventory_700_items.csv");
  const agg = new Map();

  rows.forEach((r) => {
    const key = groupKey(r.warehouse_name, r.brand, r.category);
    const prev = agg.get(key) || { availableStock: 0, demand: 0, reorderLevel: 0 };
    agg.set(key, {
      availableStock: prev.availableStock + (Number(r.available_stock) || 0),
      demand: prev.demand + (Number(r.demand) || 0),
      reorderLevel: prev.reorderLevel + (Number(r.reorder_level) || 0)
    });
  });

  return agg;
}

/**
 * Checks one order's units against the aggregate, minus whatever this
 * session has already reserved against the same group (so repeated
 * approvals in one sitting don't over-allocate the same visible stock).
 */
export function checkInventory(order, aggregate) {
  const key = groupKey(order.depot, order.brand, order.category);
  const base = aggregate.get(key) || { availableStock: 0, demand: 0, reorderLevel: 0 };
  const reserved = readReserved()[key] || 0;
  const effectiveAvailable = Math.max(0, base.availableStock - reserved);
  const requested = Number(order.order_units) || 0;
  const sufficient = effectiveAvailable >= requested;

  return {
    key,
    requestedUnits: requested,
    availableUnits: effectiveAvailable,
    shortfallUnits: sufficient ? 0 : requested - effectiveAvailable,
    sufficient
  };
}

/** Call when an order is approved so subsequent checks see reduced stock. */
export function reserveInventory(order) {
  const key = groupKey(order.depot, order.brand, order.category);
  const reserved = readReserved();
  reserved[key] = (reserved[key] || 0) + (Number(order.order_units) || 0);
  writeReserved(reserved);
}

/** Call if an approval is reversed, to release the held units. */
export function releaseInventory(order) {
  const key = groupKey(order.depot, order.brand, order.category);
  const reserved = readReserved();
  reserved[key] = Math.max(0, (reserved[key] || 0) - (Number(order.order_units) || 0));
  writeReserved(reserved);
}
