
/*if there is any things should be changed , use portalchormcopy , staoremanagerpagecopy files it contain orginal content and , in store manager 
component file contain , oflinemode.jsx and it's style is available in style folder as offline mode.css ,  i had add the offline mode to the header but uba eka dala thibbe 
side bar ekata there is nor side bar components to find hutto components dapan mn hoyagnne kohomada , aye wens krnna onenam sidebar ekeyi, eke style eka thiyan thana kiyapn 
mn danne na ne yako*/

import React, { useEffect, useMemo, useState } from "react";
import { Bell, LogOut } from "lucide-react";
import Logo from "./Logo";
import "../styles/portalLayout.css";
import StoreHeader from "./StoreHeader";

function initials(name) {
  return String(name || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function PortalChrome({
  theme,
  product,
  accent,
  session,
  role,
  nav,
  notificationCount = 0,
  onNotifications,
  onLogout,
  contentClassName = "",
  children
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const displayName = session?.name || role || "Waypoint User";
  const displayRole = role || session?.role || "User";

  const date = useMemo(
    () => now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    [now]
  );
  const time = useMemo(
    () => now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    [now]
  );

  return (
    <div className={"portal-shell portal-clean " + theme} style={{ "--portal-accent": accent }}>
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <Logo size={42} product={product} subtitle={null} accent={accent} />
        </div>

        <nav className="portal-nav">{nav}</nav>

        <div className="portal-sidebar-footer">
          <div className="portal-user-card">
            <div className="portal-user-avatar">{initials(displayName)}</div>
            <div className="portal-user-copy">
              <strong>{displayName}</strong>
              <small>{displayRole}</small>
            </div>
            <button className="portal-logout" onClick={onLogout} title="Sign out" aria-label="Sign out">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar">
          <strong className="portal-company">Waypoint Group PVT LTD</strong>

          <div className="portal-topbar-actions">
            <div className="portal-clock">
              <strong>{time}</strong>
              <span>{date}</span>
            </div>

            <div className="portal-live">
              <i />
              <span>Live Link</span>
            </div>

            <button
              className="portal-icon-btn"
              onClick={onNotifications}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={19} />
              {notificationCount > 0 && <b>{notificationCount}</b>}
            </button>

            <button
              className="portal-icon-btn portal-mobile-logout"
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <main className={"portal-content " + contentClassName}>
          {children}
        </main>
      </div>
    </div>
  );
}