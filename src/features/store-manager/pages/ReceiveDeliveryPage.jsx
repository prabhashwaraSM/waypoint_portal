import React, { useMemo, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, ClipboardCheck, FileText, Package, Printer, Truck } from "lucide-react";
import PageHeader from "../components/PageHeader";

function receiptLabel(storeKey) {
  if (storeKey === "style") return "Material Receipt Note (MRN)";
  if (storeKey === "tech") return "Goods Receipt Note (GRN)";
  return "Delivery Receipt";
}

export default function ReceiveDeliveryPage({ profile }) {
  const delivery = profile.upcomingDelivery;
  const [rows, setRows] = useState(() => delivery.items.map((item) => ({
    ...item,
    received: item.expected,
    condition: "Good",
    action: "Return to depot with driver",
    note: ""
  })));
  const [confirmed, setConfirmed] = useState(false);
  const [documentOpen, setDocumentOpen] = useState(false);

  const hasDamage = useMemo(() => rows.some((row) => row.condition !== "Good" || Number(row.received) !== Number(row.expected)), [rows]);

  const updateRow = (id, patch) => {
    setConfirmed(false);
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
  };

  const confirm = () => setConfirmed(true);

  return (
    <>
      <PageHeader
        eyebrow={profile.brand.toUpperCase() + " • RECEIVING"}
        title={"Receive " + (profile.key === "style" ? "Order" : "Delivery")}
        description={"Verify quantities and condition for " + delivery.vehicle + " • " + delivery.trip + " before confirming stock at " + profile.outlet + "."}
        actions={
          <button className="store-secondary-btn" onClick={() => setDocumentOpen(true)}><FileText size={16} /> {receiptLabel(profile.key)}</button>
        }
      />

      <section className="store-receive-summary">
        <div><Truck size={19} /><span><small>Vehicle</small><b>{delivery.vehicle}</b></span></div>
        <div><ClipboardCheck size={19} /><span><small>Order</small><b>{delivery.id}</b></span></div>
        <div><Package size={19} /><span><small>Item lines</small><b>{rows.length}</b></span></div>
        <div><CheckCircle2 size={19} /><span><small>Status</small><b>{confirmed ? "Completed" : "Incomplete"}</b></span></div>
      </section>

      <div className="store-receive-banner">
        <AlertTriangle size={18} />
        <div>
          <b>{profile.key === "fresh" ? "Unload priority goods first" : profile.key === "tech" ? "Inspect seals and serial-sensitive items carefully" : "Protect hanging garments and carton condition"}</b>
          <span>Any shortage or damage must be recorded before receipt is confirmed.</span>
        </div>
      </div>

      <section className="store-receive-list">
        {rows.map((row, index) => (
          <article className={"store-receive-card " + (row.condition !== "Good" ? "has-issue" : "")} key={row.id}>
            <div className="store-receive-card-head">
              <span className="store-stop-index">{index + 1}</span>
              <div><b>{row.name}</b><small>{row.priority ? "Priority handling" : "Standard handling"} • Expected {row.expected} {row.unit}</small></div>
              <span className={"store-condition-chip " + row.condition.toLowerCase()}>{row.condition}</span>
            </div>

            <div className="store-receive-fields">
              <label className="store-field">
                <span>Received quantity</span>
                <input type="number" min="0" value={row.received} onChange={(e) => updateRow(row.id, { received: e.target.value })} />
              </label>

              <label className="store-field">
                <span>Condition</span>
                <select value={row.condition} onChange={(e) => updateRow(row.id, { condition: e.target.value })}>
                  <option>Good</option>
                  <option>Damaged</option>
                  <option>Short</option>
                  <option>Rejected</option>
                </select>
              </label>

              <label className="store-field">
                <span>Issue action</span>
                <select value={row.action} disabled={row.condition === "Good"} onChange={(e) => updateRow(row.id, { action: e.target.value })}>
                  <option>Return to depot with driver</option>
                  <option>Hold at store for review</option>
                  <option>Discard locally after approval</option>
                </select>
              </label>
            </div>

            {row.condition !== "Good" && (
              <div className="store-receive-issue">
                <label className="store-field">
                  <span>Issue note</span>
                  <input value={row.note} onChange={(e) => updateRow(row.id, { note: e.target.value })} placeholder="Describe damage, shortage or packaging issue..." />
                </label>
                <button className="store-secondary-btn"><Camera size={15} /> Add photo proof</button>
              </div>
            )}
          </article>
        ))}
      </section>

      <div className="store-confirm-row">
        <div>
          <b>{hasDamage ? "Receipt contains exceptions" : "All lines match the planned delivery"}</b>
          <span>{hasDamage ? "The exception details will be included in the receipt confirmation." : "Confirm to update store-side stock status."}</span>
        </div>
        <button className="store-primary-btn" onClick={confirm}><CheckCircle2 size={17} /> Confirm receipt & update stock</button>
      </div>

      {confirmed && <div className="store-success-note wide"><CheckCircle2 size={17} /> Receipt confirmed. Store stock and delivery status were updated in this prototype.</div>}

      {documentOpen && (
        <div className="store-modal-backdrop">
          <div className="store-modal" role="dialog" aria-modal="true">
            <div className="store-modal-head">
              <div><span className="store-kicker">RECEIPT DOCUMENT</span><h2>{receiptLabel(profile.key)}</h2><p>{delivery.id} • {profile.outletId} • {delivery.vehicle}</p></div>
              <button onClick={() => setDocumentOpen(false)}>×</button>
            </div>
            <div className="store-document-preview">
              <div><small>Store</small><b>{profile.brand} • {profile.outlet}</b></div>
              <div><small>Vehicle / trip</small><b>{delivery.vehicle} • {delivery.trip}</b></div>
              <div><small>Plan version</small><b>{delivery.planVersion}</b></div>
              <div><small>Receipt status</small><b>{confirmed ? "Confirmed" : "Draft"}</b></div>
            </div>
            <div className="store-document-lines">
              {rows.map((row) => <span key={row.id}><b>{row.name}</b><small>{row.received}/{row.expected} {row.unit} • {row.condition}</small></span>)}
            </div>
            <div className="store-modal-actions">
              <button className="store-secondary-btn"><Printer size={15} /> Print / Export</button>
              <button className="store-primary-btn" onClick={() => setDocumentOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
