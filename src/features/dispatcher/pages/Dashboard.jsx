import React from "react";
import { Navigation, MapPin, ShoppingBag, Truck, Clock, ArrowUpRight, AlertTriangle, WifiOff } from "lucide-react";

export default function Dashboard() {
  // Synchronized with authentic order records from waypoint_1500_orders_all_120_stores.csv
  const recentOrders = [
    { id: "ORD-00005", outlet: "OUT001 (Colombo)", brand: "Waypoint Fresh", items: "148 Units", status: "In-Transit", date: "2026-09-19" },
    { id: "ORD-00003", outlet: "OUT001 (Colombo)", brand: "Waypoint Fresh", items: "125 Units", status: "Packed", date: "2026-10-01" },
    { id: "ORD-00001", outlet: "OUT001 (Colombo)", brand: "Waypoint Fresh", items: "134 Units", status: "Pending", date: "2026-09-28" },
    { id: "ORD-00313", outlet: "OUT015 (Colombo)", brand: "Waypoint Style", items: "92 Units", status: "In-Transit", date: "2026-09-25" },
    { id: "ORD-00620", outlet: "OUT021 (Colombo)", brand: "Waypoint Tech", items: "48 Units", status: "Packed", date: "2026-09-27" }
  ];

  return (
    <div className="dashboard-page">
      <div className="page-heading">
        <div>
          <h1>Control Dashboard</h1>
        </div>
      </div>

      {/* Operations Overview Cards (Counts from 1,500 Orders dataset) */}
      <div className="panel" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-main)" }}>
            Pending Operations
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <div className="pending-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "14px", color: "var(--text-main)" }}>Waypoint Fresh</strong>
              <span className="brand-chip brand-a">Fresh</span>
            </div>
            <div className="pending-values">
              <div>
                <span>Pending Dispatch</span>
                <strong>292</strong>
              </div>
              <div>
                <span>Pending Approval</span>
                <strong>66</strong>
              </div>
            </div>
          </div>

          <div className="pending-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "14px", color: "var(--text-main)" }}>Waypoint Style</strong>
              <span className="brand-chip brand-b">Style</span>
            </div>
            <div className="pending-values">
              <div>
                <span>Pending Dispatch</span>
                <strong>94</strong>
              </div>
              <div>
                <span>Pending Approval</span>
                <strong>22</strong>
              </div>
            </div>
          </div>

          <div className="pending-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "14px", color: "var(--text-main)" }}>Waypoint Tech</strong>
              <span className="brand-chip brand-c">Tech</span>
            </div>
            <div className="pending-values">
              <div>
                <span>Pending Dispatch</span>
                <strong>62</strong>
              </div>
              <div>
                <span>Pending Approval</span>
                <strong>17</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map & Active Shipments Grid */}
      <div className="dashboard-grid-layout" style={{ marginBottom: "24px" }}>
        {/* Live GPS Map */}
        <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Navigation size={18} color="var(--primary)" /> Live Fleet Network Telemetry
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--primary)", fontWeight: 600 }}>
              <span>Map Direct View</span>
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="map-card-wrap" style={{ flex: 1, minHeight: "400px" }}>
            <iframe
              title="Dashboard Live GPS Network"
              src="https://maps.google.com/maps?q=6.9632,79.8856&z=11&output=embed"
              loading="lazy"
            />
          </div>
        </div>

        {/* Active Shipments and Alerts */}
        <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
            <Truck size={18} color="var(--primary)" /> Active Shipments and Alerts
          </h2>
          
          <div className="shipment-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ padding: "14px", borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-main)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>VEH001 (Reefer Truck)</strong>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Kasun Perera • Peliyagoda Depot</div>
                </div>
                <span className="status shipped">In Transit</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={12} color="var(--primary)" /> Destination: <strong>Colombo</strong>
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "12px", border: "1px solid var(--border-color)", background: "var(--bg-main)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>VEH008 (Ambient Truck)</strong>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Nimal Silva • Peliyagoda Depot</div>
                </div>
                <span className="status shipped">In Transit</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={12} color="var(--primary)" /> Destination: <strong>Gampaha</strong>
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "12px", border: "1px solid #fde68a", background: "#fffbeb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>VEH015 (Ambient Truck)</strong>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Amal Fernando • Peliyagoda Depot</div>
                </div>
                <span className="status pending" style={{ background: "#fef3c7", color: "#b45309" }}>
                  Driver Issue
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#b45309", display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertTriangle size={12} color="#b45309" /> <strong>Driver reported engine pressure warning</strong>
              </div>
            </div>

            <div style={{ padding: "14px", borderRadius: "12px", border: "1px solid #fecaca", background: "#fff5f5" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>VEH039 (Reefer Truck)</strong>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Saman Kumara • Kandy Depot</div>
                </div>
                <span className="status delayed">Connection Lost</span>
              </div>
              <div style={{ fontSize: "11px", color: "#b91c1c", display: "flex", alignItems: "center", gap: "4px" }}>
                <WifiOff size={12} color="#ef4444" /> <strong>Telemetry GPS signal lost for 18 mins</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="panel">
        <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <ShoppingBag size={18} color="var(--primary)" /> Recent Orders & Dispatch Logs
        </h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Store Outlet</th>
                <th>Brand Context</th>
                <th>Volume / Units</th>
                <th>Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((ord) => (
                <tr key={ord.id}>
                  <td><strong style={{ color: "var(--primary)" }}>{ord.id}</strong></td>
                  <td style={{ fontWeight: 600 }}>{ord.outlet}</td>
                  <td>
                    <span className={`brand-chip ${ord.brand === "Waypoint Fresh" ? "brand-a" : ord.brand === "Waypoint Style" ? "brand-b" : "brand-c"}`}>
                      {ord.brand}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{ord.items}</td>
                  <td>
                    <span className={`status ${ord.status === "Packed" ? "packed" : ord.status === "In-Transit" ? "shipped" : "pending"}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} />
                    {ord.date}
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