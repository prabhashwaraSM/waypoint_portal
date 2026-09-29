import React, { useState, useEffect } from "react";
import OfflineMode from "./OfflineMode"; // Import your OfflineMode component

export default function StoreHeader({ storeName = "Colombo", subtitle = "Store Operations & Inventory Hub" }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [currentTime, setCurrentTime] = useState("");
    const [showOfflineModal, setShowOfflineModal] = useState(false); // Optional: toggle state for offline control panel

    useEffect(() => {
        // Update live clock
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);

        // Network status listeners
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            clearInterval(timer);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <>
            <header className="store-topbar">
                <div className="store-topbar-title">
                    <strong>Waypoint Fresh • {storeName} Outlet</strong>
                    <span>{subtitle}</span>
                </div>

                <div className="store-topbar-meta">
                    {/* Offline / Online Sync Indicator with click toggle */}
                    <div
                        className="store-sync"
                        onClick={() => setShowOfflineModal(!showOfflineModal)}
                        style={{ cursor: "pointer", padding: "4px 8px", borderRadius: "8px", background: isOnline ? "transparent" : "#fee2e2" }}
                        title="Click to open offline drafts & history"
                    >
                        <div
                            style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                background: isOnline ? "#22c55e" : "#ef4444",
                                boxShadow: isOnline ? "0 0 8px rgba(34,197,94,0.6)" : "0 0 8px rgba(239,68,68,0.6)"
                            }}
                        />
                        <div>
                            <b>{isOnline ? "Live Sync Active" : "Offline Draft Mode"}</b>
                            <small>{currentTime} — {storeName}</small>
                        </div>
                    </div>

                    {/* User Profile / Outlet Badge */}
                    <div className="store-profile">
                        <div className="store-avatar" style={{ width: "28px", height: "28px", fontSize: "9px" }}>
                            {storeName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <b>Manager ({storeName})</b>
                            <small>Active Session</small>
                        </div>
                    </div>
                </div>
            </header>

            {/* Optional dropdown/modal view when offline status or indicator is clicked */}
            {(!isOnline || showOfflineModal) && (
                <div style={{ padding: "16px 30px 0", background: "var(--store-bg)" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                        {showOfflineModal && (
                            <button
                                onClick={() => setShowOfflineModal(false)}
                                className="store-secondary-btn"
                                style={{ fontSize: "8px", padding: "4px 8px" }}
                            >
                                Close Offline Panel ✕
                            </button>
                        )}
                    </div>
                    <OfflineMode storeName={storeName} />
                </div>
            )}
        </>
    );
}