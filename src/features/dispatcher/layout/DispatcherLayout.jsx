import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Navigation,
  Package,
  Siren,
  Store,
  Truck,
  Warehouse
} from "lucide-react";
import PortalChrome from "../../../shared/components/PortalChrome";
import { getSession, logout } from "../../../shared/auth/auth";
import { getDriverIssues, subscribeDriverIssues } from "../data/driverIssueStore";
import "../styles/dispatcher.css";
import "../../../shared/styles/portalLayout.css";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/stores", label: "Stores", icon: Store },
  { to: "/orders", label: "Order Allocations & Approvals", icon: CheckSquare },
  {
    to: "/inventory",
    label: "Inventory",
    icon: Package,
    children: [
      { to: "/inventory/store", label: "Stock by Store", icon: Store },
      { to: "/inventory/warehouse", label: "Warehouse Stock Window", icon: Warehouse }
    ]
  },
  {
    to: "/dispatch",
    label: "Dispatch",
    icon: Truck,
    children: [
      { to: "/dispatch/plan", label: "Dispatch Planning", icon: Truck },
      { to: "/dispatch/shortages", label: "Shortages & Delays", icon: CalendarClock }
    ]
  },
  {
    to: "/fleet",
    label: "Fleet & Tracking",
    icon: MapPinned,
    children: [
      { to: "/fleet/vehicles", label: "Vehicle Information", icon: ClipboardList },
      { to: "/fleet/tracking", label: "Vehicle Tracking", icon: Navigation },
      { to: "/fleet/driver-notifications", label: "Driver Notifications", icon: Siren, badge: "driverIssues" }
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
  const [newDriverIssues, setNewDriverIssues] = useState(
    () => getDriverIssues().filter((issue) => issue.status === "new").length
  );

  useEffect(() => {
    return subscribeDriverIssues(() => {
      setNewDriverIssues(getDriverIssues().filter((issue) => issue.status === "new").length);
    });
  }, []);

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

  const badges = { driverIssues: newDriverIssues };

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
          {children.map(({ to: childTo, label: childLabel, icon: ChildIcon, badge }) => (
            <NavLink
              key={childTo}
              to={childTo}
              className={({ isActive }) => "portal-nav-subitem " + (isActive ? "active" : "")}
            >
              <ChildIcon size={15} />
              <span>{childLabel}</span>
              {badge && badges[badge] > 0 && <b className="portal-nav-badge">{badges[badge]}</b>}
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
      notificationCount={newDriverIssues}
      onNotifications={() => navigate("/fleet/driver-notifications")}
      onLogout={handleLogout}
      contentClassName="page-content"
    >
      <Outlet context={{ brand, setBrand, warehouse, setWarehouse }} />
    </PortalChrome>
  );
}
