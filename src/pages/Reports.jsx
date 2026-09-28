import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download, Printer, Search, X, RefreshCw, Warehouse, Store, Truck, UserRound, FileText, Package, ChevronLeft, ChevronRight, Navigation
} from "lucide-react";
import { loadOrderReport, STATUS_LABELS, DISPATCH_TYPES } from "../data/dispatchStore";
import { fmtDate } from "../data/fleetStore";
import Logo from "../components/Logo";
import { getSession } from "../auth/auth";
import "./reports.css";

const PAGE_SIZE = 50;

const STATUS_TONE = {
  delivered: "good", dispatched: "info", in_transit: "info", loading: "shop",
  pending_load: "wait", pending_planning: "wait", approved: "wait", pending_approval: "wait",
  deferred: "warn", cancelled: "bad"
};

const COLUMNS = [
  ["orderRef", "Order ref"], ["orderDate", "Order date"], ["requiredDate", "Required date"], ["status", "Status"],
  ["brand", "Brand"], ["category", "Category"], ["temp", "Temperature"], ["units", "Units"], ["weightKg", "Weight (kg)"],
  ["volumeM3", "Volume (m3)"], ["warehouse", "Main warehouse"], ["storeId", "Store ID"], ["storeName", "Store"],
  ["district", "District"], ["dockType", "Dock type"], ["window", "Delivery window"], ["dispatchType", "Dispatch type"],
  ["customerAgent", "Customer / agent"], ["invoiceNo", "Invoice no"], ["dispatchNo", "Dispatch no"],
  ["dispatchDate", "Dispatch date"], ["dispatchTime", "Dispatch time"], ["tripId", "Trip"], ["vehicleId", "Vehicle"],
  ["vehicleReg", "Number plate"], ["vehicleType", "Vehicle type"], ["driverName", "Driver"], ["driverPhone", "Driver phone"],
  ["deliveredDate", "Delivered date"]
];

export default function Reports() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [brand, setBrand] = useState("ALL");
  const [warehouse, setWarehouse] = useState("ALL");
  const [district, setDistrict] = useState("ALL");
  const [dispatchType, setDispatchType] = useState("ALL");
  const [assigned, setAssigned] = useState("ALL");
  const [dateField, setDateField] = useState("orderDate");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState({ key: "orderDate", dir: "desc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [printAll, setPrintAll] = useState(false);

  useEffect(() => {
    loadOrderReport().then(setRows).catch(() => setRows([]));
  }, []);

  useEffect(() => setPage(1), [search, status, brand, warehouse, district, dispatchType, assigned, dateField, from, to]);

  useEffect(() => {
    if (!printAll) return undefined;
    const t = setTimeout(() => {
      window.print();
      setPrintAll(false);
    }, 150);
    return () => clearTimeout(t);
  }, [printAll]);

  const districts = useMemo(() => [...new Set((rows || []).map((r) => r.district))].sort(), [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (status !== "ALL" && r.status !== status) return false;
      if (brand !== "ALL" && r.brand !== brand) return false;
      if (warehouse !== "ALL" && r.warehouse !== warehouse) return false;
      if (district !== "ALL" && r.district !== district) return false;
      if (dispatchType !== "ALL" && r.dispatchType !== dispatchType) return false;
      if (assigned === "YES" && !r.vehicleId) return false;
      if (assigned === "NO" && r.vehicleId) return false;
      const d = r[dateField];
      if ((from || to) && !d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      if (q) {
        const hay = [r.orderRef, r.storeId, r.storeName, r.invoiceNo, r.dispatchNo, r.vehicleId, r.vehicleReg, r.driverName, r.customerAgent, r.category]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const { key, dir } = sort;
    return list.sort((a, b) => {
      const x = a[key] ?? "";
      const y = b[key] ?? "";
      if (x < y) return dir === "asc" ? -1 : 1;
      if (x > y) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, search, status, brand, warehouse, district, dispatchType, assigned, dateField, from, to, sort]);

  const kpi = useMemo(() => {
    const dispatched = filtered.filter((r) => r.vehicleId);
    const delivered = filtered.filter((r) => r.status === "delivered");
    const onTime = delivered.filter((r) => r.deliveredDate && r.deliveredDate <= r.requiredDate).length;
    return {
      orders: filtered.length,
      dispatched: dispatched.length,
      delivered: delivered.length,
      onTimePct: delivered.length ? Math.round((onTime / delivered.length) * 100) : null,
      weight: filtered.reduce((s, r) => s + r.weightKg, 0),
      vehicles: new Set(dispatched.map((r) => r.vehicleId)).size,
      drivers: new Set(dispatched.map((r) => r.driverName)).size,
      pending: filtered.filter((r) => !r.vehicleId && !["cancelled", "deferred"].includes(r.status)).length
    };
  }, [filtered]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const shownRows = printAll ? filtered : pageRows;

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const exportCsv = () => {
    const esc = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [COLUMNS.map(([, l]) => esc(l)).join(",")];
    filtered.forEach((r) => lines.push(COLUMNS.map(([k]) => esc(k === "status" ? STATUS_LABELS[r[k]] || r[k] : r[k])).join(",")));
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-dispatch-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    document.body.classList.remove("print-order");
    setPrintAll(true);
  };
  const printOrder = () => {
    document.body.classList.add("print-order");
    window.print();
    setTimeout(() => document.body.classList.remove("print-order"), 500);
  };

  const clearFilters = () => {
    setSearch(""); setStatus("ALL"); setBrand("ALL"); setWarehouse("ALL"); setDistrict("ALL");
    setDispatchType("ALL"); setAssigned("ALL"); setFrom(""); setTo("");
  };

  const session = getSession();
  const filterSummary = [
    status !== "ALL" && STATUS_LABELS[status], brand !== "ALL" && brand, warehouse !== "ALL" && `${warehouse} warehouse`,
    district !== "ALL" && district, dispatchType !== "ALL" && dispatchType,
    (from || to) && `${COLUMNS.find(([k]) => k === dateField)?.[1]} ${from || "any"} to ${to || "any"}`
  ].filter(Boolean);

  if (!rows) {
    return <div className="rp-loading"><RefreshCw size={22} className="rp-spin" /> Building the order report…</div>;
  }

  return (
    <div className="rp-page">
      {/* printed header */}
      <div className="rp-print-head">
        <Logo size={34} light={false} subtitle="Waypoint Group PVT LTD" />
        <div>
          <b>Order dispatch report</b>
          <span>Generated {new Date().toLocaleString("en-GB")} by {session?.name} ({session?.role})</span>
          <span>{filterSummary.length ? `Filters: ${filterSummary.join(", ")}` : "All orders"}. {filtered.length} orders.</span>
        </div>
      </div>

      <div className="rp-heading no-print">
        <div>
          <h1>Order Dispatch Report</h1>
          <p>Every order with its main warehouse, store, assigned vehicle, driver and dispatch details.</p>
        </div>
        <div className="rp-actions">
          <button className="rp-btn" onClick={printReport}><Printer size={16} /> Print report</button>
          <button className="rp-btn primary" onClick={exportCsv}><Download size={16} /> Export CSV ({filtered.length})</button>
        </div>
      </div>

      <section className="rp-kpis">
        <Kpi label="Orders" value={kpi.orders.toLocaleString()} />
        <Kpi label="Dispatched with vehicle" value={kpi.dispatched.toLocaleString()} />
        <Kpi label="Delivered" value={kpi.delivered.toLocaleString()} sub={kpi.onTimePct !== null ? `${kpi.onTimePct}% by required date` : ""} />
        <Kpi label="Awaiting dispatch" value={kpi.pending.toLocaleString()} />
        <Kpi label="Total weight" value={`${Math.round(kpi.weight).toLocaleString()} kg`} />
        <Kpi label="Vehicles / drivers used" value={`${kpi.vehicles} / ${kpi.drivers}`} />
      </section>

      <section className="rp-card no-print">
        <div className="rp-filters">
          <label className="rp-search">
            <Search size={15} />
            <input placeholder="Order, store, invoice, vehicle, driver" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="ALL">All statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} aria-label="Brand">
            <option value="ALL">All brands</option>
            {["Waypoint Fresh", "Waypoint Style", "Waypoint Tech"].map((b) => <option key={b}>{b}</option>)}
          </select>
          <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} aria-label="Main warehouse">
            <option value="ALL">All warehouses</option>
            <option value="Peliyagoda">Peliyagoda</option>
            <option value="Kandy">Kandy</option>
          </select>
          <select value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="District">
            <option value="ALL">All districts</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={dispatchType} onChange={(e) => setDispatchType(e.target.value)} aria-label="Dispatch type">
            <option value="ALL">All dispatch types</option>
            {DISPATCH_TYPES.map((t) => <option key={t.value}>{t.value}</option>)}
          </select>
          <select value={assigned} onChange={(e) => setAssigned(e.target.value)} aria-label="Vehicle assignment">
            <option value="ALL">Assigned and unassigned</option>
            <option value="YES">Vehicle assigned</option>
            <option value="NO">No vehicle yet</option>
          </select>
        </div>
        <div className="rp-filters">
          <select value={dateField} onChange={(e) => setDateField(e.target.value)} aria-label="Date to filter on">
            <option value="orderDate">Order date</option>
            <option value="requiredDate">Required date</option>
            <option value="dispatchDate">Dispatch date</option>
            <option value="deliveredDate">Delivered date</option>
          </select>
          <label className="rp-date">From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="rp-date">To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <button className="rp-btn ghost" onClick={clearFilters}>Clear filters</button>
          <span className="rp-count">{filtered.length.toLocaleString()} of {rows.length.toLocaleString()} orders</span>
        </div>
      </section>

      <section className="rp-card rp-table-card">
        {filtered.length === 0 ? (
          <div className="rp-empty">No orders match these filters. Clear a filter to see more orders.</div>
        ) : (
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <Th k="orderRef" sort={sort} onSort={toggleSort}>Order</Th>
                  <Th k="orderDate" sort={sort} onSort={toggleSort}>Order date</Th>
                  <Th k="warehouse" sort={sort} onSort={toggleSort}>Main warehouse</Th>
                  <Th k="storeId" sort={sort} onSort={toggleSort}>Store</Th>
                  <Th k="customerAgent" sort={sort} onSort={toggleSort}>Customer / agent</Th>
                  <Th k="dispatchType" sort={sort} onSort={toggleSort}>Dispatch type</Th>
                  <Th k="invoiceNo" sort={sort} onSort={toggleSort}>Invoice</Th>
                  <Th k="dispatchDate" sort={sort} onSort={toggleSort}>Dispatch date</Th>
                  <Th k="vehicleId" sort={sort} onSort={toggleSort}>Vehicle</Th>
                  <Th k="driverName" sort={sort} onSort={toggleSort}>Driver</Th>
                  <Th k="category" sort={sort} onSort={toggleSort}>Goods</Th>
                  <Th k="weightKg" sort={sort} onSort={toggleSort} num>Load</Th>
                  <Th k="status" sort={sort} onSort={toggleSort}>Status</Th>
                </tr>
              </thead>
              <tbody>
                {shownRows.map((r) => (
                  <tr key={r.orderRef} onClick={() => setSelected(r)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSelected(r)}>
                    <td><strong>{r.orderRef}</strong><small>{r.brand}</small></td>
                    <td>{fmtDate(r.orderDate)}<small>Need by {fmtDate(r.requiredDate)}</small></td>
                    <td>{r.warehouse}</td>
                    <td>{r.storeId}<small>{r.district}, {r.dockType?.replace("_", " ")}</small></td>
                    <td className="rp-wrap">{r.customerAgent || <Dash />}</td>
                    <td>{r.dispatchType || <Dash />}</td>
                    <td>{r.invoiceNo || <Dash />}</td>
                    <td>{r.dispatchDate ? <>{fmtDate(r.dispatchDate)}<small>{r.dispatchTime}</small></> : <Dash />}</td>
                    <td>{r.vehicleId ? <>{r.vehicleId}<small>{r.vehicleReg}</small></> : <Dash />}</td>
                    <td>{r.driverName ? <>{r.driverName}<small>{r.driverPhone}</small></> : <Dash />}</td>
                    <td>{r.category}<small>{r.units} units, {r.temp}</small></td>
                    <td className="num">{r.weightKg.toLocaleString()} kg<small>{r.volumeM3} m³</small></td>
                    <td><span className={`rp-badge ${STATUS_TONE[r.status] || ""}`}>{STATUS_LABELS[r.status] || r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="rp-pager no-print">
            <button className="rp-btn" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
            <span>Page {page} of {pages}</span>
            <button className="rp-btn" disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
          </div>
        )}
      </section>

      {selected && (
        <OrderDetail
          r={selected}
          onClose={() => setSelected(null)}
          onPrint={printOrder}
          onTrack={selected.tripId && selected.source === "app" ? () => navigate(`/fleet/tracking?trip=${selected.tripId}`) : null}
        />
      )}
    </div>
  );
}

function Kpi({ label, value, sub }) {
  return (
    <div className="rp-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

function Th({ k, sort, onSort, children, num }) {
  const active = sort.key === k;
  return (
    <th className={num ? "num" : ""} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button onClick={() => onSort(k)}>
        {children} {active && <span aria-hidden="true">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  );
}

const Dash = () => <span className="rp-dash">Not dispatched</span>;

function Section({ icon: Icon, title, items }) {
  return (
    <section className="rp-sec">
      <h3><Icon size={16} /> {title}</h3>
      <dl>
        {items.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v || "—"}</dd></div>
        ))}
      </dl>
    </section>
  );
}

function OrderDetail({ r, onClose, onPrint, onTrack }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="rp-overlay" onClick={onClose}>
      <aside className="rp-drawer" onClick={(e) => e.stopPropagation()} aria-label={`Order ${r.orderRef}`}>
        <div className="rp-print-head order-only">
          <Logo size={30} light={false} subtitle="Waypoint Group PVT LTD" />
          <div><b>Order report</b><span>Printed {new Date().toLocaleString("en-GB")}</span></div>
        </div>
        <header className="rp-drawer-head">
          <div>
            <span className={`rp-badge ${STATUS_TONE[r.status] || ""}`}>{STATUS_LABELS[r.status] || r.status}</span>
            <h2>{r.orderRef}</h2>
            <p>{r.brand}, {r.category}</p>
          </div>
          <div className="rp-drawer-actions no-print">
            <button className="rp-btn" onClick={onPrint}><Printer size={15} /> Print order</button>
            <button className="rp-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        </header>

        <Section icon={Package} title="Order" items={[
          ["Order date", fmtDate(r.orderDate)], ["Required date", fmtDate(r.requiredDate)],
          ["Goods category", r.category], ["Temperature", r.temp === "chilled" ? "Chilled (reefer)" : "Ambient"],
          ["Units", r.units.toLocaleString()], ["Weight", `${r.weightKg.toLocaleString()} kg`],
          ["Volume", `${r.volumeM3} m³`], ["Delivered", r.deliveredDate ? fmtDate(r.deliveredDate) : ""]
        ]} />
        <Section icon={Warehouse} title="Main warehouse" items={[["Warehouse", `${r.warehouse} Depot`], ["Brand", r.brand]]} />
        <Section icon={Store} title="Store" items={[
          ["Store", r.storeId], ["District", r.district], ["Dock type", r.dockType?.replace("_", " ")],
          ["Parking", r.parking?.replace("_", " ")], ["Delivery window", r.window]
        ]} />
        <Section icon={FileText} title="Dispatch" items={[
          ["Dispatch type", r.dispatchType], ["Customer / agent", r.customerAgent], ["Invoice no", r.invoiceNo],
          ["Dispatch no", r.dispatchNo], ["Dispatch date", r.dispatchDate ? `${fmtDate(r.dispatchDate)} ${r.dispatchTime}` : ""],
          ["Trip", r.tripId], ["Dispatched by", r.dispatchedBy]
        ]} />
        <Section icon={Truck} title="Assigned vehicle" items={[
          ["Vehicle", r.vehicleId], ["Number plate", r.vehicleReg], ["Type", r.vehicleType], ["Make & model", r.vehicleModel]
        ]} />
        <Section icon={UserRound} title="Driver" items={[
          ["Name", r.driverName], ["Driver ID", r.driverId], ["Phone", r.driverPhone], ["Licence no", r.driverLicence]
        ]} />

        {onTrack && (
          <button className="rp-btn primary block no-print" onClick={onTrack}><Navigation size={15} /> Track this trip</button>
        )}
      </aside>
    </div>
  );
}
