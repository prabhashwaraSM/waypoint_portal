import React, { useMemo, useState } from "react";
import { Boxes, ClipboardList, History, LayoutDashboard, PackageCheck, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PortalChrome from "../../../shared/components/PortalChrome";
import { getSession, logout } from "../../../shared/auth/auth";
import { getStoreProfile } from "../data/storeManagerData";
import DashboardPage from "./DashboardPage";
import PlaceOrderPage from "./PlaceOrderPage";
import ReceiveDeliveryPage from "./ReceiveDeliveryPage";
import FreshWastagePage from "./FreshWastagePage";
import StyleAdjustmentsPage from "./StyleAdjustmentsPage";
import TechAdjustmentsPage from "./TechAdjustmentsPage";
import StoreUtilityModal from "../components/StoreUtilityModal";
import "../styles/storeManager.css";
import "../../../shared/styles/portalLayout.css";

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
  const [utilityModal, setUtilityModal] = useState(null);

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const renderPage = () => {
    if (section === "place-order") return <PlaceOrderPage profile={profile} />;
    if (section === "receive") return <ReceiveDeliveryPage profile={profile} />;
    if (section === "wastage") return <FreshWastagePage profile={profile} />;
    if (section === "adjustments" && profile.key === "style") {
      return <StyleAdjustmentsPage profile={profile} onNavigate={setSection} />;
    }
    if (section === "adjustments" && profile.key === "tech") {
      return <TechAdjustmentsPage profile={profile} onNavigate={setSection} />;
    }
    return <DashboardPage profile={profile} onNavigate={setSection} />;
  };

  const nav = navItems.map(({ id, label, icon: Icon }) => (
    <button
      key={id}
      className={"portal-nav-item " + (section === id ? "active" : "")}
      onClick={() => setSection(id)}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  ));

  return (
    <>
      <PortalChrome
        theme="store-theme"
        product="Store"
        accent="#16a34a"
        session={session}
        role="Store Manager"
        nav={nav}
        notificationCount={2}
        onNotifications={() => setUtilityModal("notifications")}
        onLogout={signOut}
        contentClassName="store-content"
      >
        {renderPage()}
      </PortalChrome>

      <StoreUtilityModal
        type={utilityModal}
        open={Boolean(utilityModal)}
        onClose={() => setUtilityModal(null)}
        profile={profile}
        session={session}
      />
    </>
  );
}
