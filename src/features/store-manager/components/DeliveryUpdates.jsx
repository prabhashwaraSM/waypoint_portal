import React, { useEffect, useState } from "react";
import { CalendarClock, Clock3 } from "lucide-react";
import { getNotifications, markRead, subscribeNotifications } from "../../dispatcher/data/notificationStore";

const TYPES = ["rescheduled", "delay", "deferred", "eta"];

function load(outletId) {
  return getNotifications({ role: "store_manager", outletId }).filter((item) => TYPES.includes(item.type));
}

export default function DeliveryUpdates({ outletId }) {
  const [items, setItems] = useState(() => load(outletId));

  useEffect(() => subscribeNotifications(() => setItems(load(outletId))), [outletId]);

  if (!items.length) return null;

  return (
    <section className="store-panel store-delivery-updates">
      <div className="store-panel-head">
        <div><h2>Delivery updates from dispatch</h2></div>
        <Clock3 size={18} />
      </div>
      <div className="store-update-list">
        {items.slice(0, 6).map((item) => {
          const Icon = item.type === "rescheduled" || item.type === "deferred" ? CalendarClock : Clock3;
          return (
            <button
              key={item.id}
              className={"store-update-card " + (item.read ? "" : "unread")}
              onClick={() => !item.read && markRead(item.id)}
            >
              <span className="store-update-icon"><Icon size={16} /></span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{new Date(item.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</small>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
