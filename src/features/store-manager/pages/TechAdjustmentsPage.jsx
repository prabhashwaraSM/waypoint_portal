import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Cpu, History, Save, ShoppingCart, Wrench } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function TechAdjustmentsPage({ profile, onNavigate }) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("Hardware fault");
  const [serial, setSerial] = useState("");
  const [fault, setFault] = useState("");
  const [rmas, setRmas] = useState([]);

  const addRma = () => {
    if (!serial.trim() || !fault.trim()) return;
    setRmas((current) => [{
      id: "RMA-" + String(current.length + 1).padStart(3, "0"),
      item: "MSI Cyborg 15 Laptop",
      qty,
      reason,
      serial: serial.trim(),
      fault: fault.trim()
    }, ...current]);
    setSerial("");
    setFault("");
  };

  return (
    <>
      <PageHeader
        eyebrow={profile.brand.toUpperCase() + " • HIGH-VALUE CONTROL"}
        title="Hardware Adjustments & RMAs"
        description="Record serial-sensitive faults, quantity corrections and return-to-vendor actions for high-value electronics."
      />

      <section className="store-adjustment-grid">
        <div className="store-panel">
          <div className="store-panel-head"><div><h2>Faulty hardware / RMA</h2><p>Capture serial and fault details before stock is adjusted.</p></div><Wrench size={18} /></div>
          <div className="store-form-grid">
            <label className="store-field"><span>Item</span><input value="MSI Cyborg 15 Laptop" readOnly /></label>
            <label className="store-field"><span>Quantity</span><input type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label>
            <label className="store-field"><span>Reason</span><select value={reason} onChange={(e) => setReason(e.target.value)}><option>Hardware fault</option><option>Transit damage</option><option>DOA</option><option>Count correction</option></select></label>
            <label className="store-field"><span>Serial number</span><input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Enter / scan serial" /></label>
            <label className="store-field full"><span>Fault description</span><textarea rows={4} value={fault} onChange={(e) => setFault(e.target.value)} placeholder="Describe the fault or damage..." /></label>
          </div>
          <div className="store-form-actions"><button className="store-danger-btn" onClick={addRma}><Wrench size={16} /> Send to RMA list</button></div>
        </div>

        <aside className="store-panel">
          <div className="store-panel-head"><div><h2>Critical stock alert</h2><p>Source workflow quick-order action.</p></div><AlertTriangle size={18} /></div>
          <div className="store-low-stock-list">
            {profile.products.filter((p) => p.available <= 5).map((p) => (
              <div key={p.id}><span><b>{p.name}</b><small>Qty: {p.available}</small></span><button onClick={() => onNavigate("place-order")}><ShoppingCart size={14} /> Order</button></div>
            ))}
          </div>
        </aside>
      </section>

      <section className="store-panel">
        <div className="store-panel-head"><div><h2>Pending RMA & faulty hardware</h2><p>Session list for operational follow-up.</p></div><History size={18} /></div>
        <div className="store-rma-list">
          {rmas.length === 0 ? <div className="store-empty-inline"><Cpu size={18} /> No pending RMAs recorded in this session.</div> :
            rmas.map((row) => (
              <article key={row.id}>
                <span className="store-big-icon"><Cpu size={18} /></span>
                <div><b>{row.item}</b><small>{row.id} • S/N {row.serial} • {row.reason}</small><p>{row.fault}</p></div>
                <strong>{row.qty} unit{row.qty === 1 ? "" : "s"}</strong>
              </article>
            ))}
        </div>
      </section>

      {rmas.length > 0 && <div className="store-success-note wide"><CheckCircle2 size={17} /> RMA item added. Inventory update can be confirmed after review.</div>}
    </>
  );
}
