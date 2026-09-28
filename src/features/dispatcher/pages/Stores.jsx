import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import Papa from "papaparse";
import { Store, MapPin, Truck, ShieldAlert, Search, Filter } from "lucide-react";
import { brands } from "../data/mockData";

export default function Stores() {
  const { brand, setBrand } = useOutletContext();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("ALL");

  const matchBrand = (rawBrand) => {
    if (!rawBrand) return "Waypoint Fresh";
    const b = rawBrand.toString().trim().toLowerCase();
    if (b.includes("fresh")) return "Waypoint Fresh";
    if (b.includes("style")) return "Waypoint Style";
    if (b.includes("tech")) return "Waypoint Tech";
    return rawBrand;
  };

  useEffect(() => {
    fetch("/outlets.csv")
      .then((response) => response.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedData = results.data.map((row, idx) => {
              const fullBrand = matchBrand(row.brand);
              const deliveryWindow =
                fullBrand === "Waypoint Fresh"
                  ? "Pre-Dawn (03:30 - 08:00)"
                  : "Daytime (08:00 - 16:00)";

              const rawConstraint = (row.parking_constraint || "").toString().trim().toLowerCase();
              const isVanOnly = rawConstraint === "van_only" || rawConstraint === "van";

              return {
                id: row.order_ref || row.outlet_id || `OUT${String(idx + 1).padStart(3, "0")}`,
                name: row.outlet_name || `Outlet ${idx + 1}`,
                brand: fullBrand,
                district: row.district || "Colombo",
                dockType: row.dock_type || "street",
                parkingConstraint: isVanOnly ? "van_only" : "none",
                deliveryWindow: deliveryWindow
              };
            });
            setStores(parsedData);
            setLoading(false);
          }
        });
      });
  }, []);

  const filteredAndSortedStores = stores
    .filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.district.toLowerCase().includes(search.toLowerCase());
      const matchesDistrict = districtFilter === "ALL" || s.district === districtFilter;
      return matchesSearch && matchesDistrict;
    })
    .sort((a, b) => {
      const aIsActive = a.brand === brand ? -1 : 1;
      const bIsActive = b.brand === brand ? -1 : 1;
      return aIsActive - bIsActive;
    });

  const districts = ["ALL", ...new Set(stores.map((s) => s.district))];

  const getBrandChipClass = (storeBrand) => {
    switch (storeBrand) {
      case "Waypoint Fresh": return "brand-a";
      case "Waypoint Style": return "brand-b";
      case "Waypoint Tech": return "brand-c";
      default: return "";
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading Retail Outlets...</div>;

  return (
    <div className="stores-page">
      <div className="page-heading">
        <h1>Retail Outlets & Stores</h1>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Store size={22} /></div>
          <div className="stat-content">
            <span>Total Outlets</span>
            <strong>{stores.length}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><MapPin size={22} /></div>
          <div className="stat-content">
            <span>Districts Covered</span>
            <strong>{districts.length > 1 ? districts.length - 1 : 0}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><Truck size={22} /></div>
          <div className="stat-content">
            <span>Van Only Outlets</span>
            <strong>{stores.filter((s) => s.parkingConstraint === "van_only").length}</strong>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><ShieldAlert size={22} /></div>
          <div className="stat-content">
            <span>Unrestricted Access</span>
            <strong>{stores.filter((s) => s.parkingConstraint === "none").length}</strong>
          </div>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="panel table-panel" style={{ marginTop: "24px" }}>
        {/* Search, Brand Filter, and District Filter toolbar */}
        <div className="toolbar" style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
          
          {/* Search Box */}
          <div className="search-box" style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search store ID, name, or district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

          {/* Brand Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                background: "var(--bg-card)", 
                padding: "8px 14px", 
                border: "1px solid var(--border-color)", 
                borderRadius: "10px" 
              }}
            >
              <Filter size={14} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, whiteSpace: "nowrap" }}>
                BRAND:
              </span>
              <select 
                value={brand} 
                onChange={(e) => setBrand(e.target.value)} 
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* District Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                background: "var(--bg-card)", 
                padding: "8px 14px", 
                border: "1px solid var(--border-color)", 
                borderRadius: "10px" 
              }}
            >
              <MapPin size={14} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, whiteSpace: "nowrap" }}>
                DISTRICT:
              </span>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d === "ALL" ? "All Districts" : d}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Table View */}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Outlet Ref</th>
                <th>Store Name</th>
                <th>Brand</th>
                <th>District Zone</th>
                <th>Dock Type</th>
                <th>Delivery Window</th>
                <th>Parking Constraint</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStores.map((store) => (
                <tr key={store.id}>
                  <td><strong>{store.id}</strong></td>
                  <td>{store.name}</td>
                  <td>
                    <span className={`brand-chip ${getBrandChipClass(store.brand)}`}>
                      {store.brand}
                    </span>
                  </td>
                  <td>{store.district}</td>
                  <td>{store.dockType}</td>
                  <td>{store.deliveryWindow}</td>
                  <td>
                    {store.parkingConstraint === "van_only" ? (
                      <span className="status pending">Van Only</span>
                    ) : (
                      <span className="status confimred" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                        Unrestricted Access
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}