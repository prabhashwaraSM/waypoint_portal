import React from "react";

export default function StoreStatCard({ icon: Icon, value, label, meta, tone = "green" }) {
  return (
    <article className="store-stat-card">
      <span className={"store-stat-icon " + tone}><Icon size={20} /></span>
      <div>
        <strong>{value}</strong>
        <b>{label}</b>
        <small>{meta}</small>
      </div>
    </article>
  );
}
