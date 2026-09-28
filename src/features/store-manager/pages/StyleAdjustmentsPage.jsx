import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, History, MinusCircle, Save, Shirt, ShoppingCart } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function StyleAdjustmentsPage({ profile, onNavigate }) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("Damage");
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState([]);

  const save = () => {
    setLogs((current) => [{
      id: "ADJ-" + String(current.length + 1).padStart(3, "0"),
      item: "Cotton T-Shirt (M/L)",
      qty,
      reason,
      notes,
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    }, ...current]);
    setNotes("");
  };

  return (
    <>
      <PageHeader
        eyebrow={profile.brand.toUpperCase() + " • STOCK CONTROL"}
        title="Store Adjustments & Losses"
        description="Record damaged, missing or corrected garment stock and keep a store-side audit trail."
      />

      <section className="store-adjustment-grid">
        <div className="store-panel">
          <div className="store-panel-head"><div><h2>New stock adjustment</h2><p>Prototype source item: Cotton T-Shirt (M/L).</p></div><Shirt size={18} /></div>
          <div className="store-form-grid">
            <label className="store-field"><span>Item</span><input value="Cotton T-Shirt (M/L)" readOnly /></label>
            <label className="store-field"><span>Quantity</span><input type="number" min="1" value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label>
            <label className="store-field"><span>Reason</span><select value={reason} onChange={(e) => setReason(e.target.value)}><option>Damage</option><option>Missing</option><option>Count correction</option><option>Customer return</option></select></label>
            <label className="store-field full"><span>Notes</span><textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add size, carton, damage or handling details..." /></label>
          </div>
          <div className="store-form-actions"><button className="store-primary-btn" onClick={save}><Save size={16} /> Save adjustment</button></div>
        </div>

        <aside className="store-panel">
          <div className="store-panel-head"><div><h2>Low stock items</h2><p>Quick action from the original store workflow.</p></div><AlertTriangle size={18} /></div>
          <div className="store-low-stock-list">
            {profile.products.filter((p) => p.available <= 12).map((p) => (
              <div key={p.id}><span><b>{p.name}</b><small>{p.available} {p.unit} available</small></span><button onClick={() => onNavigate("place-order")}><ShoppingCart size={14} /> Order</button></div>
            ))}
          </div>
        </aside>
      </section>

      <section className="store-panel">
        <div className="store-panel-head"><div><h2>Adjustment history</h2><p>Current shift audit trail.</p></div><History size={18} /></div>
        <div className="store-history-list">
          {logs.length === 0 ? <div className="store-empty-inline"><MinusCircle size={18} /> No adjustments recorded in this session.</div> :
            logs.map((log) => <div key={log.id}><span><b>{log.item}</b><small>{log.id} • {log.reason} • {log.time}</small></span><strong>-{log.qty}</strong></div>)}
        </div>
      </section>

      {logs.length > 0 && <div className="store-success-note wide"><CheckCircle2 size={17} /> Latest adjustment saved to the store audit list.</div>}
    </>
  );
}
