import React from "react";

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="loader-page-header">
      <div>
        <span className="loader-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="loader-page-actions">{actions}</div>}
    </div>
  );
}
