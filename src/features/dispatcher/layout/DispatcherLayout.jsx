import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Navigation,
  Package,
  ShoppingCart,
  Store,
  Truck
} from "lucide-react";
import PortalChrome from "../../../shared/components/PortalChrome";
import { getSession, logout } from "../../../shared/auth/auth";
import "../styles/dispatcher.css";
import "../../../shared/styles/portalLayout.css";

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

export default function DispatcherLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession() || { name: "Dispatch Officer", role: "Dispatcher" };
  const [brand, setBrand] = useState("Waypoint Fresh");
  const [warehouse, setWarehouse] = useState("Peliyagoda");

  useEffect(() => {
    window.dispatcherContext = { brand, warehouse };
    window.dispatcherBrand = brand;
    window.dispatcherWarehouse = warehouse;
    window.dispatcherContextChanged?.({ brand, warehouse });
  }, [brand, warehouse]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const nav = navItems.map(({ to, label, icon: Icon, children }) => (
    <React.Fragment key={to}>
      <NavLink
        to={to}
        className={({ isActive }) => "portal-nav-item " + (isActive ? "active" : "")}
      >
        <Icon size={20} />
        <span>{label}</span>
      </NavLink>

      {children && location.pathname.startsWith(to) && (
        <div className="portal-nav-children">
          {children.map(({ to: childTo, label: childLabel, icon: ChildIcon }) => (
            <NavLink
              key={childTo}
              to={childTo}
              className={({ isActive }) => "portal-nav-subitem " + (isActive ? "active" : "")}
            >
              <ChildIcon size={15} />
              <span>{childLabel}</span>
            </NavLink>
          ))}
        </div>
      )}
    </React.Fragment>
  ));

  return (
    <PortalChrome
      theme="dispatcher-theme"
      product="Dispatcher"
      accent="#4f46e5"
      session={session}
      role="Dispatcher"
      nav={nav}
      notificationCount={3}
      onLogout={handleLogout}
      contentClassName="page-content"
    >
      <Outlet context={{ brand, setBrand, warehouse, setWarehouse }} />
    </PortalChrome>
  );
}
