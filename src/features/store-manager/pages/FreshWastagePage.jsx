import React, { useMemo, useState } from "react";
import { CheckCircle2, Leaf, Save, Sparkles, Trash2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { initialWastageRows } from "../data/storeManagerData";

export default function FreshWastagePage({ profile }) {
  const [rows, setRows] = useState(initialWastageRows);
  const [submitted, setSubmitted] = useState(false);

  const totals = useMemo(() => rows.reduce((acc, row) => ({
    arrived: acc.arrived + Number(row.arrived || 0),
    sold: acc.sold + Number(row.sold || 0),
    wastage: acc.wastage + Number(row.wastage || 0)
  }), { arrived: 0, sold: 0, wastage: 0 }), [rows]);

  const update = (id, field, value) => {
    setSubmitted(false);
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: Number(value) } : row));
  };

  return (
    <>
      <PageHeader
        eyebrow={profile.brand.toUpperCase() + " • DAILY CONTROL"}
        title="Daily Wastage & Smart Forecast"
        description="Record arrived, sold and wasted fresh stock so the next replenishment can reflect actual store movement."
      />

      <section className="store-stat-grid three">
        <div className="store-mini-metric"><Leaf size={18} /><span><small>Arrived today</small><b>{totals.arrived}</b></span></div>
        <div className="store-mini-metric"><CheckCircle2 size={18} /><span><small>Sold today</small><b>{totals.sold}</b></span></div>
        <div className="store-mini-metric danger"><Trash2 size={18} /><span><small>Wastage</small><b>{totals.wastage}</b></span></div>
      </section>

      <section className="store-panel store-table-panel">
        <div className="store-panel-head"><div><h2>Daily fresh stock movement</h2><p>Source prototype values are editable for demo purposes.</p></div></div>
        <div className="store-responsive-table">
          <table className="store-table">
            <thead><tr><th>Item</th><th>Arrived</th><th>Sold</th><th>Wastage</th><th>Calculated balance</th></tr></thead>
            <tbody>
              {rows.map((row) => {
                const balance = Number(row.arrived) - Number(row.sold) - Number(row.wastage);
                return (
                  <tr key={row.id}>
                    <td data-label="Item"><b>{row.item}</b><small>{row.unit}</small></td>
                    <td data-label="Arrived"><input type="number" value={row.arrived} onChange={(e) => update(row.id, "arrived", e.target.value)} /></td>
                    <td data-label="Sold"><input type="number" value={row.sold} onChange={(e) => update(row.id, "sold", e.target.value)} /></td>
                    <td data-label="Wastage"><input type="number" value={row.wastage} onChange={(e) => update(row.id, "wastage", e.target.value)} /></td>
                    <td data-label="Balance"><b className={balance <= 5 ? "store-danger-text" : ""}>{balance} {row.unit}</b></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="store-forecast-card">
        <Sparkles size={20} />
        <div><b>Forecast input ready</b><span>These figures can feed the future forecasting workflow. This UI records the store-side operational inputs only.</span></div>
        <button className="store-primary-btn" onClick={() => setSubmitted(true)}><Save size={16} /> Submit daily record</button>
      </section>

      {submitted && <div className="store-success-note wide"><CheckCircle2 size={17} /> Daily wastage record submitted for {profile.outlet}.</div>}
    </>
  );
}
