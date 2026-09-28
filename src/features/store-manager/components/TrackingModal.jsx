import React from "react";
import { Clock3, MapPin, Navigation, Phone, Truck, User, X } from "lucide-react";

export default function TrackingModal({ delivery, open, onClose }) {
  if (!open) return null;

  return (
    <div className="store-modal-backdrop">
      <div className="store-modal store-track-modal" role="dialog" aria-modal="true">
        <div className="store-modal-head">
          <div>
            <span className="store-kicker">LIVE DELIVERY</span>
            <h2>Driver & Route Tracking</h2>
            <p>{delivery.id} • {delivery.vehicle} • {delivery.trip}</p>
          </div>
          <button onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="store-map-sim">
          <div className="store-map-road" />
          <span className="store-map-pin depot"><MapPin size={18} /></span>
          <span className="store-map-pin vehicle"><Truck size={18} /></span>
          <span className="store-map-pin outlet"><Navigation size={18} /></span>
          <div className="store-map-caption">Peliyagoda depot → delivery route → outlet</div>
        </div>

        <div className="store-track-grid">
          <span><Clock3 size={16} /><div><small>Estimated arrival</small><b>{delivery.eta}</b></div></span>
          <span><Truck size={16} /><div><small>Vehicle</small><b>{delivery.vehicle}</b></div></span>
          <span><User size={16} /><div><small>Driver</small><b>N. Perera</b></div></span>
          <span><Phone size={16} /><div><small>Contact</small><b>Available after dispatch</b></div></span>
        </div>

        <div className="store-modal-actions">
          <button className="store-secondary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
