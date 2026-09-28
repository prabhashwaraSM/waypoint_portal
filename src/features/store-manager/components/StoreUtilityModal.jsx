import React from "react";
import { Bell, CheckCircle2, Clock3, Store, UserCircle, X } from "lucide-react";

export default function StoreUtilityModal({ type, open, onClose, profile, session }) {
  if (!open) return null;

  const isProfile = type === "profile";

  return (
    <div className="store-modal-backdrop">
      <div className="store-modal store-utility-modal" role="dialog" aria-modal="true">
        <div className="store-modal-head">
          <div>
            <span className="store-kicker">{isProfile ? "ACCOUNT" : "NOTIFICATIONS"}</span>
            <h2>{isProfile ? "Store Manager Profile" : "Operational Notifications"}</h2>
            <p>{profile.brand} • {profile.outlet}</p>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {isProfile ? (
          <div className="store-profile-modal-body">
            <span className="store-profile-modal-avatar"><UserCircle size={34} /></span>
            <div className="store-profile-modal-grid">
              <span><small>Name</small><b>{session.name || profile.manager}</b></span>
              <span><small>Role</small><b>Store Manager</b></span>
              <span><small>Brand</small><b>{profile.brand}</b></span>
              <span><small>Outlet</small><b>{profile.outlet} • {profile.outletId}</b></span>
              <span><small>Service pattern</small><b>{profile.service}</b></span>
              <span><small>Account</small><b>{session.username}</b></span>
            </div>
          </div>
        ) : (
          <div className="store-notification-list">
            <article><span className="store-notification-icon green"><CheckCircle2 size={17} /></span><div><b>Delivery plan synced</b><small>{profile.upcomingDelivery.id} is using plan {profile.upcomingDelivery.planVersion}.</small></div></article>
            <article><span className="store-notification-icon amber"><Clock3 size={17} /></span><div><b>ETA available</b><small>Current expected arrival is {profile.upcomingDelivery.eta}.</small></div></article>
            <article><span className="store-notification-icon green"><Store size={17} /></span><div><b>Store action reminder</b><small>Confirm quantities and report damage before completing receipt.</small></div></article>
          </div>
        )}

        <div className="store-modal-actions">
          <button className="store-primary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
