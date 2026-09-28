import React, { useMemo, useState } from "react";
import { Bell, Boxes, CheckCircle2, ClipboardList, History, LayoutDashboard, LogOut, Menu, PackageCheck, ShoppingCart, Store, UserCircle, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../../../shared/components/Logo";
import { getSession, logout } from "../../../shared/auth/auth";
import { getStoreProfile } from "../data/storeManagerData";
import DashboardPage from "./DashboardPage";
import PlaceOrderPage from "./PlaceOrderPage";
import ReceiveDeliveryPage from "./ReceiveDeliveryPage";
import FreshWastagePage from "./FreshWastagePage";
import StyleAdjustmentsPage from "./StyleAdjustmentsPage";
import TechAdjustmentsPage from "./TechAdjustmentsPage";
import "../styles/storeManager.css";

function navForStore(profile) {
  const receiveLabel = profile.key === "style" ? "Receive Order" : "Receive Delivery";
  const finalItem = profile.key === "fresh"
    ? { id: "wastage", label: "Daily Wastage", icon: History }
    : profile.key === "style"
      ? { id: "adjustments", label: "Adjustments", icon: ClipboardList }
      : { id: "adjustments", label: "RMAs & Adjustments", icon: Boxes };

  return [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "place-order", label: "Place Order", icon: ShoppingCart },
    { id: "receive", label: receiveLabel, icon: PackageCheck },
    finalItem
  ];
}

export default function StoreManagerPage() {
  const navigate = useNavigate();
  const session = getSession() || { role: "Store Manager", storeType: "fresh", name: "Store Manager" };
  const profile = useMemo(() => getStoreProfile(session.storeType), [session.storeType]);
  const navItems = useMemo(() => navForStore(profile), [profile]);
  const [section, setSection] = useState("dashboard");

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const renderPage = () => {
    if (section === "place-order") return <PlaceOrderPage profile={profile} />;
    if (section === "receive") return <ReceiveDeliveryPage profile={profile} />;
    if (section === "wastage") return <FreshWastagePage profile={profile} />;
    if (section === "adjustments" && profile.key === "style") return <StyleAdjustmentsPage profile={profile} onNavigate={setSection} />;
    if (section === "adjustments" && profile.key === "tech") return <TechAdjustmentsPage profile={profile} onNavigate={setSection} />;
    return <DashboardPage profile={profile} onNavigate={setSection} />;
  };

  return (
    <div className="store-shell">
      <aside className="store-sidebar">
        <div className="store-brand">
          <Logo size={38} product="Store" subtitle="Outlet Operations" accent="#16a34a" />
          <div className="store-role-pill"><Store size={13} /> Role: <b>Store Manager</b></div>
        </div>

        <div className="store-outlet-card">
          <span className="store-outlet-icon"><Store size={18} /></span>
          <div><b>{profile.brand}</b><small>{profile.outlet} • {profile.outletId}</small></div>
        </div>

        <nav className="store-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="store-sidebar-state">
          <span><Wifi size={13} /> Outlet system online</span>
          <small>Plan & ETA sync active</small>
        </div>

        <div className="store-user">
          <div className="store-avatar">SM</div>
          <div><strong>{session.name || profile.manager}</strong><small>{profile.brand} • {profile.outlet}</small></div>
          <button onClick={signOut} title="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>

      <div className="store-main-area">
        <header className="store-topbar">
          <div className="store-topbar-title">
            <strong>Waypoint Group PVT LTD</strong>
            <span>{profile.brand} • {profile.outlet} store operations</span>
          </div>
          <div className="store-topbar-meta">
            <div className="store-sync"><Wifi size={15} /><span><b>Live</b><small>Synced</small></span></div>
            <button className="store-icon-btn" title="Notifications"><Bell size={18} /><i>2</i></button>
            <div className="store-profile"><UserCircle size={23} /><span><b>{session.name || profile.manager}</b><small>{profile.label}</small></span></div>
            <button className="store-icon-btn store-mobile-logout" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={18} /></button>
          </div>
        </header>

        <main className="store-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
