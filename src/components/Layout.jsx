import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { getSession, logout } from "../auth/auth";
import { 
  Bell, 
  UserCircle, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  CheckSquare, 
  Truck, 
  BarChart3, 
  MapPinned, 
  Store,
  Compass,
  ClipboardList,
  Navigation,
  LogOut,
  ShieldCheck
} from "lucide-react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/stores", label: "Stores", icon: Store },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/approval", label: "Order Allocations & Approvals", icon: CheckSquare },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/dispatch", label: "Dispatch", icon: Truck },
  {
    to: "/fleet",
    label: "Fleet & Tracking",
    icon: MapPinned,
    children: [
      { to: "/fleet/vehicles", label: "Vehicle Information", icon: ClipboardList },
      { to: "/fleet/tracking", label: "Vehicle Tracking", icon: Navigation }
    ]
  },
  { to: "/reports", label: "Reports", icon: BarChart3 }
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession() || { name: "Dispatcher", role: "Dispatcher" };
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  const [brand, setBrand] = useState("Waypoint Fresh");
  const [warehouse, setWarehouse] = useState("Peliyagoda");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    window.dispatcherContext = { brand, warehouse };
    window.dispatcherBrand = brand;
    window.dispatcherWarehouse = warehouse;
    window.dispatcherContextChanged?.({ brand, warehouse });
  }, [brand, warehouse]);

  const date = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo size={38} subtitle="Dispatch Control" />
          <div className="role-pill">
            <ShieldCheck size={13} /> Role: <b>{session.role}</b>
          </div>
        </div>

        <nav className="nav">
          {navItems.map(({ to, label, icon: Icon, children }) => (
            <React.Fragment key={to}>
              <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
              {children && location.pathname.startsWith(to) && (
                <div className="nav-children">
                  {children.map(({ to: cTo, label: cLabel, icon: CIcon }) => (
                    <NavLink key={cTo} to={cTo} className={({ isActive }) => `nav-sublink ${isActive ? "active" : ""}`}>
                      <CIcon size={15} />
                      <span>{cLabel}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span className="online-dot" /> System Operational
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="header-brand-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span 
              style={{
                fontSize: "17px",
                fontWeight: 800,
                letterSpacing: "-0.2px",
                background: "linear-gradient(135deg, #0f172a 0%, #4f46e5 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Waypoint Group PVT LTD
            </span>
          </div>

          <div className="top-meta">
            <div className="clock">
              <strong>{time}</strong>
              <span>{date}</span>
            </div>
            <div className="network">
              <span className="online-dot" /> Live Link
            </div>
            <button className="icon-btn" title="Notifications">
              <Bell size={18} />
              <i>3</i>
            </button>
            <div className="profile-btn" title={`Signed in as ${session.username || session.name}`}>
              <UserCircle size={22} color="#4f46e5" />
              <span className="profile-text">
                <b>{session.name}</b>
                <small>{session.role}</small>
              </span>
            </div>
            <button className="icon-btn" title="Sign out" aria-label="Sign out" onClick={handleLogout}>
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="page-content" data-route={location.pathname}>
          <Outlet context={{ brand, setBrand, warehouse, setWarehouse }} />
        </main>
      </div>
    </div>
  );
}