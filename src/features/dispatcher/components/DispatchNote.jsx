import React, { useEffect } from "react";
import { CheckCircle2, Printer, X, Navigation, FileBarChart, Plus, Send } from "lucide-react";
import Logo from "../../../shared/components/Logo";
import { fmtDate } from "../data/fleetStore";

// Dispatch note shown for review before confirming, and as the printable record afterwards.
export default function DispatchNote({ note, confirmed, onCancel, onConfirm, onTrack, onReport, onNew }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !confirmed && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmed, onCancel]);

  const v = note.vehicle || {};
  const d = note.driver || {};
  const print = () => {
    document.body.classList.add("print-note");
    window.print();
    setTimeout(() => document.body.classList.remove("print-note"), 500);
  };

  return (
    <div className="dn-overlay" onClick={confirmed ? undefined : onCancel}>
      <div className="dn-modal" role="dialog" aria-label="Dispatch note" onClick={(e) => e.stopPropagation()}>
        {confirmed ? (
          <div className="dn-done no-print">
            <CheckCircle2 size={22} />
            <div>
              <b>Dispatched.</b> {note.dispatchNo} is saved with invoice {note.invoiceNo}. It now appears on Vehicle Tracking and in Reports.
            </div>
          </div>
        ) : (
          <div className="dn-top no-print">
            <b>Review the dispatch note</b>
            <button className="dn-icon" onClick={onCancel} aria-label="Close"><X size={18} /></button>
          </div>
        )}

        <article className="dn-paper">
          <header className="dn-head">
            <Logo size={36} light={false} subtitle="Waypoint Group PVT LTD" />
            <div className="dn-title">
              <h2>Dispatch note</h2>
              <span>{confirmed ? note.dispatchNo : "Draft, not yet dispatched"}</span>
            </div>
          </header>

          <section className="dn-meta">
            <div><dt>Invoice no</dt><dd>{note.invoiceNo}</dd></div>
            <div><dt>Dispatch date</dt><dd>{fmtDate(note.dispatchDate)} {note.dispatchTime}</dd></div>
            <div><dt>Dispatch type</dt><dd>{note.dispatchType}</dd></div>
            <div><dt>Main warehouse</dt><dd>{note.warehouse} Depot</dd></div>
          </section>

          <section className="dn-blocks">
            <div className="dn-block">
              <h3>{note.party?.type === "Agent" || note.party?.type === "Distributor" ? "Agent" : "Customer / agent"}</h3>
              <p className="dn-strong">{note.party?.name || note.customerLabel}</p>
              {note.party?.type && <p>{note.party.type}</p>}
              {(note.party?.lines || []).map((l) => <p key={l}>{l}</p>)}
            </div>
            <div className="dn-block">
              <h3>Vehicle</h3>
              <p className="dn-strong">{v.id} {v.registrationNo ? `(${v.registrationNo})` : ""}</p>
              <p>{v.type === "van" ? "Van" : "Lorry / truck"}, {v.temp === "reefer" ? "reefer" : "ambient"}</p>
              <p>{v.makeModel}</p>
              <p>Capacity {v.weightCapKg?.toLocaleString()} kg, {v.volumeCapM3} m³</p>
            </div>
            <div className="dn-block">
              <h3>Driver</h3>
              <p className="dn-strong">{d.driver_name}</p>
              <p>{d.driver_id}, {d.phone}</p>
              <p>Licence {d.licence_no} ({d.licence_class})</p>
            </div>
          </section>

          <table className="dn-table">
            <thead>
              <tr><th>#</th><th>Order</th><th>Store</th><th>Goods</th><th className="num">Units</th><th className="num">Weight</th><th className="num">Volume</th><th>Need by</th></tr>
            </thead>
            <tbody>
              {note.orders.map((o, i) => (
                <tr key={o.id}>
                  <td>{i + 1}</td>
                  <td>{o.id}</td>
                  <td>{o.outlet_id}, {o.district}</td>
                  <td>{o.temp === "reefer" ? "Chilled" : "Ambient"}</td>
                  <td className="num">{o.units}</td>
                  <td className="num">{o.weightKg.toLocaleString()} kg</td>
                  <td className="num">{o.volM3} m³</td>
                  <td>{fmtDate(o.required_date)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Total, {note.orders.length} {note.orders.length === 1 ? "order" : "orders"}</td>
                <td className="num">{note.totals.units}</td>
                <td className="num">{note.totals.weight.toLocaleString()} kg</td>
                <td className="num">{note.totals.volume.toFixed(2)} m³</td>
                <td />
              </tr>
            </tfoot>
          </table>

          <footer className="dn-sign">
            <div><span>Dispatched by</span><b>{note.dispatchedBy}</b><i>Dispatcher</i></div>
            <div><span>Driver signature</span><b>&nbsp;</b></div>
            <div><span>Received by</span><b>&nbsp;</b></div>
          </footer>
        </article>

        <div className="dn-actions no-print">
          {confirmed ? (
            <>
              <button className="dn-btn" onClick={print}><Printer size={15} /> Print</button>
              <button className="dn-btn" onClick={onReport}><FileBarChart size={15} /> Open report</button>
              <button className="dn-btn" onClick={onTrack}><Navigation size={15} /> Track vehicle</button>
              <button className="dn-btn primary" onClick={onNew}><Plus size={15} /> New dispatch</button>
            </>
          ) : (
            <>
              <button className="dn-btn" onClick={onCancel}>Back to edit</button>
              <button className="dn-btn primary" onClick={onConfirm}><Send size={15} /> Confirm dispatch</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
