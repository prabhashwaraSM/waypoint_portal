import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import Papa from "papaparse";
import { 
  Boxes, 
  Store, 
  Warehouse, 
  Search, 
  ArrowUpDown, 
  AlertTriangle, 
  Filter, 
  PackageCheck,
  TrendingUp,
  RefreshCw,
  Tag,
  MapPin
} from "lucide-react";

export default function Inventory({ view = "store" }) {
  const context = useOutletContext() || {};
  const { brand: contextBrand, setBrand: setContextBrand } = context;

  const [selectedBrand, setSelectedBrand] = useState(contextBrand || "Waypoint Fresh");
  const [activeTab, setActiveTab] = useState(view); // store or warehouse
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveTab(view || "store");
  }, [view]);

  // Store & Outlet Inventory Datasets
  const [storeInventoryData, setStoreInventoryData] = useState({
    "Waypoint Fresh": { master: [], inventory: [] },
    "Waypoint Style": { master: [], inventory: [] },
    "Waypoint Tech": { master: [], inventory: [] }
  });

  // Warehouse Inventory Datasets
  const [warehouseInventory, setWarehouseInventory] = useState([]);
  const [warehouseMaster, setWarehouseMaster] = useState([]);

  // Active View Filters
  const [selectedOutlet, setSelectedOutlet] = useState("OUT001");
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [storageFilter, setStorageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Sorting
  const [sortField, setSortField] = useState("product_id");
  const [sortDirection, setSortDirection] = useState("asc");

  // Load CSV datasets on mount
  useEffect(() => {
    let loadedFiles = 0;
    const totalFiles = 8;

    const storeData = {
      "Waypoint Fresh": { master: [], inventory: [] },
      "Waypoint Style": { master: [], inventory: [] },
      "Waypoint Tech": { master: [], inventory: [] }
    };

    const checkComplete = () => {
      loadedFiles += 1;
      if (loadedFiles === totalFiles) {
        setStoreInventoryData(storeData);
        setLoading(false);
      }
    };

    const parseNum = (val) => parseInt(val || 0, 10);

    // 1. Fresh Store Master & Inventory
    Papa.parse("/fresh_300_item_master.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        storeData["Waypoint Fresh"].master = res.data;
        checkComplete();
      }
    });

    Papa.parse("/fresh_inventory_80_outlets_300_items.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        storeData["Waypoint Fresh"].inventory = res.data.map((r) => ({
          ...r,
          stock: parseNum(r.stock),
          reserved: parseNum(r.reserved),
          available_stock: parseNum(r.available_stock),
          demand: parseNum(r.demand),
          incoming: parseNum(r.incoming),
          reorder_level: parseNum(r.reorder_level),
          storage_type: r.storage_type || "fresh"
        }));
        checkComplete();
      }
    });

    // 2. Style Store Master & Inventory
    Papa.parse("/waypoint_style_200_item_master.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        storeData["Waypoint Style"].master = res.data;
        checkComplete();
      }
    });

    Papa.parse("/waypoint_style_inventory_200_items.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        storeData["Waypoint Style"].inventory = res.data.map((r) => ({
          ...r,
          stock: parseNum(r.stock),
          reserved: parseNum(r.reserved),
          available_stock: parseNum(r.available_stock),
          demand: parseNum(r.demand),
          incoming: parseNum(r.incoming),
          reorder_level: parseNum(r.reorder_level),
          storage_type: r.storage_type || "standard"
        }));
        checkComplete();
      }
    });

    // 3. Tech Store Master & Inventory
    Papa.parse("/waypoint_tech_200_item_master.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        storeData["Waypoint Tech"].master = res.data;
        checkComplete();
      }
    });

    Papa.parse("/waypoint_tech_inventory_200_items.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        storeData["Waypoint Tech"].inventory = res.data.map((r) => ({
          ...r,
          stock: parseNum(r.stock),
          reserved: parseNum(r.reserved),
          available_stock: parseNum(r.available_stock),
          demand: parseNum(r.demand),
          incoming: parseNum(r.incoming),
          reorder_level: parseNum(r.reorder_level),
          storage_type: r.storage_type || "standard"
        }));
        checkComplete();
      }
    });

    // 4. Warehouse Master & Inventory (700 items)
    Papa.parse("/waypoint_all_700_item_master.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setWarehouseMaster(res.data);
        checkComplete();
      }
    });

    Papa.parse("/waypoint_warehouse_inventory_700_items.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = res.data.map((r) => ({
          ...r,
          stock: parseNum(r.stock),
          reserved: parseNum(r.reserved),
          available_stock: parseNum(r.available_stock),
          demand: parseNum(r.demand),
          incoming: parseNum(r.incoming),
          reorder_level: parseNum(r.reorder_level),
          storage_type: r.storage_type || "ambient"
        }));
        setWarehouseInventory(parsed);
        checkComplete();
      }
    });
  }, []);

  // Sync brand context with global layout
  const handleBrandSelect = (bName) => {
    setSelectedBrand(bName);
    if (setContextBrand) setContextBrand(bName);
    setCategoryFilter("ALL");
    setStorageFilter("ALL");
    setStatusFilter("ALL");
    setSearchTerm("");
  };

  // Match brand string helper
  const isBrandMatch = (itemBrand, targetBrand) => {
    if (!itemBrand) return false;
    const ib = itemBrand.toLowerCase();
    const tb = targetBrand.toLowerCase();
    if (tb.includes("fresh")) return ib.includes("fresh");
    if (tb.includes("style")) return ib.includes("style");
    if (tb.includes("tech")) return ib.includes("tech");
    return ib === tb;
  };

  // Active Store Inventory Datasets
  const currentStoreMaster = useMemo(() => {
    return storeInventoryData[selectedBrand]?.master || [];
  }, [storeInventoryData, selectedBrand]);

  const currentStoreInventory = useMemo(() => {
    return storeInventoryData[selectedBrand]?.inventory || [];
  }, [storeInventoryData, selectedBrand]);

  // Outlets list for selected brand
  const outletsList = useMemo(() => {
    const map = new Map();
    currentStoreInventory.forEach((item) => {
      if (!map.has(item.outlet_id)) {
        map.set(item.outlet_id, {
          id: item.outlet_id,
          district: item.district,
          depot: item.depot
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [currentStoreInventory]);

  // Reset selected outlet on brand switch
  useEffect(() => {
    if (outletsList.length > 0) {
      if (!outletsList.some((o) => o.id === selectedOutlet)) {
        setSelectedOutlet(outletsList[0].id);
      }
    }
  }, [outletsList, selectedOutlet]);

  // Active Warehouse Datasets for selected brand
  const currentWarehouseItems = useMemo(() => {
    return warehouseInventory.filter((row) => isBrandMatch(row.brand, selectedBrand));
  }, [warehouseInventory, selectedBrand]);

  // Categories list
  const categoriesList = useMemo(() => {
    const masterSet = activeTab === "store" ? currentStoreMaster : warehouseMaster.filter((i) => isBrandMatch(i.brand, selectedBrand));
    return ["ALL", ...new Set(masterSet.map((i) => i.category).filter(Boolean))];
  }, [activeTab, currentStoreMaster, warehouseMaster, selectedBrand]);

  // Unique Warehouses list
  const warehousesList = useMemo(() => {
    return ["ALL", ...new Set(currentWarehouseItems.map((w) => w.warehouse_name))];
  }, [currentWarehouseItems]);

  // Handle Sort Toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter & Sort Store Inventory View
  const filteredStoreInventory = useMemo(() => {
    let result = currentStoreInventory.filter((item) => item.outlet_id === selectedOutlet);

    if (categoryFilter !== "ALL") {
      result = result.filter((item) => item.category === categoryFilter);
    }
    if (statusFilter !== "ALL") {
      result = result.filter((item) => item.status === statusFilter);
    }
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.product_id.toLowerCase().includes(q) ||
          item.product_name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    currentStoreInventory,
    selectedOutlet,
    categoryFilter,
    statusFilter,
    searchTerm,
    sortField,
    sortDirection
  ]);

  // Filter & Sort Warehouse Inventory View
  const filteredWarehouseInventory = useMemo(() => {
    let result = [...currentWarehouseItems];

    if (selectedWarehouseFilter !== "ALL") {
      result = result.filter((item) => item.warehouse_name === selectedWarehouseFilter);
    }
    if (categoryFilter !== "ALL") {
      result = result.filter((item) => item.category === categoryFilter);
    }
    if (statusFilter !== "ALL") {
      result = result.filter((item) => item.status === statusFilter);
    }
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.product_id.toLowerCase().includes(q) ||
          item.product_name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA = a[sortField] ?? 0;
      let valB = b[sortField] ?? 0;

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    currentWarehouseItems,
    selectedWarehouseFilter,
    categoryFilter,
    statusFilter,
    searchTerm,
    sortField,
    sortDirection
  ]);

  // Store Summary Stats
  const storeStats = useMemo(() => {
    const raw = currentStoreInventory.filter((i) => i.outlet_id === selectedOutlet);
    return {
      totalItems: raw.length,
      totalStock: raw.reduce((sum, i) => sum + i.stock, 0),
      totalAvailable: raw.reduce((sum, i) => sum + i.available_stock, 0),
      totalDemand: raw.reduce((sum, i) => sum + i.demand, 0),
      lowStockAlerts: raw.filter((i) => i.status === "low_stock" || i.status === "out_of_stock").length
    };
  }, [currentStoreInventory, selectedOutlet]);

  // Warehouse Summary Stats
  const warehouseStats = useMemo(() => {
    const filtered = filteredWarehouseInventory;
    return {
      recordCount: filtered.length,
      totalStock: filtered.reduce((sum, i) => sum + i.stock, 0),
      totalAvailable: filtered.reduce((sum, i) => sum + i.available_stock, 0),
      totalDemand: filtered.reduce((sum, i) => sum + i.demand, 0),
      totalIncoming: filtered.reduce((sum, i) => sum + i.incoming, 0)
    };
  }, [filteredWarehouseInventory]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "in_stock":
        return <span className="status shipped">In Stock</span>;
      case "low_stock":
        return <span className="status pending">Low Stock</span>;
      case "out_of_stock":
        return <span className="status delayed">Out of Stock</span>;
      default:
        return <span className="status packed">{status}</span>;
    }
  };

  const currentOutletDetails = outletsList.find((o) => o.id === selectedOutlet);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: "12px" }} />
        <p style={{ fontWeight: 600 }}>Loading Waypoint Inventory Datasets...</p>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      {/* Top Header */}
      <div className="page-heading" style={{ flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <h1>Inventory Management</h1>
        </div>

        {/* View Toggle Tabs */}
        <div style={{ display: "flex", gap: "8px", background: "var(--bg-subtle)", padding: "4px", borderRadius: "12px" }}>
          <button
            onClick={() => {
              setActiveTab("store");
              setSortField("product_id");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "store" ? "var(--bg-card)" : "transparent",
              color: activeTab === "store" ? "var(--primary)" : "var(--text-muted)",
              boxShadow: activeTab === "store" ? "var(--shadow-sm)" : "none"
            }}
          >
            <Store size={16} /> Stock by Store
          </button>
          <button
            onClick={() => {
              setActiveTab("warehouse");
              setSortField("product_id");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "warehouse" ? "var(--bg-card)" : "transparent",
              color: activeTab === "warehouse" ? "var(--primary)" : "var(--text-muted)",
              boxShadow: activeTab === "warehouse" ? "var(--shadow-sm)" : "none"
            }}
          >
            <Warehouse size={16} /> Warehouse Stock Window
          </button>
        </div>
      </div>

      {/* 3 Brand Selector Buttons */}
      <div className="panel" style={{ padding: "16px 20px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: isSelected ? "0 2px 8px rgba(79, 70, 229, 0.15)" : "none"
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

      {/* VIEW 1: STOCK BY STORE */}
      {activeTab === "store" && (
        <>
          {/* Store Selector Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)" }}>SELECT OUTLET ({outletsList.length} Total):</span>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-color)",
                  background: "var(--bg-card)",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--primary)",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {outletsList.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} - ({o.district} Zone | Depot: {o.depot})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
              District: <strong>{currentOutletDetails?.district}</strong> | Depot: <strong>{currentOutletDetails?.depot}</strong>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="stats-grid" style={{ marginBottom: "24px" }}>
            <div className="stat-card">
              <div className="stat-icon blue"><Boxes size={22} /></div>
              <div className="stat-content">
                <span>Total Items Managed</span>
                <strong>{storeStats.totalItems} Items</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><PackageCheck size={22} /></div>
              <div className="stat-content">
                <span>Available Stock</span>
                <strong>{storeStats.totalAvailable.toLocaleString()} Units</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><TrendingUp size={22} /></div>
              <div className="stat-content">
                <span>Active Demand</span>
                <strong>{storeStats.totalDemand.toLocaleString()} Units</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red"><AlertTriangle size={22} /></div>
              <div className="stat-content">
                <span>Low Stock / Reorder Alerts</span>
                <strong>{storeStats.lowStockAlerts} Items</strong>
              </div>
            </div>
          </div>

          {/* Table Panel */}
          <div className="panel">
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "20px" }}>
              {/* Search Box */}
              <div style={{ flex: 1, minWidth: "240px", position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={16} style={{ position: "absolute", left: "14px", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search item code, name, category..."
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

              {/* Category Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                <Filter size={14} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>CATEGORY:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ border: "none", background: "transparent", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>{c === "ALL" ? "All Categories" : c}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>STATUS:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ border: "none", background: "transparent", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              {/* Quick Sort Dropdown */}
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
                  <option value="product_id-asc">Item Code (A-Z)</option>
                  <option value="product_id-desc">Item Code (Z-A)</option>
                  <option value="available_stock-asc">Lowest Available Stock</option>
                  <option value="available_stock-desc">Highest Available Stock</option>
                  <option value="demand-desc">Highest Demand</option>
                  <option value="stock-desc">Highest Total Stock</option>
                </select>
              </div>
            </div>

            {/* Store Table */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => handleSort("product_id")} style={{ cursor: "pointer" }}>
                      Item Code {sortField === "product_id" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th onClick={() => handleSort("product_name")} style={{ cursor: "pointer" }}>
                      Product Name {sortField === "product_name" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th>Category</th>
                    <th onClick={() => handleSort("stock")} style={{ cursor: "pointer", textAlign: "right" }}>
                      Total Stock {sortField === "stock" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th onClick={() => handleSort("reserved")} style={{ cursor: "pointer", textAlign: "right" }}>
                      Reserved {sortField === "reserved" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th onClick={() => handleSort("available_stock")} style={{ cursor: "pointer", textAlign: "right" }}>
                      Available Stock {sortField === "available_stock" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th onClick={() => handleSort("demand")} style={{ cursor: "pointer", textAlign: "right" }}>
                      Demand {sortField === "demand" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th onClick={() => handleSort("incoming")} style={{ cursor: "pointer", textAlign: "right" }}>
                      Incoming {sortField === "incoming" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th>Reorder Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStoreInventory.map((item) => (
                    <tr key={item.product_id}>
                      <td>
                        <strong style={{ color: "var(--primary)", fontFamily: "monospace", fontSize: "14px" }}>
                          {item.product_id}
                        </strong>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                      <td>{item.category}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {item.stock} {item.unit}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--text-muted)" }}>
                        {item.reserved}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 800, color: item.available_stock <= item.reorder_level ? "#dc2626" : "#16a34a" }}>
                        {item.available_stock} {item.unit}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{item.demand}</td>
                      <td style={{ textAlign: "right", color: "var(--accent-blue)" }}>+{item.incoming}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>{item.reorder_level} {item.unit}</td>
                      <td>{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                  {filteredStoreInventory.length === 0 && (
                    <tr>
                      <td colSpan="10" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                        No store stock records found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: WAREHOUSE STOCK WINDOW (ACTUAL WAREHOUSE INVENTORY) */}
      {activeTab === "warehouse" && (
        <>
          {/* Stat Cards for Central Warehouse */}
          <div className="stats-grid" style={{ marginBottom: "24px" }}>
            <div className="stat-card">
              <div className="stat-icon blue"><Warehouse size={22} /></div>
              <div className="stat-content">
                <span>Warehouse Items</span>
                <strong>{warehouseStats.recordCount} Records</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><Boxes size={22} /></div>
              <div className="stat-content">
                <span>Warehouse Stock</span>
                <strong>{warehouseStats.totalStock.toLocaleString()} Units</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><TrendingUp size={22} /></div>
              <div className="stat-content">
                <span>Total Demand</span>
                <strong>{warehouseStats.totalDemand.toLocaleString()} Units</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><PackageCheck size={22} /></div>
              <div className="stat-content">
                <span>Incoming Pipeline</span>
                <strong>{warehouseStats.totalIncoming.toLocaleString()} Units</strong>
              </div>
            </div>
          </div>

          {/* Central Warehouse Table Panel */}
          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                <Warehouse size={18} color="var(--primary)" /> Central Warehouse Inventory ({selectedBrand})
              </h2>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                Actual Depot Inventory Records
              </span>
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "20px" }}>
              {/* Search Box */}
              <div style={{ flex: 1, minWidth: "240px", position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={16} style={{ position: "absolute", left: "14px", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search item code (e.g., FRESH-001, STYLE-001, TECH-001), name..."
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

              {/* Warehouse Depot Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                <MapPin size={14} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>DEPOT:</span>
                <select
                  value={selectedWarehouseFilter}
                  onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                  style={{ border: "none", background: "transparent", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}
                >
                  {warehousesList.map((w) => (
                    <option key={w} value={w}>{w === "ALL" ? "All Warehouses" : w}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                <Filter size={14} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>CATEGORY:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ border: "none", background: "transparent", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}
                >
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>{c === "ALL" ? "All Categories" : c}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", padding: "8px 14px", border: "1px solid var(--border-color)", borderRadius: "10px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>STATUS:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ border: "none", background: "transparent", fontSize: "13px", fontWeight: 600, outline: "none", cursor: "pointer" }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
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
                  <option value="product_id-asc">Item Code (A-Z)</option>
                  <option value="product_id-desc">Item Code (Z-A)</option>
                  <option value="stock-desc">Highest Warehouse Stock</option>
                  <option value="available_stock-asc">Lowest Available Stock</option>
                  <option value="demand-desc">Highest Demand</option>
                </select>
              </div>
            </div>

            {/* Warehouse Master Table */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => handleSort("warehouse_name")} style={{ cursor: "pointer" }}>
                      Warehouse {sortField === "warehouse_name" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th onClick={() => handleSort("product_id")} style={{ cursor: "pointer" }}>
                      Item Code {sortField === "product_id" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th onClick={() => handleSort("product_name")} style={{ cursor: "pointer" }}>
                      Product Name {sortField === "product_name" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th>Category</th>
                    <th onClick={() => handleSort("stock")} style={{ cursor: "pointer", textAlign: "right" }}>
                      Warehouse Stock {sortField === "stock" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th onClick={() => handleSort("reserved")} style={{ cursor: "pointer", textAlign: "right" }}>
                      Reserved {sortField === "reserved" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th onClick={() => handleSort("available_stock")} style={{ cursor: "pointer", textAlign: "right" }}>
                      Available Stock {sortField === "available_stock" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th onClick={() => handleSort("demand")} style={{ cursor: "pointer", textAlign: "right" }}>
                      Demand {sortField === "demand" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th onClick={() => handleSort("incoming")} style={{ cursor: "pointer", textAlign: "right" }}>
                      Incoming {sortField === "incoming" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th>Reorder Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWarehouseInventory.map((item, idx) => (
                    <tr key={`${item.warehouse_id}-${item.product_id}-${idx}`}>
                      <td>
                        <strong style={{ color: "var(--text-main)" }}>{item.warehouse_name}</strong>
                      </td>
                      <td>
                        <strong style={{ color: "var(--primary)", fontFamily: "monospace", fontSize: "14px" }}>
                          {item.product_id}
                        </strong>
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.product_name}</td>
                      <td>{item.category}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {item.stock.toLocaleString()} {item.unit}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--text-muted)" }}>
                        {item.reserved.toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 800, color: item.available_stock <= item.reorder_level ? "#dc2626" : "#16a34a" }}>
                        {item.available_stock.toLocaleString()} {item.unit}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {item.demand.toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right", color: "var(--accent-blue)" }}>
                        +{item.incoming.toLocaleString()}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                        {item.reorder_level} {item.unit}
                      </td>
                      <td>{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                  {filteredWarehouseInventory.length === 0 && (
                    <tr>
                      <td colSpan="11" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                        No warehouse stock records match your search criteria for {selectedBrand}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}