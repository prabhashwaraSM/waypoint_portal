import React from "react";
import {
  AlertTriangle, ArrowLeft, Boxes, Check, CheckCircle2, ChevronDown, ClipboardCheck,
  Layers3, PackageCheck, Search, Snowflake, ThermometerSnowflake, Truck
} from "lucide-react";
import { statusClass } from "../utils/formatters";

function tempIcon(temp) {
  if (temp === "Frozen") return <Snowflake size={14} />;
  if (temp === "Chilled") return <ThermometerSnowflake size={14} />;
  return <Boxes size={14} />;
}

export default function LoadingSequencePage(props) {
  const {
    trip,
    totals,
    items,
    completionPct,
    unresolvedCount,
    resolvedItems,
    expandedStops,
    setExpandedStops,
    itemKey,
    onLoaded,
    onIssue,
    onReady,
    currentStatus,
    onBack,
    scanValue,
    setScanValue,
    onScan
  } = props;

  const loadingStops = [...trip.stops].sort(function (a, b) { return b.sequence - a.sequence; });

  return (
    <>
      <div className="loader-sequence-header">
        <button className="loader-back-btn" onClick={onBack}><ArrowLeft size={16} /> Loading plan</button>
        <div className="loader-sequence-title">
          <span className="loader-vehicle-icon large"><Truck size={23} /></span>
          <div><span className="loader-kicker">{trip.brand.toUpperCase()} • {trip.district.toUpperCase()}</span><h1>{trip.vehicleId} • {trip.routeCode} • Trip {trip.tripNo}</h1><p>{trip.vehicleType} • {trip.loadingBay} • Driver {trip.driver} • Departure {trip.plannedDeparture}</p></div>
        </div>
        <b className={"loader-status large " + statusClass(currentStatus)}>{currentStatus}</b>
      </div>

      <section className="loader-sequence-summary">
        <div className="loader-capacity-card">
          <div className="loader-capacity-title"><span><Layers3 size={18} /> Volume</span><b>{totals.volumePct}%</b></div>
          <div className="loader-progress"><i style={{ width: String(totals.volumePct) + "%" }} /></div>
          <small>{trip.load.volume} / {trip.capacity.volume} m³ planned</small>
        </div>
        <div className="loader-capacity-card">
          <div className="loader-capacity-title"><span><Truck size={18} /> Weight</span><b>{totals.weightPct}%</b></div>
          <div className="loader-progress green"><i style={{ width: String(totals.weightPct) + "%" }} /></div>
          <small>{trip.load.weight} / {trip.capacity.weight} kg planned</small>
        </div>
        <div className="loader-capacity-card">
          <div className="loader-capacity-title"><span><ClipboardCheck size={18} /> Loading completion</span><b>{completionPct}%</b></div>
          <div className="loader-progress"><i style={{ width: String(completionPct) + "%" }} /></div>
          <small>{items.length - unresolvedCount} of {items.length} item lines resolved</small>
        </div>
      </section>

      <section className="loader-sequence-layout">
        <div>
          <div className="loader-info-banner">
            <PackageCheck size={19} />
            <div><strong>Load in reverse stop order.</strong><span>Later delivery stops go deeper into the vehicle. Stop 1 is loaded last so it is accessible first at delivery.</span></div>
          </div>

          <div className="loader-scan-bar">
            <label><Search size={16} /><input value={scanValue} onChange={function (e) { setScanValue(e.target.value); }} onKeyDown={onScan} placeholder="Scan barcode / enter SKU and press Enter" /></label>
            <span>Scanner input is UI-only in this phase.</span>
          </div>

          <div className="loader-stop-stack">
            {loadingStops.map(function (stop, index) {
              const isOpen = expandedStops[stop.sequence] === undefined ? index < 2 : expandedStops[stop.sequence];
              const stopItems = stop.items.map(function (item) {
                return { ...item, stopSequence: stop.sequence, outlet: stop.outlet, outletId: stop.outletId };
              });
              const resolved = stopItems.filter(function (item) {
                return Boolean(resolvedItems[itemKey(trip.id, item.sku, stop.sequence)]);
              }).length;

              return (
                <article className="loader-stop-card" key={stop.sequence}>
                  <button className="loader-stop-head" onClick={function () {
                    setExpandedStops(function (current) {
                      return { ...current, [stop.sequence]: !isOpen };
                    });
                  }}>
                    <span className="loader-stop-number">{index + 1}</span>
                    <div className="loader-stop-copy">
                      <strong>{stop.outlet}</strong>
                      <small>Delivery stop {stop.sequence} • {stop.outletId} • {stop.window} • {stop.access}</small>
                    </div>
                    <div className="loader-load-order">
                      {index === 0 && <b>LOAD FIRST</b>}
                      {index === loadingStops.length - 1 && <b className="last">LOAD LAST</b>}
                      <span>{resolved}/{stopItems.length} resolved</span>
                    </div>
                    <ChevronDown size={18} className={isOpen ? "open" : ""} />
                  </button>

                  {isOpen && (
                    <div className="loader-stop-items">
                      <div className="loader-item-row head"><span>SKU / description</span><span>Pick zone</span><span>Qty</span><span>Temperature</span><span>Action</span></div>
                      {stopItems.map(function (item) {
                        const state = resolvedItems[itemKey(trip.id, item.sku, stop.sequence)];
                        return (
                          <div className={"loader-item-row " + (state ? "resolved" : "")} key={item.sku}>
                            <div><b>{item.sku}</b><small>{item.name}</small></div>
                            <span>{item.zone}</span>
                            <span><b>{item.qty}</b> {item.unit}</span>
                            <span className={"loader-temp " + item.temp.toLowerCase()}>{tempIcon(item.temp)} {item.temp}</span>
                            <div className="loader-item-actions">
                              <button className={"loader-check-btn " + (state === "loaded" ? "checked" : "")} onClick={function () { onLoaded(item); }} title="Mark loaded"><Check size={16} /> {state === "loaded" ? "Loaded" : "Load"}</button>
                              <button className={"loader-issue-btn " + (state === "issue" ? "reported" : "")} onClick={function () { onIssue(item); }} title="Report issue"><AlertTriangle size={15} /> {state === "issue" ? "Reported" : "Issue"}</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <aside className="loader-sequence-side">
          <div className="loader-panel sticky">
            <div className="loader-panel-head compact"><div><h2>Trip control</h2><p>Plan {trip.planVersion} • Updated {trip.updatedAt}</p></div></div>
            <div className="loader-control-list">
              <span><small>Vehicle</small><b>{trip.vehicleId}</b></span>
              <span><small>Loading bay</small><b>{trip.loadingBay}</b></span>
              <span><small>Stops</small><b>{trip.stops.length}</b></span>
              <span><small>Item lines</small><b>{items.length}</b></span>
              <span><small>Unresolved</small><b className={unresolvedCount ? "danger" : "ok"}>{unresolvedCount}</b></span>
            </div>
            <div className="loader-rule-note"><ThermometerSnowflake size={17} /><span><b>Temperature rule</b>Reefer vehicles carry frozen/chilled goods and may also carry ambient goods if capacity remains.</span></div>
            <button className="loader-ready-btn" onClick={onReady} disabled={currentStatus === "Ready"}>
              <CheckCircle2 size={18} /> {currentStatus === "Ready" ? "Vehicle ready" : "Mark vehicle ready"}
            </button>
            {unresolvedCount > 0 && <p className="loader-ready-help">Resolve all item lines by loading them or reporting a shortfall before departure.</p>}
          </div>
        </aside>
      </section>
    </>
  );
}
