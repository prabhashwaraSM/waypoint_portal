import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import Papa from "papaparse";
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Tag, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  MapPin, 
  Package,
  RefreshCw 
} from "lucide-react";

export default function Orders() {
  const context = useOutletContext() || {};
  const { brand: contextBrand, setBrand: setContextBrand } = context;

  const [selectedBrand, setSelectedBrand] = useState(contextBrand || "Waypoint Fresh");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tempFilter, setTempFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Sorting
  const [sortField, setSortField] = useState("order_ref");
  const [sortDirection, setSortDirection] = useState("asc");

  // Load 1,500 Orders dataset
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
          brand_full: row.brand === "Fresh" ? "Waypoint Fresh" : row.brand === "Style" ? "Waypoint Style" : "Waypoint Tech"
        }));
        setOrders(parsed);
        setLoading(false);
      },
      error: () => {
        console.error("Failed to load waypoint_1500_orders_all_120_stores.csv");
      }
    });
  }, []);

  const handleBrandSelect = (bName) => {
    setSelectedBrand(bName);
    if (setContextBrand) setContextBrand(bName);
    setDistrictFilter("ALL");
    setStatusFilter("ALL");
    setTempFilter("ALL");
    setSearchTerm("");
  };

  // Filter Orders by Active Brand
  const brandOrders = useMemo(() => {
    return orders.filter((o) => o.brand_full === selectedBrand || o.brand === selectedBrand.replace("Waypoint ", ""));
  }, [orders, selectedBrand]);

  const districtsList = useMemo(() => {
    return ["ALL", ...new Set(brandOrders.map((o) => o.district).filter(Boolean))];
  }, [brandOrders]);

  const statusesList = useMemo(() => {
    return ["ALL", ...new Set(brandOrders.map((o) => o.status).filter(Boolean))];
  }, [brandOrders]);

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

    if (districtFilter !== "ALL") {
      result = result.filter((o) => o.district === districtFilter);
    }
    if (statusFilter !== "ALL") {
      result = result.filter((o) => o.status === statusFilter);
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

  // Brand Order Statistics
  const stats = useMemo(() => {
    return {
      total: brandOrders.length,
      dispatched: brandOrders.filter((o) => o.status === "dispatched" || o.status === "in_transit" || o.status === "delivered").length,
      pendingApproval: brandOrders.filter((o) => o.status === "pending_approval").length,
      deferred: brandOrders.filter((o) => o.status === "deferred" || o.status === "cancelled").length
    };
  }, [brandOrders]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "delivered":
        return <span className="status shipped">Delivered</span>;
      case "in_transit":
      case "dispatched":
        return <span className="status shipped" style={{ background: "#dbeafe", color: "#1d4ed8" }}>In Transit</span>;
      case "pending_approval":
        return <span className="status pending">Pending Approval</span>;
      case "pending_load":
      case "loading":
      case "approved":
      case "pending_planning":
        return <span className="status packed">Pending Dispatch</span>;
      case "deferred":
      case "cancelled":
        return <span className="status delayed">{status}</span>;
      default:
        return <span className="status packed">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: "12px" }} />
        <p style={{ fontWeight: 600 }}>Loading 1,500 Order Records...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* Top Page Heading */}
      <div className="page-heading">
        <h1>Retail Orders & Logistics Dispatch Records</h1>
      </div>

      {/* 3 Brand Selector Banner */}
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

      {/* Top 4 Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-icon blue"><ShoppingCart size={22} /></div>
          <div className="stat-content">
            <span>Total Brand Orders</span>
            <strong>{stats.total.toLocaleString()} Orders</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Truck size={22} /></div>
          <div className="stat-content">
            <span>Dispatched / Active</span>
            <strong>{stats.dispatched.toLocaleString()} Orders</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Clock size={22} /></div>
          <div className="stat-content">
            <span>Pending Approval</span>
            <strong>{stats.pendingApproval.toLocaleString()} Orders</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={22} /></div>
          <div className="stat-content">
            <span>Deferred / Cancelled</span>
            <strong>{stats.deferred.toLocaleString()} Orders</strong>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="panel">
        {/* Toolbar */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "20px" }}>
          {/* Search Box */}
          <div style={{ flex: 1, minWidth: "240px", position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search Order Ref (e.g. ORD-00001), Outlet ID..."
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

          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
            <Filter size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>STATUS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ border: "none", background: "transparent", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}
            >
              {statusesList.map((s) => (
                <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</option>
              ))}
            </select>
          </div>

          {/* Temp Filter */}
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
              <option value="order_units-desc">Highest Order Units</option>
              <option value="order_volume_m3-desc">Highest Volume (m³)</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort("order_ref")} style={{ cursor: "pointer" }}>
                  Order Ref {sortField === "order_ref" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th>Outlet</th>
                <th>District Zone</th>
                <th>Category</th>
                <th onClick={() => handleSort("order_units")} style={{ cursor: "pointer", textAlign: "right" }}>
                  Units {sortField === "order_units" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("order_weight_kg")} style={{ cursor: "pointer", textAlign: "right" }}>
                  Weight (kg) {sortField === "order_weight_kg" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("order_volume_m3")} style={{ cursor: "pointer", textAlign: "right" }}>
                  Volume (m³) {sortField === "order_volume_m3" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("required_date")} style={{ cursor: "pointer" }}>
                  Required Date {sortField === "required_date" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => (
                <tr key={ord.order_ref}>
                  <td>
                    <strong style={{ color: "var(--primary)", fontFamily: "monospace", fontSize: "14px" }}>
                      {ord.order_ref}
                    </strong>
                  </td>
                  <td style={{ fontWeight: 600 }}>{ord.outlet_id}</td>
                  <td>{ord.district} ({ord.depot})</td>
                  <td>{ord.category}</td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{ord.order_units}</td>
                  <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{ord.order_weight_kg} kg</td>
                  <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{ord.order_volume_m3} m³</td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{ord.required_date}</td>
                  <td>{getStatusBadge(ord.status)}</td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                    No orders match your filter criteria for {selectedBrand}.
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