import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

const SYNC_KEY_PREFIX = "waypoint_store_sync_";

function storageKey(profile) {
  return SYNC_KEY_PREFIX + (profile?.key || "store") + "_" + (profile?.outletId || "outlet");
}

function readSnapshot(key) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function formatSyncTime(timestamp, now) {
  if (!timestamp) return "Not synced yet";

  const diff = Math.max(0, now - timestamp);

  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diff / 60_000));
    return minutes + " min ago";
  }

  return new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function StoreConnectionStatus({ profile, section }) {
  const key = useMemo(() => storageKey(profile), [profile]);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [lastSyncedAt, setLastSyncedAt] = useState(
    () => readSnapshot(key)?.lastSyncedAt || null
  );
  const [now, setNow] = useState(Date.now());

  const saveOnlineSnapshot = useCallback(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.onLine) {
      return;
    }

    const timestamp = Date.now();
    const snapshot = {
      lastSyncedAt: timestamp,
      section,
      profileKey: profile?.key,
      brand: profile?.brand,
      outlet: profile?.outlet,
      outletId: profile?.outletId
    };

    try {
      window.localStorage.setItem(key, JSON.stringify(snapshot));
    } catch {
      // Keep the UI working even when browser storage is unavailable.
    }

    setLastSyncedAt(timestamp);
    setNow(timestamp);

    window.dispatchEvent(
      new CustomEvent("waypoint-store-sync", {
        detail: snapshot
      })
    );
  }, [key, profile, section]);

  useEffect(() => {
    const cached = readSnapshot(key);
    setLastSyncedAt(cached?.lastSyncedAt || null);

    const handleOnline = () => {
      setIsOnline(true);
      saveOnlineSnapshot();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setNow(Date.now());
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      saveOnlineSnapshot();
    } else {
      setIsOnline(false);
    }

    const clock = window.setInterval(() => setNow(Date.now()), 30_000);
    const autoSync = window.setInterval(() => {
      if (navigator.onLine) saveOnlineSnapshot();
    }, 60_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.clearInterval(clock);
      window.clearInterval(autoSync);
    };
  }, [key, saveOnlineSnapshot]);

  const syncLabel = formatSyncTime(lastSyncedAt, now);

  return (
    <button
      type="button"
      className={"store-connection-status " + (isOnline ? "online" : "offline")}
      onClick={saveOnlineSnapshot}
      title={
        isOnline
          ? "Store system is online. Click to refresh the local sync snapshot."
          : "Store system is offline. The last online snapshot is preserved on this device."
      }
      aria-label={isOnline ? "Store system online" : "Store system offline"}
    >
      <span className="store-connection-icon" aria-hidden="true">
        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
      </span>

      <span className="store-connection-copy">
        <strong>{isOnline ? "Store system online" : "Store system offline"}</strong>
        <small>
          {isOnline ? "Last sync: " : "Last online sync: "}
          {syncLabel}
        </small>
      </span>
    </button>
  );
}
