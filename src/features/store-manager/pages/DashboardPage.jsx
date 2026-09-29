import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Clock3,
  MapPin,
  PackageOpen,
  ShoppingCart,
  Truck
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import StoreStatCard from "../components/StoreStatCard";
import TrackingModal from "../components/TrackingModal";
import DeliveryUpdates from "../components/DeliveryUpdates";
import { recentOrders } from "../data/storeManagerData";


function statusClass(status) {
  return String(status).toLowerCase().replaceAll(" ", "-");
}

export default function DashboardPage({ profile, onNavigate }) {
  const [trackingOpen, setTrackingOpen] = useState(false);
  const orders = useMemo(() => recentOrders[profile.key] || [], [profile.key]);
  const delivery = profile.upcomingDelivery;

  return (
    <>
      <PageHeader
        eyebrow={profile.brand.toUpperCase() + " • " + profile.outletId}
        title={profile.label + " Operations"}
        description={"Monitor orders, delivery ETA, deferrals, receipt status and stock exceptions for " + profile.outlet + "."}
        actions={
          <button className="store-primary-btn" onClick={() => onNavigate("place-order")}>
            <ShoppingCart size={16} /> Place new order
          </button>
        }
      />

      <section className="store-stat-grid">
        <StoreStatCard icon={Truck} value={profile.dashboard.deliveryToday} label="Deliveries today" meta={profile.service} tone="green" />
        <StoreStatCard icon={Clock3} value={profile.dashboard.pending} label="Orders pending" meta="Awaiting plan / dispatch" tone="blue" />
        <StoreStatCard icon={PackageOpen} value={profile.dashboard.deferred} label="Deferred orders" meta="Reason and next action visible" tone="amber" />
        <StoreStatCard icon={AlertTriangle} value={profile.dashboard.stockAlert} label="Stock alerts" meta="Needs store action" tone="red" />
      </section>

      <DeliveryUpdates outletId={profile.outletId} />

      <section className="store-dashboard-grid">
        <div className="store-panel">
          <div className="store-panel-head">
            <div><h2>Today's delivery</h2><p>Live operational status from the delivery plan.</p></div>
            <b className={"store-status " + statusClass(delivery.status)}>{delivery.status}</b>
          </div>

          <div className="store-delivery-card">
            <div className="store-delivery-route">
              <span className="store-big-icon"><Truck size={22} /></span>
              <div>
                <span className="store-kicker">{delivery.id}</span>
                <h3>{delivery.vehicle} • {delivery.trip}</h3>
                <p>Plan {delivery.planVersion} • ETA {delivery.eta}</p>
              </div>
            </div>

            <div className="store-delivery-meta">
              <span><small>Outlet</small><b>{profile.outlet}</b></span>
              <span><small>Service</small><b>{profile.service}</b></span>
              <span><small>Items</small><b>{delivery.items.length} lines</b></span>
            </div>

            <div className="store-delivery-actions">
              <button className="store-secondary-btn" onClick={() => setTrackingOpen(true)}><MapPin size={15} /> Track delivery</button>
              <button className="store-primary-btn" onClick={() => onNavigate("receive")}><CheckCircle2 size={15} /> Receive delivery</button>
            </div>
          </div>
        </div>

        <div className="store-panel">
          <div className="store-panel-head"><div><h2>Recent order status</h2><p>Submitted, deferred and completed requests.</p></div></div>
          <div className="store-order-list">
            {orders.map((order) => (
              <div className="store-order-row" key={order.id}>
                <span className="store-order-icon"><Boxes size={16} /></span>
                <div><strong>{order.id}</strong><small>{order.detail}</small></div>
                <b className={"store-status " + statusClass(order.status)}>{order.status}</b>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="store-panel store-alert-panel">
        <div className="store-panel-head"><div><h2>Stock & service attention</h2><p>Store-side actions that can affect the next order.</p></div></div>
        <div className="store-alert-grid">
          {profile.products.filter((p) => p.available <= 12).slice(0, 3).map((product) => (
            <article key={product.id}>
              <AlertTriangle size={17} />
              <div><b>{product.name}</b><small>{product.available} {product.unit} on hand</small></div>
              <button onClick={() => onNavigate("place-order")}>Order</button>
            </article>
          ))}
        </div>
      </section>

      <TrackingModal delivery={delivery} open={trackingOpen} onClose={() => setTrackingOpen(false)} />
    </>
  );
}
