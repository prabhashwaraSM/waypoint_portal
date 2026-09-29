import React from "react";
import StoreHeader from "./StoreHeader";

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="store-page-header">
      <div>
        <span className="store-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="store-page-actions">{actions}</div>}
    </div>
  );
}
