import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import Papa from "papaparse";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Tag, 
  MapPin, 
  Scale,
  RefreshCw
} from "lucide-react";

export default function OrderApproval() {
  const context = useOutletContext() || {};
  const { brand: contextBrand, setBrand: setContextBrand } = context;

  const [selectedBrand, setSelectedBrand] = useState(contextBrand || "Waypoint Fresh");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("pending_approval");
  const [tempFilter, setTempFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("order_ref");
  const [sortDirection, setSortDirection] = useState("asc");

  // Selection state for bulk actions
  const [selectedOrderRefs, setSelectedOrderRefs] = useState([]);

  // Load 1,500 Order Records
  useEffect(() => {
    Papa.parse("/waypoint_1500_orders_all_120_stores.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = res.data.map((row) => ({
          ...row,
          order_units: parseInt(row.order_units || 0, 10),
          order_weight_kg: parseFloat(row.order_weight_kg || 0),
          order_volume_m3: parseFloat(row.order_volume_m3 || 0),
          brand_full: row.brand === "Fresh" ? "Waypoint Fresh" : row.brand === "Style" ? "Waypoint Style" : "Waypoint Tech",
          // Standardize initial decision state based on status
          decisionState: row.status === "approved" ? "approved" : row.status === "deferred" ? "deferred" : row.status === "cancelled" ? "rejected" : "pending"
        }));
        setOrders(parsed);
        setLoading(false);
      },
      error: (err) => {
        console.error("Failed to load waypoint_1500_orders_all_120_stores.csv:", err);
        setLoading(false);
      }
    });
  }, []);

  const handleBrandSelect = (bName) => {
    setSelectedBrand(bName);
    if (setContextBrand) setContextBrand(bName);
    setDistrictFilter("ALL");
    setTempFilter("ALL");
    setSearchTerm("");
    setSelectedOrderRefs([]);
  };

  // Filter Orders by Active Brand
  const brandOrders = useMemo(() => {
    return orders.filter((o) => o.brand_full === selectedBrand || o.brand === selectedBrand.replace("Waypoint ", ""));
  }, [orders, selectedBrand]);

  const districtsList = useMemo(() => {
    return ["ALL", ...new Set(brandOrders.map((o) => o.district).filter(Boolean))];
  }, [brandOrders]);

  // Handle Action Decisions (Approve / Defer / Reject)
  const handleDecision = (ref, decision) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.order_ref === ref) {
          let newStatus = o.status;
          if (decision === "approved") newStatus = "approved";
          if (decision === "deferred") newStatus = "deferred";
          if (decision === "rejected") newStatus = "cancelled";
          return { ...o, decisionState: decision, status: newStatus };
        }
        return o;
      })
    );
  };

  // Bulk Decision Execution
  const handleBulkDecision = (decision) => {
    if (selectedOrderRefs.length === 0) return;
    setOrders((prev) =>
      prev.map((o) => {
        if (selectedOrderRefs.includes(o.order_ref)) {
          let newStatus = o.status;
          if (decision === "approved") newStatus = "approved";
          if (decision === "deferred") newStatus = "deferred";
          if (decision === "rejected") newStatus = "cancelled";
          return { ...o, decisionState: decision, status: newStatus };
        }
        return o;
      })
    );
    setSelectedOrderRefs([]);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderRefs(filteredOrders.map((o) => o.order_ref));
    } else {
      setSelectedOrderRefs([]);
    }
  };

  const handleSelectRow = (ref) => {
    setSelectedOrderRefs((prev) =>
      prev.includes(ref) ? prev.filter((r) => r !== ref) : [...prev, ref]
    );
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter & Sort Logic
  const filteredOrders = useMemo(() => {
    let result = [...brandOrders];

    if (statusFilter === "pending_approval") {
      result = result.filter((o) => o.status === "pending_approval" || o.decisionState === "pending");
    } else if (statusFilter !== "ALL") {
      result = result.filter((o) => o.decisionState === statusFilter || o.status === statusFilter);
    }

    if (districtFilter !== "ALL") {
      result = result.filter((o) => o.district === districtFilter);
    }
    if (tempFilter !== "ALL") {
      result = result.filter((o) => o.temp_requirement === tempFilter);
    }
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_ref.toLowerCase().includes(q) ||
          o.outlet_id.toLowerCase().includes(q) ||
          o.district.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA = a[sortField] ?? "";
      let valB = b[sortField] ?? "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [brandOrders, districtFilter, statusFilter, tempFilter, searchTerm, sortField, sortDirection]);

  // Brand Approval Metrics
  const stats = useMemo(() => {
    return {
      pending: brandOrders.filter((o) => o.status === "pending_approval" || o.decisionState === "pending").length,
      approved: brandOrders.filter((o) => o.decisionState === "approved" || o.status === "approved").length,
      deferred: brandOrders.filter((o) => o.decisionState === "deferred" || o.status === "deferred").length,
      rejected: brandOrders.filter((o) => o.decisionState === "rejected" || o.status === "cancelled").length
    };
  }, [brandOrders]);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: "12px" }} />
        <p style={{ fontWeight: 600 }}>Loading Order Approvals & Allocations...</p>
      </div>
    );
  }

  return (
    <div className="order-approval-page">
      {/* Page Title */}
      <div className="page-heading">
        <div>
          <h1>Order Allocation & Approvals</h1>
        </div>
      </div>

      {/* Brand Selection Bar */}
      <div className="panel" style={{ padding: "16px 20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase" }}>
            <Tag size={14} color="var(--primary)" /> Select Brand Context:
          </span>
          <div style={{ display: "flex", gap: "12px" }}>
            {[
              { id: "Waypoint Fresh", name: "Waypoint Fresh", chipClass: "brand-a" },
              { id: "Waypoint Style", name: "Waypoint Style", chipClass: "brand-b" },
              { id: "Waypoint Tech", name: "Waypoint Tech", chipClass: "brand-c" }
            ].map((b) => {
              const isSelected = selectedBrand === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => handleBrandSelect(b.id)}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                    background: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                    color: isSelected ? "var(--primary)" : "var(--text-main)",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <span className={`brand-chip ${b.chipClass}`} style={{ fontSize: "10px", padding: "2px 6px" }}>
                    {b.name.split(" ")[1]}
                  </span>
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon purple"><Clock size={22} /></div>
          <div className="stat-content">
            <span>Pending Review</span>
            <strong>{stats.pending} Orders</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle2 size={22} /></div>
          <div className="stat-content">
            <span>Approved (Served)</span>
            <strong>{stats.approved} Orders</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Scale size={22} /></div>
          <div className="stat-content">
            <span>Deferred (Daytime/Next)</span>
            <strong>{stats.deferred} Orders</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><XCircle size={22} /></div>
          <div className="stat-content">
            <span>Rejected / Cancelled</span>
            <strong>{stats.rejected} Orders</strong>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="panel">
        {/* Toolbar */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "20px" }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: "240px", position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search Order Ref (e.g. ORD-00009), Outlet ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="toolbar-input"
              style={{
                width: "100%",
                padding: "10px 14px 10px 38px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                fontSize: "13px",
                outline: "none"
              }}
            />
          </div>

          {/* Decision Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
            <Filter size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ border: "none", background: "transparent", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}
            >
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved (Served)</option>
              <option value="deferred">Deferred</option>
              <option value="rejected">Rejected</option>
              <option value="ALL">All Orders</option>
            </select>
          </div>

          {/* District Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
            <MapPin size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>DISTRICT:</span>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              style={{ border: "none", background: "transparent", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}
            >
              {districtsList.map((d) => (
                <option key={d} value={d}>{d === "ALL" ? "All Districts" : d}</option>
              ))}
            </select>
          </div>

          {/* Temp Requirement Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>TEMP:</span>
            <select
              value={tempFilter}
              onChange={(e) => setTempFilter(e.target.value)}
              style={{ border: "none", background: "transparent", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}
            >
              <option value="ALL">All Temp</option>
              <option value="ambient">Ambient</option>
              <option value="chilled">Chilled</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
            <ArrowUpDown size={14} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>SORT BY:</span>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split("-");
                setSortField(field);
                setSortDirection(dir);
              }}
              style={{ border: "none", background: "transparent", fontSize: "13px", fontWeight: 700, color: "var(--primary)", outline: "none", cursor: "pointer" }}
            >
              <option value="order_ref-asc">Order Ref (A-Z)</option>
              <option value="order_ref-desc">Order Ref (Z-A)</option>
              <option value="required_date-asc">Earliest Required Date</option>
              <option value="order_volume_m3-desc">Highest Volume (m³)</option>
              <option value="order_weight_kg-desc">Highest Weight (kg)</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedOrderRefs.length > 0 && (
          <div style={{ padding: "12px 16px", background: "var(--primary-light)", border: "1px solid #c7d2fe", borderRadius: "10px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>
              {selectedOrderRefs.length} order(s) selected
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => handleBulkDecision("approved")}
                style={{ padding: "6px 14px", borderRadius: "6px", background: "#16a34a", color: "#fff", border: "none", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
              >
                Approve Selected
              </button>
              <button
                onClick={() => handleBulkDecision("deferred")}
                style={{ padding: "6px 14px", borderRadius: "6px", background: "#d97706", color: "#fff", border: "none", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
              >
                Defer Selected
              </button>
              <button
                onClick={() => handleBulkDecision("rejected")}
                style={{ padding: "6px 14px", borderRadius: "6px", background: "#dc2626", color: "#fff", border: "none", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
              >
                Reject Selected
              </button>
            </div>
          </div>
        )}

        {/* Approval Table */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredOrders.length > 0 && selectedOrderRefs.length === filteredOrders.length}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th onClick={() => handleSort("order_ref")} style={{ cursor: "pointer" }}>
                  Order Ref {sortField === "order_ref" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th>Outlet</th>
                <th>District / Depot</th>
                <th>Category</th>
                <th onClick={() => handleSort("order_weight_kg")} style={{ cursor: "pointer", textAlign: "right" }}>
                  Weight (kg) {sortField === "order_weight_kg" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("order_volume_m3")} style={{ cursor: "pointer", textAlign: "right" }}>
                  Volume (m³) {sortField === "order_volume_m3" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("required_date")} style={{ cursor: "pointer" }}>
                  Required Date {sortField === "required_date" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th>Dock / Constraint</th>
                <th style={{ textAlign: "center" }}>Decision Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => {
                const isChecked = selectedOrderRefs.includes(ord.order_ref);
                return (
                  <tr key={ord.order_ref} style={{ background: isChecked ? "var(--primary-light)" : "transparent" }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleSelectRow(ord.order_ref)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    <td>
                      <strong style={{ color: "var(--primary)", fontFamily: "monospace", fontSize: "14px" }}>
                        {ord.order_ref}
                      </strong>
                    </td>
                    <td style={{ fontWeight: 600 }}>{ord.outlet_id}</td>
                    <td>{ord.district} ({ord.depot})</td>
                    <td>{ord.category}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{ord.order_weight_kg} kg</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{ord.order_volume_m3} m³</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{ord.required_date}</td>
                    <td>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "var(--bg-subtle)" }}>
                        {ord.dock_type} {ord.parking_constraint === "van_only" ? "(Van Only)" : ""}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        <button
                          title="Approve Order (Serve)"
                          onClick={() => handleDecision(ord.order_ref, "approved")}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "none",
                            background: ord.decisionState === "approved" ? "#16a34a" : "#dcfce7",
                            color: ord.decisionState === "approved" ? "#fff" : "#15803d",
                            fontWeight: 700,
                            fontSize: "11px",
                            cursor: "pointer"
                          }}
                        >
                          Approve
                        </button>

                        <button
                          title="Defer Order (Postpone)"
                          onClick={() => handleDecision(ord.order_ref, "deferred")}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "none",
                            background: ord.decisionState === "deferred" ? "#d97706" : "#fef3c7",
                            color: ord.decisionState === "deferred" ? "#fff" : "#b45309",
                            fontWeight: 700,
                            fontSize: "11px",
                            cursor: "pointer"
                          }}
                        >
                          Defer
                        </button>

                        <button
                          title="Reject Order (Cancel)"
                          onClick={() => handleDecision(ord.order_ref, "rejected")}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "none",
                            background: ord.decisionState === "rejected" ? "#dc2626" : "#fee2e2",
                            color: ord.decisionState === "rejected" ? "#fff" : "#b91c1c",
                            fontWeight: 700,
                            fontSize: "11px",
                            cursor: "pointer"
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No orders match your current filter criteria for {selectedBrand}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}