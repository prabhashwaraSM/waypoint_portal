import React, { useState, useEffect } from "react";

export default function OfflineMode({ storeName = "Colombo" }) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [drafts, setDrafts] = useState([]);
    const [orderInput, setOrderInput] = useState("");
    const [receivedHistory, setReceivedHistory] = useState([]);

    // Store-specific configurations for offline mode
    const storeConfig = {
        Colombo: {
            eta: "Estimated Arrival: 45 Mins (Central Hub Route A)",
            localHistory: ["Batch #CL-901: Fresh Produce (Received)", "Batch #CL-892: Dairy Stock (Stored Offline)"],
            notice: "Colombo Primary Hub: Local offline database active. Caching regional distribution drafts."
        },
        Dehiwala: {
            eta: "Estimated Arrival: 60 Mins (Coastal Line Route B)",
            localHistory: ["Batch #DH-412: Cold Chain Goods (Received)", "Batch #DH-401: Bakery Restock (Stored Offline)"],
            notice: "Dehiwala Outlet: Coastal transit tracking simulated. Local drafts secured."
        },
        Rajagiriya: {
            eta: "Estimated Arrival: 30 Mins (Metro Expressway Route C)",
            localHistory: ["Batch #RJ-773: Express Grocery (Received)", "Batch #RJ-760: Organic Stock (Stored Offline)"],
            notice: "Rajagiriya Urban Store: High-priority queue active. Offline storage synchronized."
        }
    };

    const currentConfig = storeConfig[storeName] || storeConfig["Colombo"];

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Load saved drafts from localStorage specific to this store
        const savedDrafts = localStorage.getItem(`store_offline_drafts_${storeName}`);
        if (savedDrafts) {
            try {
                setDrafts(JSON.parse(savedDrafts));
            } catch (e) {
                console.error("Failed to parse drafts", e);
            }
        }

        const savedHistory = localStorage.getItem(`store_offline_history_${storeName}`);
        if (savedHistory) {
            try {
                setReceivedHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        } else {
            setReceivedHistory(currentConfig.localHistory);
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [storeName]);

    const handleSaveDraft = (e) => {
        e.preventDefault();
        if (!orderInput.trim()) return;
        const newDrafts = [...drafts, { id: Date.now(), item: orderInput, time: new Date().toLocaleTimeString() }];
        setDrafts(newDrafts);
        localStorage.setItem(`store_offline_drafts_${storeName}`, JSON.stringify(newDrafts));
        setOrderInput("");
    };

    const handleClearDrafts = () => {
        setDrafts([]);
        localStorage.removeItem(`store_offline_drafts_${storeName}`);
    };

    return (
        <div className="store-panel store-alert-panel">
            <div className="store-panel-head">
                <div>
                    <h2>Offline Control Center — {storeName} Outlet</h2>
                    <p>{currentConfig.notice}</p>
                </div>
                <span className={`store-status ${isOnline ? "completed" : "deferred"}`}>
                    {isOnline ? "System Online" : "System Offline Mode"}
                </span>
            </div>

            {!isOnline && (
                <div className="store-warning-banner" style={{ margin: "14px" }}>
                    <div>
                        <b>Network Disconnected: You are viewing offline mode for {storeName}.</b>
                        <span>Changes and draft orders are safely stored locally on this device and will sync automatically upon reconnection.</span>
                    </div>
                </div>
            )}

            <div className="store-form-grid" style={{ padding: "14px" }}>
                {/* Draft Orders Section */}
                <div className="store-panel" style={{ padding: "14px", border: "1px solid var(--store-border)" }}>
                    <h3>Place & Save Order Drafts</h3>
                    <p style={{ color: "var(--store-muted)", fontSize: "9px", margin: "4px 0 12px" }}>
                        Create and store orders locally while disconnected.
                    </p>
                    <form onSubmit={handleSaveDraft} className="store-field">
                        <span>Order Item & Details</span>
                        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                            <input
                                type="text"
                                placeholder="Enter item description or SKU..."
                                value={orderInput}
                                onChange={(e) => setOrderInput(e.target.value)}
                            />
                            <button type="submit" className="store-primary-btn">Save Draft</button>
                        </div>
                    </form>

                    <div style={{ marginTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <b style={{ fontSize: "10px" }}>Saved Local Drafts ({drafts.length})</b>
                            {drafts.length > 0 && (
                                <button onClick={handleClearDrafts} className="store-secondary-btn" style={{ fontSize: "8px", padding: "4px 8px" }}>
                                    Clear All
                                </button>
                            )}
                        </div>
                        {drafts.length === 0 ? (
                            <small className="store-empty-inline">No offline drafts stored for {storeName}.</small>
                        ) : (
                            <div style={{ display: "grid", gap: "6px" }}>
                                {drafts.map((d) => (
                                    <div key={d.id} style={{ background: "#f8fafc", padding: "8px", borderRadius: "8px", display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
                                        <span>{d.item}</span>
                                        <small style={{ color: "var(--store-muted)" }}>{d.time}</small>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Received History & Delivery ETA Section */}
                <div className="store-panel" style={{ padding: "14px", border: "1px solid var(--store-border)" }}>
                    <h3>Received History & Delivery ETA</h3>
                    <p style={{ color: "var(--store-muted)", fontSize: "9px", margin: "4px 0 12px" }}>
                        {currentConfig.eta}
                    </p>

                    <div className="store-cutoff-card" style={{ marginBottom: "12px" }}>
                        <div>
                            <b>Active Route Target</b>
                            <span>{currentConfig.eta}</span>
                        </div>
                    </div>

                    <b style={{ fontSize: "10px", display: "block", marginBottom: "6px" }}>Received History Log</b>
                    <div className="store-history-list">
                        {receivedHistory.map((hist, index) => (
                            <div key={index} style={{ padding: "6px 0", borderBottom: "1px solid #edf2f7", fontSize: "9px" }}>
                                <span>{hist}</span>
                                <span className="store-status completed" style={{ fontSize: "7px" }}>Cached Log</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}