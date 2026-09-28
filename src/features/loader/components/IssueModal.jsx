import React from "react";
import { AlertTriangle, Boxes, Snowflake, ThermometerSnowflake, X } from "lucide-react";

function tempIcon(temp) {
  if (temp === "Frozen") return <Snowflake size={14} />;
  if (temp === "Chilled") return <ThermometerSnowflake size={14} />;
  return <Boxes size={14} />;
}

export default function IssueModal({ item, trip, reason, setReason, availableQty, setAvailableQty, note, setNote, onClose, onSubmit }) {
  const shortfall = Math.max(0, item.qty - Number(availableQty || 0));

  return (
    <div className="loader-modal-backdrop" role="presentation">
      <div className="loader-modal" role="dialog" aria-modal="true" aria-label="Report loading issue">
        <div className="loader-modal-head">
          <div><span className="loader-kicker">DEGRADATION FLOW</span><h2>Report Missing or Damaged Item</h2><p>Record the shortfall before vehicle departure. The dispatcher will see this issue.</p></div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="loader-modal-item">
          <span className={"loader-temp-icon " + item.temp.toLowerCase()}>{tempIcon(item.temp)}</span>
          <div><b>{item.sku}</b><strong>{item.name}</strong><small>{item.outlet} • Delivery stop {item.stopSequence}</small></div>
          <span><small>Vehicle</small><b>{trip.vehicleId}</b><small>{trip.routeCode} • Trip {trip.tripNo}</small></span>
        </div>

        <div className="loader-qty-grid">
          <div><span>Expected quantity</span><b>{item.qty}</b><small>{item.unit}</small></div>
          <label><span>Available quantity</span><input type="number" min="0" max={item.qty} value={availableQty} onChange={function (e) { setAvailableQty(e.target.value); }} placeholder="0" /><small>{item.unit}</small></label>
          <div className="shortfall"><span>Shortfall</span><b>{shortfall}</b><small>{item.unit}</small></div>
        </div>

        <fieldset className="loader-reason-group">
          <legend>Reason for issue</legend>
          {["Missing in warehouse", "Damaged / not fit for delivery", "Quantity mismatch", "Packaging problem", "Other"].map(function (value) {
            return (
              <label key={value}><input type="radio" name="issueReason" value={value} checked={reason === value} onChange={function () { setReason(value); }} /><span>{value}</span></label>
            );
          })}
        </fieldset>

        <label className="loader-modal-notes"><span>Additional notes</span><textarea rows={4} value={note} onChange={function (e) { setNote(e.target.value); }} placeholder="Add pick-face, packaging, or handling details..." /></label>

        <div className="loader-modal-warning"><AlertTriangle size={17} /><span>This issue will remain unresolved until the dispatcher reviews the shortfall or confirms the next action.</span></div>

        <div className="loader-modal-actions">
          <button className="loader-secondary-btn" onClick={onClose}>Cancel</button>
          <button className="loader-danger-btn" onClick={onSubmit}><AlertTriangle size={16} /> Report shortfall</button>
        </div>
      </div>
    </div>
  );
}
