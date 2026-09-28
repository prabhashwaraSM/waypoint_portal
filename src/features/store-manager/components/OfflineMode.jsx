import React, { useEffect, useState } from "react";

const QUEUE_KEY = "waypoint_offline_orders";
const SYNC_KEY = "waypoint_last_sync";

export default function OfflineMode() {
    const [isOnline, setIsOnline] = useState(
        navigator.onLine
    );

    const [showModal, setShowModal] = useState(false);

    const [lastSync, setLastSync] = useState(
        localStorage.getItem(SYNC_KEY)
    );

    const [pendingOrders, setPendingOrders] = useState(
        getPendingOrders()
    );

    useEffect(() => {
        const handleOffline = () => {
            setIsOnline(false);
            setShowModal(true);
        };

        const handleOnline = () => {
            setIsOnline(true);

            const orders = getPendingOrders();

            if (orders.length > 0) {
                /*
                 * Later you can replace this section
                 * with your real backend API.
                 */

                setTimeout(() => {
                    localStorage.setItem(
                        QUEUE_KEY,
                        JSON.stringify([])
                    );

                    const now = new Date().toISOString();

                    localStorage.setItem(
                        SYNC_KEY,
                        now
                    );

                    setPendingOrders([]);
                    setLastSync(now);
                }, 1000);
            } else {
                const now = new Date().toISOString();

                localStorage.setItem(
                    SYNC_KEY,
                    now
                );

                setLastSync(now);
            }
        };

        window.addEventListener(
            "offline",
            handleOffline
        );

        window.addEventListener(
            "online",
            handleOnline
        );

        return () => {
            window.removeEventListener(
                "offline",
                handleOffline
            );

            window.removeEventListener(
                "online",
                handleOnline
            );
        };
    }, []);

    function getSyncTime() {
        if (!lastSync) {
            return "Not synchronized yet";
        }

        return new Date(lastSync).toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit",
            }
        );
    }

    return (
        <>
            {/* ==========================================
          ONLINE / OFFLINE BUTTON
      ========================================== */}

            <button
                className={`offline-status-button ${isOnline ? "online" : "offline"
                    }`}
                onClick={() => setShowModal(true)}
            >
                <span className="offline-status-dot" />

                <span>
                    {isOnline ? "Online" : "Offline"}
                </span>

                {!isOnline && (
                    <span className="offline-wifi-icon">
                        ⚠
                    </span>
                )}

                {pendingOrders.length > 0 && (
                    <small>
                        {pendingOrders.length}
                    </small>
                )}
            </button>

            {/* ==========================================
          OFFLINE MODAL
      ========================================== */}

            {showModal && (
                <div
                    className="offline-modal-overlay"
                    onClick={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setShowModal(false);
                        }
                    }}
                >
                    <div className="offline-modal">

                        <button
                            className="offline-modal-close"
                            onClick={() =>
                                setShowModal(false)
                            }
                        >
                            ×
                        </button>

                        <div className="offline-warning-icon">
                            ⚠
                        </div>

                        <span className="offline-label">
                            CONNECTION STATUS
                        </span>

                        <h2>
                            {isOnline
                                ? "🟢 ONLINE"
                                : "⚠ OFFLINE"}
                        </h2>

                        {!isOnline && (
                            <>
                                <p className="offline-description">
                                    Some information may be
                                    outdated.
                                </p>

                                <div className="offline-sync-box">

                                    <span>
                                        Last synchronized
                                    </span>

                                    <strong>
                                        {getSyncTime()}
                                    </strong>

                                </div>

                                <div className="offline-features">

                                    <p>
                                        You can still:
                                    </p>

                                    <div>
                                        ✓ View cached orders
                                    </div>

                                    <div>
                                        ✓ Edit order
                                    </div>

                                    <div>
                                        ✓ Save changes
                                    </div>

                                </div>

                                {pendingOrders.length > 0 && (
                                    <div className="offline-pending">
                                        {pendingOrders.length} order
                                        {pendingOrders.length > 1
                                            ? "s"
                                            : ""}{" "}
                                        waiting to sync
                                    </div>
                                )}

                                <p className="offline-sync-message">
                                    Changes will sync automatically
                                    when connection returns.
                                </p>
                            </>
                        )}

                        {isOnline && (
                            <p className="online-description">
                                Your store is connected and
                                synchronized.
                            </p>
                        )}

                        <button
                            className="offline-continue-button"
                            onClick={() =>
                                setShowModal(false)
                            }
                        >
                            Continue
                        </button>

                    </div>
                </div>
            )}
        </>
    );
}

function getPendingOrders() {
    try {
        return JSON.parse(
            localStorage.getItem(QUEUE_KEY) ||
            "[]"
        );
    } catch {
        return [];
    }
}