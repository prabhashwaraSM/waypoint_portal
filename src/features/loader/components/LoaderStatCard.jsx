import React from "react";

export default function LoaderStatCard({ icon: Icon, tone, value, label, meta }) {
  return (
    <article className="loader-stat-card">
      <span className={"loader-stat-icon " + tone}><Icon size={21} /></span>
      <div><strong>{value}</strong><b>{label}</b><small>{meta}</small></div>
    </article>
  );
}
