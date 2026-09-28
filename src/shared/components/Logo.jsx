import React from "react";

// Waypoint mark: a delivery route running from a depot dot to a drop pin.
export function LogoMark({ size = 40, accent = "#6366f1" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="Waypoint logo">
      <defs>
        <linearGradient id="wpd-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#wpd-bg)" />
      <path d="M12 36 C 12 26, 22 30, 24 23 S 30 16, 32 17" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 6.2" />
      <circle cx="12" cy="36" r="4" fill="#fff" />
      <circle cx="12" cy="36" r="1.6" fill="#0f172a" />
      <path d="M33 7.5a7.5 7.5 0 0 0-7.5 7.5c0 5.4 7.5 12.5 7.5 12.5s7.5-7.1 7.5-12.5A7.5 7.5 0 0 0 33 7.5z" fill="#fff" />
      <circle cx="33" cy="15" r="2.8" fill="#0f172a" />
    </svg>
  );
}

export default function Logo({
  size = 40,
  light = true,
  subtitle = "Dispatch Control",
  product = "Dispatcher",
  accent
}) {
  return (
    <div className={`logo ${light ? "logo-light" : "logo-dark"}`}>
      <LogoMark size={size} accent={accent} />
      <div className="logo-text">
        <strong>Waypoint <span>{product}</span></strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  );
}
