import React, { useEffect, useState, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import { loadFleet, saveDispatchedTrip, fmtDate } from "../data/fleetStore";
import {
  DISPATCH_TYPES, loadDrivers, loadParties, saveDispatchRecords, getAppDispatchRecords, nextInvoiceNo, nextDispatchNo
} from "../data/dispatchStore";
import { getSession } from "../../../shared/auth/auth";
import DispatchNote from "../components/DispatchNote";
import "../styles/dispatch.css";
import { 
  Truck, 
  Package, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Snowflake, 
  Plus, 
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Tag,
  UserRound,
  FileText,
  CalendarDays,
  Building2,
  Phone,
  IdCard
} from "lucide-react";

export default function Dispatch() {
  const context = useOutletContext() || {};
  const { warehouse = "Peliyagoda", brand: contextBrand, setBrand: setContextBrand } = context;
  const navigate = useNavigate();

  const [todayDate] = useState("2026-09-26");
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Filters & Sorting for Orders Queue
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [tempOrderFilter, setTempOrderFilter] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState(contextBrand || "Waypoint Fresh");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("district");
  const [sortDirection, setSortDirection] = useState("asc");

  // Form & Multipoint Selection states
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [parties, setParties] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [dispatchType, setDispatchType] = useState("Store replenishment");
  const [partyId, setPartyId] = useState("");
  const [otherCustomer, setOtherCustomer] = useState("");
  const [invoiceNo, setInvoiceNo] = useState(() => nextInvoiceNo());
  const [dispatchDate, setDispatchDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dispatchTime, setDispatchTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const [dispatchedRefs, setDispatchedRefs] = useState(() => new Set(getAppDispatchRecords().map((r) => r.order_ref)));
  const [tempRequiredFilter, setTempRequiredFilter] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");

  // Load Vehicles CSV
  useEffect(() => {
    // vehicles.csv + vehicles registered on Fleet > Vehicle Information, with their condition
    Promise.all([loadFleet(), loadDrivers(), loadParties()])
      .then(([fleet, drv, pts]) => {
        setVehicles(fleet.vehicles);
        setDrivers(drv);
        setParties(pts);
      })
      .catch((err) => console.error("Failed to load vehicles/drivers:", err))
      .finally(() => setLoadingVehicles(false));
  }, []);

  // Load Pending Dispatch Orders from 1,500 Orders CSV
  useEffect(() => {
    Papa.parse("/waypoint_1500_orders_all_120_stores.csv", {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const pendingStatuses = ["pending_load", "loading", "approved", "pending_planning"];
        const parsed = res.data
          .filter((row) => pendingStatuses.includes(row.status))
          .map((row) => ({
            id: row.order_ref,
            outlet: `${row.outlet_id} (${row.district})`,
            outlet_id: row.outlet_id,
            district: row.district || "Colombo",
            depot: row.depot || "Peliyagoda",
            weightKg: parseFloat(row.order_weight_kg || 0),
            volM3: parseFloat(row.order_volume_m3 || 0),
            units: parseInt(row.order_units || 0, 10),
            temp: row.temp_requirement === "chilled" ? "reefer" : "ambient",
            status: row.status,
            brand: row.brand === "Fresh" ? "Waypoint Fresh" : row.brand === "Style" ? "Waypoint Style" : "Waypoint Tech",
            required_date: row.required_date || "",
            dock_type: row.dock_type || "street",
            parking_constraint: row.parking_constraint || "none"
          }));
        setOrders(parsed);
        setLoadingOrders(false);
      },
      error: (err) => {
        console.error("Failed to load waypoint_1500_orders_all_120_stores.csv:", err);
        setLoadingOrders(false);
      }
    });
  }, []);

  const handleBrandSelect = (bName) => {
    setSelectedBrand(bName);
    if (setContextBrand) setContextBrand(bName);
    setDistrictFilter("ALL");
    setTempOrderFilter("ALL");
    setSearchTerm("");
    setSelectedOrders([]);
  };

  // Unique Districts for active brand
  const districtsList = useMemo(() => {
    const brandMatched = orders.filter((o) => o.brand === selectedBrand);
    return ["ALL", ...new Set(brandMatched.map((o) => o.district).filter(Boolean))];
  }, [orders, selectedBrand]);

  // Filter & Sort Order Queue according to Delivery Requirements and District
  const sortedAndFilteredOrders = useMemo(() => {
    let result = orders.filter((o) => o.brand === selectedBrand && !dispatchedRefs.has(o.id));

    if (districtFilter !== "ALL") {
      result = result.filter((o) => o.district === districtFilter);
    }
    if (tempOrderFilter !== "ALL") {
      result = result.filter((o) => o.temp === tempOrderFilter);
    }
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.outlet.toLowerCase().includes(q) ||
          o.district.toLowerCase().includes(q)
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
  }, [orders, selectedBrand, districtFilter, tempOrderFilter, searchTerm, sortField, sortDirection, dispatchedRefs]);

  // Filter vehicles by temperature filter
  const routeDepot = selectedOrders[0]?.depot;
  const filteredVehicles = vehicles
    .filter((v) => tempRequiredFilter === "all" || v.temp === tempRequiredFilter)
    .filter((v) => !routeDepot || v.depot === routeDepot);

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Multipoint route calculations
  const totalWeight = selectedOrders.reduce((sum, ord) => sum + ord.weightKg, 0);
  const totalVolume = selectedOrders.reduce((sum, ord) => sum + ord.volM3, 0);
  const hasReeferItem = selectedOrders.some((ord) => ord.temp === "reefer");

  const isOverweight = activeVehicle && totalWeight > activeVehicle.weightCapKg;
  const isOvervolume = activeVehicle && totalVolume > activeVehicle.volumeCapM3;
  const isTempMismatch = activeVehicle && hasReeferItem && activeVehicle.temp !== "reefer";

  const toggleOrderSelection = (order) => {
    if (selectedOrders.some((o) => o.id === order.id)) {
      setSelectedOrders(selectedOrders.filter((o) => o.id !== order.id));
    } else {
      setSelectedOrders([...selectedOrders, order]);
    }
  };

  // ---------- dispatch details ----------
  const activeDriver = drivers.find((d) => d.driver_id === selectedDriverId);
  const driverName = activeDriver?.driver_name || "";
  const typeInfo = DISPATCH_TYPES.find((t) => t.value === dispatchType);
  const partyOptions = parties.filter((p) =>
    dispatchType === "Agent order" ? p.party_type !== "Customer" : dispatchType === "Customer order" ? p.party_type === "Customer" : false
  );
  const selectedParty = parties.find((p) => p.party_id === partyId);
  const orderDepot = selectedOrders[0]?.depot || activeVehicle?.depot || warehouse;
  const mixedDepots = new Set(selectedOrders.map((o) => o.depot)).size > 1;
  const depotMismatch = activeVehicle && selectedOrders.length > 0 && activeVehicle.depot !== orderDepot;
  const otherDepot = orderDepot === "Kandy" ? "Peliyagoda" : "Kandy";
  const storesInRoute = [...new Set(selectedOrders.map((o) => o.outlet_id))];

  const customerLabel = (() => {
    if (dispatchType === "Store replenishment") return storesInRoute.length ? `${selectedBrand} stores: ${storesInRoute.join(", ")}` : "";
    if (dispatchType === "Inter-depot transfer") return `${otherDepot} Depot`;
    if (partyId === "OTHER") return otherCustomer.trim();
    return selectedParty ? selectedParty.name : "";
  })();

  const partyDetails =
    dispatchType === "Store replenishment"
      ? { type: "Own store", name: customerLabel, lines: storesInRoute.map((id) => {
          const o = selectedOrders.find((x) => x.outlet_id === id);
          return `${id}, ${o?.district}, ${o?.dock_type?.replace("_", " ")} dock`;
        }) }
      : dispatchType === "Inter-depot transfer"
      ? { type: "Depot", name: customerLabel, lines: [`From ${orderDepot} Depot`] }
      : selectedParty
      ? { type: selectedParty.party_type, name: selectedParty.name, lines: [selectedParty.address, `${selectedParty.contact_person}, ${selectedParty.phone}`] }
      : partyId === "OTHER" && otherCustomer.trim()
      ? { type: typeInfo?.party || "Customer", name: otherCustomer.trim(), lines: [] }
      : null;

  const selectVehicle = (id) => {
    setSelectedVehicleId(id);
    const d = drivers.find((x) => x.default_vehicle_id === id);
    if (d) setSelectedDriverId(d.driver_id);
  };

  const driversSorted = useMemo(() => {
    const depot = activeVehicle?.depot;
    return [...drivers].sort((a, b) => {
      const ra = a.default_vehicle_id === selectedVehicleId ? 0 : a.depot === depot ? 1 : 2;
      const rb = b.default_vehicle_id === selectedVehicleId ? 0 : b.depot === depot ? 1 : 2;
      return ra - rb || a.driver_name.localeCompare(b.driver_name);
    });
  }, [drivers, activeVehicle, selectedVehicleId]);

  const problems = [];
  if (selectedOrders.length === 0) problems.push("Select at least one order from the queue.");
  if (!customerLabel) problems.push(dispatchType === "Store replenishment" ? "Select orders to set the receiving stores." : "Choose the customer or agent.");
  if (!invoiceNo.trim()) problems.push("Enter the invoice number.");
  if (!dispatchDate) problems.push("Set the dispatch date.");
  if (!selectedVehicleId) problems.push("Assign a vehicle.");
  if (!selectedDriverId) problems.push("Assign a driver.");
  if (mixedDepots) problems.push("The selected orders ship from different warehouses. Dispatch one warehouse at a time.");
  if (depotMismatch) problems.push(`${activeVehicle.id} is based at ${activeVehicle.depot}, but these orders ship from ${orderDepot}. Choose a ${orderDepot} vehicle.`);
  if (activeVehicle?.inWorkshop) problems.push(`${activeVehicle.id} is in the workshop. Choose another vehicle.`);

  const handleCreateMultipointDispatch = (e) => {
    e.preventDefault();
    if (problems.length || isOverweight || isOvervolume || isTempMismatch) return;
    setReviewOpen(true);
  };

  const buildNote = () => ({
    dispatchNo: nextDispatchNo(new Date(dispatchDate + "T" + (dispatchTime || "00:00"))),
    invoiceNo: invoiceNo.trim(),
    dispatchType,
    dispatchDate,
    dispatchTime,
    warehouse: orderDepot,
    brand: selectedBrand,
    party: partyDetails,
    customerLabel,
    vehicle: activeVehicle,
    driver: activeDriver,
    orders: selectedOrders,
    totals: { weight: totalWeight, volume: totalVolume, units: selectedOrders.reduce((s, o) => s + o.units, 0) },
    dispatchedBy: getSession()?.name || "Dispatcher"
  });

  const confirmDispatch = () => {
    const note = buildNote();
    const tripId = `TRP-D${String(Date.now()).slice(-5)}`;
    note.tripId = tripId;

    // Trip for Fleet > Vehicle Tracking
    saveDispatchedTrip({
      trip_id: tripId,
      vehicle_id: selectedVehicleId,
      driver_name: driverName,
      brand: selectedBrand,
      depot: note.warehouse,
      departure_time: dispatchTime || "08:00",
      stops: storesInRoute,
      start_fuel_pct: 95,
      order_refs: selectedOrders.map((o) => o.id),
      source: "dispatch"
    });

    // One record per order for the Reports page
    saveDispatchRecords(
      selectedOrders.map((o) => ({
        order_ref: o.id,
        dispatch_no: note.dispatchNo,
        invoice_no: note.invoiceNo,
        dispatch_date: dispatchDate,
        dispatch_time: dispatchTime,
        dispatch_type: dispatchType,
        customer_agent: dispatchType === "Store replenishment" ? `${selectedBrand} store ${o.outlet_id}` : customerLabel,
        party_type: partyDetails?.type || "",
        vehicle_id: selectedVehicleId,
        driver_id: selectedDriverId,
        driver_name: driverName,
        driver_phone: activeDriver?.phone || "",
        trip_id: tripId,
        dispatched_by: note.dispatchedBy
      }))
    );

    setDispatchedRefs((prev) => new Set([...prev, ...selectedOrders.map((o) => o.id)]));
    setConfirmed(note);
  };

  const startNewDispatch = () => {
    setConfirmed(null);
    setReviewOpen(false);
    setSelectedOrders([]);
    setSelectedVehicleId("");
    setSelectedDriverId("");
    setPartyId("");
    setOtherCustomer("");
    setInvoiceNo(nextInvoiceNo());
  };

  if (loadingVehicles || loadingOrders) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
        <RefreshCw size={28} className="spin" style={{ marginBottom: "12px" }} />
        <p style={{ fontWeight: 600 }}>Loading Dispatch Control & Pending Orders...</p>
      </div>
    );
  }

  return (
    <div className="dispatch-page">
      <div className="page-heading">
        <div>
          <h1>Multipoint Dispatch & Route Allocation</h1>
          <p>Select orders, set the customer or agent, invoice and date, then assign a vehicle and driver.</p>
        </div>
      </div>

      {/* Brand Selector Bar */}
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


      <div className="dispatch-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
        {/* Multipoint Dispatch Builder */}
        <div className="panel">
          <div className="panel-title" style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700 }}>1. Pending Dispatch Orders Queue</h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Select multipoint drops to include in route</p>
          </div>

          {/* Queue Sorting & Filtering Controls */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            {/* Search */}
            <div style={{ flex: 1, minWidth: "180px", position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search Order Ref, Outlet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 30px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  fontSize: "12px",
                  outline: "none"
                }}
              />
            </div>

            {/* District Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-card)", padding: "6px 10px", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
              <MapPin size={12} style={{ color: "var(--text-muted)" }} />
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                style={{ border: "none", background: "transparent", fontSize: "12px", fontWeight: 600, outline: "none" }}
              >
                {districtsList.map((d) => (
                  <option key={d} value={d}>{d === "ALL" ? "All Districts" : d}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-card)", padding: "6px 10px", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
              <ArrowUpDown size={12} style={{ color: "var(--primary)" }} />
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [f, d] = e.target.value.split("-");
                  setSortField(f);
                  setSortDirection(d);
                }}
                style={{ border: "none", background: "transparent", fontSize: "12px", fontWeight: 700, color: "var(--primary)", outline: "none" }}
              >
                <option value="district-asc">Sort District (A-Z)</option>
                <option value="required_date-asc">Sort Required Date</option>
                <option value="volM3-desc">Highest Volume (m³)</option>
                <option value="weightKg-desc">Highest Weight (kg)</option>
              </select>
            </div>
          </div>

          {/* Pending Orders Selection Table */}
          <div className="table-wrap" style={{ maxHeight: "320px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "8px", marginBottom: "20px" }}>
            {sortedAndFilteredOrders.map((ord) => {
              const isSelected = selectedOrders.some((o) => o.id === ord.id);
              return (
                <div
                  key={ord.id}
                  onClick={() => toggleOrderSelection(ord)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                    borderRadius: "8px",
                    marginBottom: "6px",
                    cursor: "pointer",
                    border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border-color)"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ color: "var(--primary)", fontFamily: "monospace" }}>{ord.id}</strong>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>{ord.outlet}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Required: {ord.required_date} | {ord.weightKg} kg | {ord.volM3} m³ | {ord.temp === "reefer" ? "❄️ Reefer Required" : "Ambient"}
                    </div>
                  </div>
                  <input type="checkbox" checked={isSelected} onChange={() => {}} style={{ cursor: "pointer" }} />
                </div>
              );
            })}
            {sortedAndFilteredOrders.length === 0 && (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                No pending dispatch orders match your criteria for {selectedBrand}.
              </div>
            )}
          </div>

          {/* Dispatch details, vehicle and driver */}
          <form onSubmit={handleCreateMultipointDispatch} className="dp-form">
            <h3 className="dp-step"><FileText size={16} /> 2. Dispatch details</h3>
            <div className="dp-grid">
              <label className="dp-field">
                <span>Dispatch type (order type)</span>
                <select value={dispatchType} onChange={(e) => { setDispatchType(e.target.value); setPartyId(""); }}>
                  {DISPATCH_TYPES.map((t) => <option key={t.value} value={t.value}>{t.value}</option>)}
                </select>
                <small>{typeInfo?.hint}</small>
              </label>

              <label className="dp-field">
                <span>{dispatchType === "Agent order" ? "Agent" : dispatchType === "Customer order" ? "Customer" : "Customer / agent"}</span>
                {dispatchType === "Store replenishment" || dispatchType === "Inter-depot transfer" ? (
                  <input value={customerLabel || "Select orders to fill in the stores"} readOnly className="dp-readonly" />
                ) : (
                  <select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                    <option value="">Choose {dispatchType === "Agent order" ? "an agent" : "a customer"}</option>
                    {partyOptions.map((p) => (
                      <option key={p.party_id} value={p.party_id}>{p.name} ({p.city})</option>
                    ))}
                    <option value="OTHER">Other (type the name)</option>
                  </select>
                )}
                {dispatchType === "Store replenishment" && <small>Filled from the orders you select</small>}
              </label>

              {partyId === "OTHER" && (
                <label className="dp-field span2">
                  <span>{dispatchType === "Agent order" ? "Agent" : "Customer"} name</span>
                  <input value={otherCustomer} onChange={(e) => setOtherCustomer(e.target.value)} placeholder="Business name" />
                </label>
              )}

              <label className="dp-field">
                <span>Invoice number</span>
                <div className="dp-inline">
                  <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                  <button type="button" className="dp-mini" onClick={() => setInvoiceNo(nextInvoiceNo())} title="Generate a new invoice number">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </label>

              <div className="dp-field">
                <span>Dispatch date and time</span>
                <div className="dp-inline">
                  <input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} aria-label="Dispatch date" />
                  <input type="time" value={dispatchTime} onChange={(e) => setDispatchTime(e.target.value)} aria-label="Dispatch time" />
                </div>
              </div>
            </div>

            <h3 className="dp-step"><Truck size={16} /> 3. Vehicle and driver</h3>
            <div className="dp-grid">
              <label className="dp-field">
                <span>Vehicle temperature</span>
                <select value={tempRequiredFilter} onChange={(e) => setTempRequiredFilter(e.target.value)}>
                  <option value="all">All vehicles</option>
                  <option value="reefer">Reefer only</option>
                  <option value="ambient">Ambient only</option>
                </select>
              </label>
              <label className="dp-field">
                <span>Vehicle</span>
                <select value={selectedVehicleId} onChange={(e) => selectVehicle(e.target.value)}>
                  <option value="">Select a vehicle</option>
                  {filteredVehicles.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.inWorkshop}>
                      {v.id} {v.registrationNo && v.registrationNo !== "—" ? `(${v.registrationNo})` : ""}, {v.type === "van" ? "Van" : "Lorry"} {v.temp}, {v.weightCapKg} kg, {v.depot}
                      {v.inWorkshop ? ", in workshop" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="dp-field span2">
                <span>Driver</span>
                <select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}>
                  <option value="">Select a driver</option>
                  {driversSorted.map((d) => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.driver_name} ({d.driver_id}), {d.depot}
                      {d.default_vehicle_id ? `, usually drives ${d.default_vehicle_id}` : ", relief driver"}
                    </option>
                  ))}
                </select>
                <small>Choosing a vehicle selects its regular driver. You can change it.{routeDepot ? ` Showing ${routeDepot} vehicles for these orders.` : ""}</small>
              </label>
            </div>

            {(activeVehicle || activeDriver) && (
              <div className="dp-cards">
                {activeVehicle && (
                  <div className="dp-card">
                    <h4><Truck size={15} /> Vehicle details</h4>
                    <dl>
                      <div><dt>Vehicle</dt><dd>{activeVehicle.id}</dd></div>
                      <div><dt>Number plate</dt><dd>{activeVehicle.registrationNo}</dd></div>
                      <div><dt>Type</dt><dd>{activeVehicle.type === "van" ? "Van" : "Lorry / truck"}, {activeVehicle.temp === "reefer" ? "reefer" : "ambient"}</dd></div>
                      <div><dt>Model</dt><dd>{activeVehicle.makeModel}</dd></div>
                      <div><dt>Capacity</dt><dd>{activeVehicle.weightCapKg.toLocaleString()} kg, {activeVehicle.volumeCapM3} m³</dd></div>
                      <div><dt>Depot</dt><dd>{activeVehicle.depot}</dd></div>
                      <div><dt>Condition</dt><dd className={activeVehicle.condition === "Needs attention" ? "bad" : activeVehicle.condition === "Fair" ? "fair" : ""}>{activeVehicle.condition} ({activeVehicle.healthScore}/100)</dd></div>
                      <div><dt>Load used</dt><dd className={isOverweight ? "bad" : ""}>{activeVehicle.weightCapKg ? Math.round((totalWeight / activeVehicle.weightCapKg) * 100) : 0}% weight, {activeVehicle.volumeCapM3 ? Math.round((totalVolume / activeVehicle.volumeCapM3) * 100) : 0}% volume</dd></div>
                    </dl>
                  </div>
                )}
                {activeDriver && (
                  <div className="dp-card">
                    <h4><UserRound size={15} /> Driver details</h4>
                    <dl>
                      <div><dt>Name</dt><dd>{activeDriver.driver_name}</dd></div>
                      <div><dt>Driver ID</dt><dd>{activeDriver.driver_id}</dd></div>
                      <div><dt>Phone</dt><dd>{activeDriver.phone}</dd></div>
                      <div><dt>Licence</dt><dd>{activeDriver.licence_no} ({activeDriver.licence_class})</dd></div>
                      <div><dt>Licence expiry</dt><dd>{fmtDate(activeDriver.licence_expiry)}</dd></div>
                      <div><dt>Experience</dt><dd>{activeDriver.experience_years} years</dd></div>
                    </dl>
                  </div>
                )}
              </div>
            )}

            {activeVehicle && (isOverweight || isOvervolume || isTempMismatch || depotMismatch) && (
              <div className="dp-warnings">
                {depotMismatch && <p><AlertTriangle size={14} /> {activeVehicle.id} is based at {activeVehicle.depot}; these orders ship from {orderDepot}.</p>}
                {isOverweight && <p><AlertTriangle size={14} /> Route weight ({totalWeight.toLocaleString()} kg) is over {activeVehicle.id}'s capacity ({activeVehicle.weightCapKg.toLocaleString()} kg).</p>}
                {isOvervolume && <p><AlertTriangle size={14} /> Route volume ({totalVolume.toFixed(1)} m³) is over {activeVehicle.id}'s capacity ({activeVehicle.volumeCapM3} m³).</p>}
                {isTempMismatch && <p><AlertTriangle size={14} /> Chilled orders need a reefer vehicle. {activeVehicle.id} is ambient.</p>}
              </div>
            )}

            <button
              type="submit"
              className="dp-submit"
              disabled={problems.length > 0 || isOverweight || isOvervolume || isTempMismatch}
              title={problems.join(" ")}
            >
              Review dispatch note ({selectedOrders.length} {selectedOrders.length === 1 ? "drop" : "drops"})
            </button>
            {problems.length > 0 && <p className="dp-hint">{problems[0]}</p>}
          </form>
        </div>

        {/* Selected Route Stops Sequence */}
        <div className="panel">
          <div className="panel-title" style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700 }}>Multipoint Route Sequence</h2>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Multi-drop itinerary sequence for vehicle</p>
          </div>

          {/* Route Metrics Header */}
          {selectedOrders.length > 0 && (
            <div style={{ background: "var(--primary-light)", padding: "12px", borderRadius: "10px", marginBottom: "16px", border: "1px solid #c7d2fe" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "var(--primary)", marginBottom: "4px" }}>
                Route Load Totals ({selectedOrders.length} Drops):
              </div>
              <div style={{ display: "flex", gap: "16px", fontSize: "13px", fontWeight: 600 }}>
                <span>Weight: <strong>{totalWeight} kg</strong></span>
                <span>Volume: <strong>{totalVolume.toFixed(2)} m³</strong></span>
                <span>Temp: <strong>{hasReeferItem ? "❄️ Reefer Required" : "Ambient"}</strong></span>
              </div>
            </div>
          )}

          {selectedOrders.length === 0 ? (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "60px 0", fontSize: "13px" }}>
              Select pending orders from the queue on the left to assemble a multipoint drop route.
            </div>
          ) : (
            <div>
              {selectedOrders.map((ord, idx) => (
                <div key={ord.id} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "12px" }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{ord.outlet}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Order: <span style={{ fontFamily: "monospace" }}>{ord.id}</span> | {ord.weightKg} kg | {ord.volM3} m³
                    </div>
                  </div>
                  <button type="button" className="icon-btn" onClick={() => toggleOrderSelection(ord)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                    <Trash2 size={16} color="#dc2626" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="dp-summary">
            <h3><FileText size={15} /> Dispatch summary</h3>
            <dl>
              <div><dt>Dispatch type</dt><dd>{dispatchType}</dd></div>
              <div><dt>{typeInfo?.party === "Agent" ? "Agent" : "Customer / agent"}</dt><dd>{customerLabel || <em>Not set</em>}</dd></div>
              <div><dt>Invoice no</dt><dd>{invoiceNo || <em>Not set</em>}</dd></div>
              <div><dt>Dispatch date</dt><dd>{dispatchDate ? `${fmtDate(dispatchDate)} ${dispatchTime}` : <em>Not set</em>}</dd></div>
              <div><dt>Main warehouse</dt><dd>{orderDepot} Depot</dd></div>
              <div><dt>Vehicle</dt><dd>{activeVehicle ? `${activeVehicle.id}, ${activeVehicle.registrationNo}` : <em>Not assigned</em>}</dd></div>
              <div><dt>Driver</dt><dd>{activeDriver ? `${activeDriver.driver_name}, ${activeDriver.phone}` : <em>Not assigned</em>}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      {reviewOpen && (
        <DispatchNote
          note={confirmed || buildNote()}
          confirmed={!!confirmed}
          onCancel={() => setReviewOpen(false)}
          onConfirm={confirmDispatch}
          onTrack={() => navigate(`/fleet/tracking?trip=${confirmed?.tripId}`)}
          onReport={() => navigate("/reports")}
          onNew={startNewDispatch}
        />
      )}
    </div>
  );
}