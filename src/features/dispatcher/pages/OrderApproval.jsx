import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Package,
  RefreshCw,
  Scale,
  Search,
  Tag,
  Truck,
  X,
  XCircle
} from "lucide-react";
import { loadInventoryAggregate, checkInventory, reserveInventory } from "../data/inventoryStore";
import { loadFleet } from "../data/fleetStore";
import { checkFleetCapacity } from "../data/fleetCapacityStore";
import { getAppOrders, subscribeAppOrders, updateAppOrderStatus } from "../data/orderPlacementStore";
import { notifyDeferral, notifyShortfall } from "../data/notificationStore";

const REASONS = [
  "Insufficient Warehouse Stock",
  "Vehicle / Driver Unavailable",
  "Temperature / Cold Chain Route Unavailability",
  "Outlet Credit / Payment Hold",
  "Incorrect Delivery Depot Specified",
  "Other"
];

function brandFull(raw) {
  if (String(raw || "").startsWith("Waypoint")) return raw;
  if (raw === "Style") return "Waypoint Style";
  if (raw === "Tech") return "Waypoint Tech";
  return "Waypoint Fresh";
}

function decisionFor(status) {
  if (status === "approved") return "approved";
  if (status === "deferred") return "deferred";
  if (status === "cancelled" || status === "rejected") return "rejected";
  return "pending";
}

function addDays(iso, days = 1) {
  const d = new Date((iso || new Date().toISOString().slice(0, 10)) + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function CheckBadge({ ok, goodLabel, badLabel, detail, icon: Icon }) {
  return (
    <span
      title={detail}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 8px",
        borderRadius: "999px",
        fontSize: "10px",
        fontWeight: 800,
        background: ok ? "#dcfce7" : "#fee2e2",
        color: ok ? "#15803d" : "#b91c1c",
        whiteSpace: "nowrap"
      }}
    >
      <Icon size={12} />
      {ok ? goodLabel : badLabel}
    </span>
  );
}

export default function OrderApproval() {
  const [selectedBrand, setSelectedBrand] = useState("Waypoint Fresh");
  const [orders, setOrders] = useState([]);
  const [inventoryAggregate, setInventoryAggregate] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("pending_approval");
  const [tempFilter, setTempFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("order_ref");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedOrderRefs, setSelectedOrderRefs] = useState([]);

  const [deferOrder, setDeferOrder] = useState(null);
  const [deferReason, setDeferReason] = useState(REASONS[0]);
  const [deferCustomReason, setDeferCustomReason] = useState("");
  const [deferDate, setDeferDate] = useState("");
  const [fleetWarningOrder, setFleetWarningOrder] = useState(null);
  const [toast, setToast] = useState("");

  const loadAll = async () => {
    setLoading(true);
    const csvOrders = await new Promise((resolve) => {
      Papa.parse("/waypoint_1500_orders_all_120_stores.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (res) => resolve(res.data || []),
        error: () => resolve([])
      });
    });

    const seeded = csvOrders.map((row) => ({
      ...row,
      order_units: Number(row.order_units || 0),
      order_weight_kg: Number(row.order_weight_kg || 0),
      order_volume_m3: Number(row.order_volume_m3 || 0),
      brand_full: brandFull(row.brand),
      decisionState: decisionFor(row.status),
      source: row.source || "seed"
    }));

    const app = getAppOrders().map((row) => ({
      ...row,
      order_units: Number(row.order_units || 0),
      order_weight_kg: Number(row.order_weight_kg || 0),
      order_volume_m3: Number(row.order_volume_m3 || 0),
      brand_full: brandFull(row.brand),
      decisionState: decisionFor(row.status),
      source: "app"
    }));

    const [aggregate, fleet] = await Promise.all([loadInventoryAggregate(), loadFleet()]);
    setInventoryAggregate(aggregate);
    setVehicles(fleet.vehicles || []);
    setOrders([...app, ...seeded]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    return subscribeAppOrders(() => loadAll());
  }, []);

  const checks = useMemo(() => {
    const map = new Map();
    if (!inventoryAggregate) return map;
    orders.forEach((order) => {
      map.set(order.order_ref, {
        inventory: checkInventory(order, inventoryAggregate),
        fleet: checkFleetCapacity(order, vehicles)
      });
    });
    return map;
  }, [orders, inventoryAggregate, vehicles]);

  const brandOrders = useMemo(
    () => orders.filter((o) => o.brand_full === selectedBrand),
    [orders, selectedBrand]
  );

  const districtsList = useMemo(
    () => ["ALL", ...new Set(brandOrders.map((o) => o.district).filter(Boolean))],
    [brandOrders]
  );

  const filteredOrders = useMemo(() => {
    let result = [...brandOrders];

    if (statusFilter === "pending_approval") {
      result = result.filter((o) => o.status === "pending_approval" || o.decisionState === "pending");
    } else if (statusFilter !== "ALL") {
      result = result.filter((o) => o.decisionState === statusFilter || o.status === statusFilter);
    }
    if (districtFilter !== "ALL") result = result.filter((o) => o.district === districtFilter);
    if (tempFilter !== "ALL") result = result.filter((o) => o.temp_requirement === tempFilter);

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter((o) =>
        [o.order_ref, o.outlet_id, o.district, o.category].some((value) =>
          String(value || "").toLowerCase().includes(q)
        )
      );
    }

    result.sort((a, b) => {
      let aa = a[sortField] ?? "";
      let bb = b[sortField] ?? "";
      if (typeof aa === "string") aa = aa.toLowerCase();
      if (typeof bb === "string") bb = bb.toLowerCase();
      if (aa < bb) return sortDirection === "asc" ? -1 : 1;
      if (aa > bb) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [brandOrders, statusFilter, districtFilter, tempFilter, searchTerm, sortField, sortDirection]);

  const stats = useMemo(() => ({
    pending: brandOrders.filter((o) => o.status === "pending_approval" || o.decisionState === "pending").length,
    approved: brandOrders.filter((o) => o.status === "approved" || o.decisionState === "approved").length,
    deferred: brandOrders.filter((o) => o.status === "deferred" || o.decisionState === "deferred").length,
    rejected: brandOrders.filter((o) => o.status === "cancelled" || o.decisionState === "rejected").length
  }), [brandOrders]);

  const updateLocalOrder = (ref, patch) => {
    setOrders((current) => current.map((order) => order.order_ref === ref ? { ...order, ...patch } : order));
    const target = orders.find((order) => order.order_ref === ref);
    if (target?.source === "app") updateAppOrderStatus(ref, patch);
  };

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const approveOrder = (order, forceFleet = false) => {
    const check = checks.get(order.order_ref);
    if (!check) return;

    if (!check.inventory.sufficient) {
      setDeferOrder(order);
      setDeferReason("Insufficient Warehouse Stock");
      setDeferCustomReason("");
      setDeferDate(addDays(order.required_date, 1));
      return;
    }

    if (!check.fleet.sufficient && !forceFleet) {
      setFleetWarningOrder(order);
      return;
    }

    reserveInventory(order);
    updateLocalOrder(order.order_ref, { status: "approved", decisionState: "approved" });
    setFleetWarningOrder(null);
    showToast(order.order_ref + " approved and inventory reserved.");
  };

  const openDefer = (order, reason = REASONS[0]) => {
    setDeferOrder(order);
    setDeferReason(reason);
    setDeferCustomReason("");
    setDeferDate(addDays(order.required_date, 1));
  };

  const confirmDefer = () => {
    if (!deferOrder || !deferDate) return;
    const reason = deferReason === "Other" ? deferCustomReason.trim() : deferReason;
    if (!reason) return;

    updateLocalOrder(deferOrder.order_ref, {
      status: "deferred",
      decisionState: "deferred",
      defer_reason: reason,
      deferred_to: deferDate
    });

    notifyDeferral({
      orderRef: deferOrder.order_ref,
      outletId: deferOrder.outlet_id,
      storeLabel: deferOrder.outlet_name || deferOrder.outlet_id,
      reason,
      newDate: deferDate
    });

    const inv = checks.get(deferOrder.order_ref)?.inventory;
    if (reason === "Insufficient Warehouse Stock" && inv && !inv.sufficient) {
      notifyShortfall({
        orderRef: deferOrder.order_ref,
        outletId: deferOrder.outlet_id,
        depot: deferOrder.depot,
        brand: deferOrder.brand,
        category: deferOrder.category,
        shortfallUnits: inv.shortfallUnits,
        reason
      });
    }

    showToast(deferOrder.order_ref + " deferred and store manager notified.");
    setDeferOrder(null);
  };

  const rejectOrder = (order) => {
    updateLocalOrder(order.order_ref, { status: "cancelled", decisionState: "rejected" });
    showToast(order.order_ref + " rejected.");
  };

  const handleBulkDecision = (decision) => {
    const targets = orders.filter((order) => selectedOrderRefs.includes(order.order_ref));
    if (decision === "approved") {
      targets.forEach((order) => approveOrder(order));
    } else if (decision === "rejected") {
      targets.forEach(rejectOrder);
    } else if (targets[0]) {
      openDefer(targets[0]);
    }
    setSelectedOrderRefs([]);
  };

  if (loading) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "60px" }}>
        <RefreshCw size={28} className="spin" />
        <p>Loading order approvals, warehouse inventory and fleet capacity...</p>
      </div>
    );
  }

  return (
    <div className="order-approval-page">
      <div className="page-heading"><h1>Order Allocation & Approvals</h1></div>

      <div className="panel order-brand-panel" style={{ padding: "16px 20px", marginBottom: "24px" }}>
        <div className="order-brand-row">
          <span className="order-filter-label"><Tag size={14} /> Brand</span>
          <div className="order-brand-buttons">
            {[
              ["Waypoint Fresh", "brand-a"],
              ["Waypoint Style", "brand-b"],
              ["Waypoint Tech", "brand-c"]
            ].map(([name, chip]) => (
              <button
                key={name}
                className={"order-brand-btn " + (selectedBrand === name ? "active" : "")}
                onClick={() => {
                  setSelectedBrand(name);
                  setDistrictFilter("ALL");
                  setTempFilter("ALL");
                  setSearchTerm("");
                  setSelectedOrderRefs([]);
                }}
              >
                <span className={"brand-chip " + chip}>{name.split(" ")[1]}</span>
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card"><div className="stat-icon purple"><Clock size={22} /></div><div className="stat-content"><span>Pending Review</span><strong>{stats.pending}</strong></div></div>
        <div className="stat-card"><div className="stat-icon green"><CheckCircle2 size={22} /></div><div className="stat-content"><span>Approved</span><strong>{stats.approved}</strong></div></div>
        <div className="stat-card"><div className="stat-icon blue"><Scale size={22} /></div><div className="stat-content"><span>Deferred</span><strong>{stats.deferred}</strong></div></div>
        <div className="stat-card"><div className="stat-icon red"><XCircle size={22} /></div><div className="stat-content"><span>Rejected</span><strong>{stats.rejected}</strong></div></div>
      </div>

      <div className="panel">
        <div className="order-toolbar">
          <label className="order-search">
            <Search size={16} />
            <input placeholder="Search order, outlet, district or category" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </label>

          <label className="order-filter"><Filter size={14} /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="deferred">Deferred</option>
            <option value="rejected">Rejected</option>
            <option value="ALL">All Statuses</option>
          </select></label>

          <label className="order-filter"><MapPin size={14} /><select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)}>
            {districtsList.map((d) => <option key={d} value={d}>{d === "ALL" ? "All Districts" : d}</option>)}
          </select></label>

          <label className="order-filter"><select value={tempFilter} onChange={(e) => setTempFilter(e.target.value)}>
            <option value="ALL">All Temperature</option>
            <option value="ambient">Ambient</option>
            <option value="chilled">Chilled</option>
          </select></label>

          <label className="order-filter"><ArrowUpDown size={14} /><select value={sortField + "-" + sortDirection} onChange={(e) => {
            const idx=e.target.value.lastIndexOf("-");
            setSortField(e.target.value.slice(0,idx));
            setSortDirection(e.target.value.slice(idx+1));
          }}>
            <option value="order_ref-asc">Order Ref A-Z</option>
            <option value="order_ref-desc">Order Ref Z-A</option>
            <option value="required_date-asc">Earliest Required Date</option>
            <option value="order_weight_kg-desc">Highest Weight</option>
            <option value="order_volume_m3-desc">Highest Volume</option>
          </select></label>
        </div>

        {selectedOrderRefs.length > 0 && (
          <div className="order-bulk-bar">
            <b>{selectedOrderRefs.length} selected</b>
            <div>
              <button className="order-action approve" onClick={() => handleBulkDecision("approved")}>Approve</button>
              <button className="order-action defer" onClick={() => handleBulkDecision("deferred")}>Defer</button>
              <button className="order-action reject" onClick={() => handleBulkDecision("rejected")}>Reject</button>
            </div>
          </div>
        )}

        <div className="table-wrap order-table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" checked={filteredOrders.length > 0 && selectedOrderRefs.length === filteredOrders.length} onChange={(e) => setSelectedOrderRefs(e.target.checked ? filteredOrders.map((o) => o.order_ref) : [])} /></th>
                <th>Order</th>
                <th>Outlet</th>
                <th>District / Depot</th>
                <th>Category</th>
                <th>Load</th>
                <th>Required</th>
                <th>Inventory</th>
                <th>Fleet</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const selected = selectedOrderRefs.includes(order.order_ref);
                const check = checks.get(order.order_ref);
                const inv = check?.inventory;
                const fleet = check?.fleet;
                return (
                  <tr key={order.order_ref} className={selected ? "order-row-selected" : ""}>
                    <td><input type="checkbox" checked={selected} onChange={() => setSelectedOrderRefs((current) => current.includes(order.order_ref) ? current.filter((ref) => ref !== order.order_ref) : [...current, order.order_ref])} /></td>
                    <td><strong className="order-ref">{order.order_ref}</strong><small>{order.temp_requirement || "ambient"}</small></td>
                    <td><b>{order.outlet_id}</b><small>{order.outlet_name || ""}</small></td>
                    <td><b>{order.district}</b><small>{order.depot}</small></td>
                    <td>{order.category}</td>
                    <td><b>{order.order_weight_kg} kg</b><small>{order.order_volume_m3} m³ • {order.order_units} units</small></td>
                    <td>{order.required_date}</td>
                    <td>
                      {inv && <CheckBadge icon={Package} ok={inv.sufficient} goodLabel={"Ready " + inv.availableUnits} badLabel={"Short " + inv.shortfallUnits} detail={"Requested " + inv.requestedUnits + ", available " + inv.availableUnits} />}
                    </td>
                    <td>
                      {fleet && <CheckBadge icon={Truck} ok={fleet.sufficient} goodLabel={fleet.eligibleCount + " vehicle(s)"} badLabel="No match" detail={fleet.sufficient ? fleet.eligibleVehicleIds.join(", ") : fleet.reasons.join(" ")} />}
                    </td>
                    <td>
                      <div className="order-actions">
                        <button className="order-action approve" onClick={() => approveOrder(order)}>Approve</button>
                        <button className="order-action defer" onClick={() => openDefer(order)}>Defer</button>
                        <button className="order-action reject" onClick={() => rejectOrder(order)}>Reject</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && <tr><td colSpan="10" className="order-empty">No orders match the current filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {deferOrder && (
        <div className="modal-overlay" onClick={() => setDeferOrder(null)}>
          <div className="modal-card order-defer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div><h3>Defer {deferOrder.order_ref}</h3><p>The store manager will receive the reason and new date.</p></div>
              <button className="modal-close" onClick={() => setDeferOrder(null)}><X size={18} /></button>
            </div>

            {checks.get(deferOrder.order_ref)?.inventory && !checks.get(deferOrder.order_ref).inventory.sufficient && (
              <div className="order-warning">
                <AlertTriangle size={17} />
                <span>Warehouse stock is short by {checks.get(deferOrder.order_ref).inventory.shortfallUnits} unit(s).</span>
              </div>
            )}

            <label className="modal-field"><span>Reason</span><select value={deferReason} onChange={(e) => setDeferReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></label>
            {deferReason === "Other" && <label className="modal-field"><span>Custom reason</span><textarea rows={3} value={deferCustomReason} onChange={(e) => setDeferCustomReason(e.target.value)} /></label>}
            <label className="modal-field"><span>New delivery date</span><input type="date" min={addDays(deferOrder.required_date, 1)} value={deferDate} onChange={(e) => setDeferDate(e.target.value)} /></label>

            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={() => setDeferOrder(null)}>Cancel</button>
              <button className="modal-btn primary" onClick={confirmDefer}>Defer & notify store</button>
            </div>
          </div>
        </div>
      )}

      {fleetWarningOrder && (
        <div className="modal-overlay" onClick={() => setFleetWarningOrder(null)}>
          <div className="modal-card order-defer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head"><div><h3>No matching vehicle right now</h3></div><button className="modal-close" onClick={() => setFleetWarningOrder(null)}><X size={18} /></button></div>
            <div className="order-warning"><AlertTriangle size={17} /><span>{checks.get(fleetWarningOrder.order_ref)?.fleet.reasons.join(" ")}</span></div>
            <p className="modal-sub">The supplied update allows approval after confirmation because this is only a fleet pre-check; vehicle assignment still happens in planning.</p>
            <div className="modal-actions">
              <button className="modal-btn ghost" onClick={() => openDefer(fleetWarningOrder, "Vehicle / Driver Unavailable")}>Defer instead</button>
              <button className="modal-btn primary" onClick={() => approveOrder(fleetWarningOrder, true)}>Approve anyway</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="order-toast"><CheckCircle2 size={16} /> {toast}</div>}
    </div>
  );
}
