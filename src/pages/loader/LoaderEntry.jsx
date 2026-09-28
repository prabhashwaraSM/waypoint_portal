import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  ClipboardList,
  Filter,
  HelpCircle,
  History,
  Inbox,
  Layers3,
  LogOut,
  MessageSquare,
  PackageCheck,
  Search,
  Send,
  ShieldCheck,
  Snowflake,
  ThermometerSnowflake,
  Truck,
  UserCircle,
  Warehouse,
  Wifi,
  X
} from "lucide-react";
import Logo from "../../components/Logo";
import { getSession, logout } from "../../auth/auth";
import {
  allTripItems,
  initialLoaderEnquiries,
  initialLoaderIssues,
  loaderInventory,
  loaderTrips,
  tripTotals
} from "../../data/loaderData";
import "./loader.css";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "plan", label: "Loading Plan", icon: ClipboardList },
  { id: "sequence", label: "Loading Sequence", icon: PackageCheck },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "issues", label: "Issues & Enquiries", icon: MessageSquare },
  { id: "history", label: "Completed Loads", icon: History }
];

const BRAND_SHORT = {
  "Waypoint Fresh": "Fresh",
  "Waypoint Style": "Style",
  "Waypoint Tech": "Tech"
};

function statusClass(status) {
  return String(status).toLowerCase().replaceAll(" ", "-");
}

function tempIcon(temp) {
  if (temp === "Frozen") return <Snowflake size={14} />;
  if (temp === "Chilled") return <ThermometerSnowflake size={14} />;
  return <Boxes size={14} />;
}

export default function LoaderEntry() {
  const navigate = useNavigate();
  const session = getSession();
  const [section, setSection] = useState("overview");
  const [selectedTripId, setSelectedTripId] = useState("TRP-260928-014");
  const [tripStatuses, setTripStatuses] = useState(function () {
    return Object.fromEntries(loaderTrips.map(function (trip) { return [trip.id, trip.status]; }));
  });
  const [resolvedItems, setResolvedItems] = useState(function () {
    const initial = {};
    initialLoaderIssues.forEach(function (issue) {
      if (issue.stopSequence) initial[issue.tripId + "::" + issue.stopSequence + "::" + issue.sku] = "issue";
    });
    return initial;
  });
  const [expandedStops, setExpandedStops] = useState({ 6: true, 5: true });
  const [issues, setIssues] = useState(initialLoaderIssues);
  const [enquiries, setEnquiries] = useState(initialLoaderEnquiries);
  const [issueModal, setIssueModal] = useState(null);
  const [issueReason, setIssueReason] = useState("Missing in warehouse");
  const [availableQty, setAvailableQty] = useState("");
  const [issueNote, setIssueNote] = useState("");
  const [toast, setToast] = useState("");
  const [planSearch, setPlanSearch] = useState("");
  const [planBrand, setPlanBrand] = useState("All");
  const [inventorySearch, setInventorySearch] = useState("");
  const [enquiryTrip, setEnquiryTrip] = useState("TRP-260928-014");
  const [enquirySubject, setEnquirySubject] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [scanValue, setScanValue] = useState("");

  const selectedTrip = loaderTrips.find(function (trip) { return trip.id === selectedTripId; }) || loaderTrips[0];
  const selectedItems = useMemo(function () { return allTripItems(selectedTrip); }, [selectedTrip]);
  const selectedTotals = useMemo(function () { return tripTotals(selectedTrip); }, [selectedTrip]);

  const filteredTrips = loaderTrips.filter(function (trip) {
    const matchSearch = [trip.id, trip.vehicleId, trip.routeCode, trip.district, trip.brand]
      .join(" ")
      .toLowerCase()
      .includes(planSearch.trim().toLowerCase());
    const matchBrand = planBrand === "All" || trip.brand === planBrand;
    return matchSearch && matchBrand;
  });

  const filteredInventory = loaderInventory.filter(function (row) {
    return [row.sku, row.item, row.category, row.zone]
      .join(" ")
      .toLowerCase()
      .includes(inventorySearch.trim().toLowerCase());
  });

  const itemKey = function (tripId, sku, stopSequence) {
    return tripId + "::" + stopSequence + "::" + sku;
  };

  const isItemResolved = function (item) {
    return Boolean(resolvedItems[itemKey(selectedTrip.id, item.sku, item.stopSequence)]);
  };

  const resolvedCount = selectedItems.filter(isItemResolved).length;
  const unresolvedCount = selectedItems.length - resolvedCount;
  const completionPct = selectedItems.length ? Math.round((resolvedCount / selectedItems.length) * 100) : 0;

  const showToast = function (message) {
    setToast(message);
    window.setTimeout(function () { setToast(""); }, 2600);
  };

  const signOut = function () {
    logout();
    navigate("/login", { replace: true });
  };

  const selectTrip = function (tripId, nextSection) {
    setSelectedTripId(tripId);
    setSection(nextSection || "sequence");
    setExpandedStops({});
  };

  const markItemLoaded = function (item) {
    const key = itemKey(selectedTrip.id, item.sku, item.stopSequence);
    setResolvedItems(function (current) {
      const next = { ...current };
      if (next[key] === "loaded") delete next[key];
      else next[key] = "loaded";
      return next;
    });
  };

  const openIssue = function (item) {
    setIssueModal(item);
    setIssueReason("Missing in warehouse");
    setAvailableQty("");
    setIssueNote("");
  };

  const submitIssue = function () {
    if (!issueModal) return;
    const expected = issueModal.qty;
    const available = availableQty === "" ? 0 : Math.max(0, Number(availableQty));
    const newIssue = {
      id: "ISS-260928-" + String(issues.length + 5).padStart(3, "0"),
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      tripId: selectedTrip.id,
      vehicleId: selectedTrip.vehicleId,
      outlet: issueModal.outlet,
      sku: issueModal.sku,
      item: issueModal.name,
      expected: expected,
      available: available,
      unit: issueModal.unit,
      reason: issueReason,
      status: "Awaiting dispatcher",
      priority: expected > available ? "High" : "Normal",
      note: issueNote || "Reported from Loader workspace before vehicle departure."
    };
    setIssues(function (current) { return [newIssue, ...current]; });
    setResolvedItems(function (current) {
      return {
        ...current,
        [itemKey(selectedTrip.id, issueModal.sku, issueModal.stopSequence)]: "issue"
      };
    });
    setIssueModal(null);
    showToast("Shortfall recorded and dispatcher notified.");
  };

  const markTripReady = function () {
    if (unresolvedCount > 0) {
      showToast(String(unresolvedCount) + " item line" + (unresolvedCount > 1 ? "s are" : " is") + " still unresolved.");
      return;
    }
    setTripStatuses(function (current) {
      return { ...current, [selectedTrip.id]: "Ready" };
    });
    showToast(selectedTrip.vehicleId + " marked Ready for Departure.");
  };

  const handleScan = function (event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const code = scanValue.trim().toLowerCase();
    if (!code) return;
    const found = selectedItems.find(function (item) { return item.sku.toLowerCase() === code; });
    if (!found) {
      showToast("SKU is not part of this trip.");
      return;
    }
    setResolvedItems(function (current) {
      return {
        ...current,
        [itemKey(selectedTrip.id, found.sku, found.stopSequence)]: "loaded"
      };
    });
    setScanValue("");
    showToast(found.sku + " marked loaded.");
  };

  const submitEnquiry = function (event) {
    event.preventDefault();
    if (!enquirySubject.trim() || !enquiryMessage.trim()) {
      showToast("Add an enquiry subject and message.");
      return;
    }
    const row = {
      id: "ENQ-260928-" + String(enquiries.length + 3).padStart(3, "0"),
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      tripId: enquiryTrip,
      subject: enquirySubject.trim(),
      message: enquiryMessage.trim(),
      status: "Sent to dispatcher"
    };
    setEnquiries(function (current) { return [row, ...current]; });
    setEnquirySubject("");
    setEnquiryMessage("");
    showToast("Enquiry sent to dispatcher.");
  };

  const stats = useMemo(function () {
    const allItems = loaderTrips.reduce(function (sum, trip) {
      return sum + allTripItems(trip).length;
    }, 0);
    return {
      vehicles: loaderTrips.length,
      orders: loaderTrips.reduce(function (sum, trip) { return sum + trip.stops.length; }, 0),
      routes: new Set(loaderTrips.map(function (trip) { return trip.routeCode; })).size,
      loading: Object.values(tripStatuses).filter(function (status) { return status === "Loading"; }).length,
      itemLines: allItems,
      openIssues: issues.filter(function (issue) { return issue.status !== "Resolved"; }).length
    };
  }, [issues, tripStatuses]);

  return (
    <div className="loader-shell">
      <aside className="loader-sidebar">
        <div className="loader-brand">
          <Logo size={38} product="Loader" subtitle="Warehouse Operations" accent="#4f46e5" />
          <div className="loader-role-pill"><ShieldCheck size={13} /> Role: <b>Loader</b></div>
        </div>

        <nav className="loader-nav">
          {NAV_ITEMS.map(function (item) {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={section === item.id ? "active" : ""}
                onClick={function () { setSection(item.id); }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.id === "issues" && stats.openIssues > 0 && <b className="loader-nav-count">{stats.openIssues}</b>}
              </button>
            );
          })}
        </nav>

        <div className="loader-sidebar-state">
          <span><CircleDot size={13} /> Dock system online</span>
          <small>Plan sync: just now</small>
        </div>

        <div className="loader-user">
          <div className="loader-avatar">WL</div>
          <div>
            <strong>{session?.name || "Warehouse Loader"}</strong>
            <small>{session?.depot || "Peliyagoda"} depot • Shift A</small>
          </div>
          <button onClick={signOut} title="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>

      <div className="loader-main-area">
        <header className="loader-topbar">
          <div className="loader-topbar-title">
            <strong>Waypoint Group PVT LTD</strong>
            <span>Warehouse execution • {session?.depot || "Peliyagoda"}</span>
          </div>

          <div className="loader-topbar-meta">
            <div className="loader-sync"><Wifi size={15} /><span><b>Live</b><small>Synced</small></span></div>
            <button className="loader-icon-btn" title="Notifications">
              <Bell size={18} /><i>{stats.openIssues}</i>
            </button>
            <div className="loader-profile"><UserCircle size={23} /><span><b>{session?.name || "Warehouse Loader"}</b><small>Loader • Shift A</small></span></div>
          </div>
        </header>

        <main className="loader-content">
          {section === "overview" && (
            <Overview
              stats={stats}
              tripStatuses={tripStatuses}
              issues={issues}
              onOpenTrip={function (id) { selectTrip(id, "sequence"); }}
              onOpenPlan={function () { setSection("plan"); }}
              onOpenIssues={function () { setSection("issues"); }}
            />
          )}

          {section === "plan" && (
            <LoadingPlan
              trips={filteredTrips}
              tripStatuses={tripStatuses}
              planSearch={planSearch}
              setPlanSearch={setPlanSearch}
              planBrand={planBrand}
              setPlanBrand={setPlanBrand}
              onOpenTrip={function (id) { selectTrip(id, "sequence"); }}
            />
          )}

          {section === "sequence" && (
            <LoadingSequence
              trip={selectedTrip}
              totals={selectedTotals}
              items={selectedItems}
              completionPct={completionPct}
              unresolvedCount={unresolvedCount}
              resolvedItems={resolvedItems}
              expandedStops={expandedStops}
              setExpandedStops={setExpandedStops}
              itemKey={itemKey}
              onLoaded={markItemLoaded}
              onIssue={openIssue}
              onReady={markTripReady}
              currentStatus={tripStatuses[selectedTrip.id]}
              onBack={function () { setSection("plan"); }}
              scanValue={scanValue}
              setScanValue={setScanValue}
              onScan={handleScan}
            />
          )}

          {section === "inventory" && (
            <Inventory
              rows={filteredInventory}
              search={inventorySearch}
              setSearch={setInventorySearch}
              onOpenIssues={function () { setSection("issues"); }}
            />
          )}

          {section === "issues" && (
            <IssuesAndEnquiries
              issues={issues}
              enquiries={enquiries}
              enquiryTrip={enquiryTrip}
              setEnquiryTrip={setEnquiryTrip}
              enquirySubject={enquirySubject}
              setEnquirySubject={setEnquirySubject}
              enquiryMessage={enquiryMessage}
              setEnquiryMessage={setEnquiryMessage}
              onSubmit={submitEnquiry}
            />
          )}

          {section === "history" && (
            <HistoryView tripStatuses={tripStatuses} />
          )}
        </main>
      </div>

      {issueModal && (
        <IssueModal
          item={issueModal}
          trip={selectedTrip}
          reason={issueReason}
          setReason={setIssueReason}
          availableQty={availableQty}
          setAvailableQty={setAvailableQty}
          note={issueNote}
          setNote={setIssueNote}
          onClose={function () { setIssueModal(null); }}
          onSubmit={submitIssue}
        />
      )}

      {toast && <div className="loader-toast"><CheckCircle2 size={17} /> {toast}</div>}
    </div>
  );
}

function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="loader-page-header">
      <div>
        <span className="loader-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="loader-page-actions">{actions}</div>}
    </div>
  );
}

function Overview({ stats, tripStatuses, issues, onOpenTrip, onOpenPlan, onOpenIssues }) {
  const activeTrips = loaderTrips.filter(function (trip) {
    return tripStatuses[trip.id] !== "Ready";
  }).slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="WAREHOUSE CONTROL"
        title="Loader Operations"
        description="Execute the dispatcher plan, load in reverse stop order, protect temperature-sensitive goods, and report shortfalls before departure."
        actions={<button className="loader-primary-btn" onClick={onOpenPlan}><ClipboardList size={17} /> Open loading plan</button>}
      />

      <section className="loader-stats-grid">
        <StatCard icon={Truck} tone="indigo" value={stats.vehicles} label="Assigned vehicles" meta="Today's depot plan" />
        <StatCard icon={Warehouse} tone="blue" value={stats.orders} label="Delivery stops" meta={String(stats.routes) + " planned routes"} />
        <StatCard icon={Layers3} tone="green" value={stats.itemLines} label="Item lines" meta="Across all trips" />
        <StatCard icon={AlertTriangle} tone="red" value={stats.openIssues} label="Open shortfalls" meta="Need dispatcher attention" />
      </section>

      <section className="loader-overview-grid">
        <div className="loader-panel">
          <div className="loader-panel-head">
            <div><h2>Next vehicles at the dock</h2><p>Work queue ordered by planned departure.</p></div>
            <button className="loader-text-btn" onClick={onOpenPlan}>View full plan <ChevronRight size={15} /></button>
          </div>
          <div className="loader-trip-cards">
            {activeTrips.map(function (trip) {
              const totals = tripTotals(trip);
              return (
                <button className="loader-trip-card" key={trip.id} onClick={function () { onOpenTrip(trip.id); }}>
                  <div className="loader-trip-card-top">
                    <span className="loader-vehicle-icon"><Truck size={20} /></span>
                    <div><strong>{trip.vehicleId}</strong><small>{trip.vehicleType}</small></div>
                    <b className={"loader-status " + statusClass(tripStatuses[trip.id])}>{tripStatuses[trip.id]}</b>
                  </div>
                  <div className="loader-trip-route">
                    <span>{BRAND_SHORT[trip.brand]} • {trip.district}</span>
                    <b>{trip.routeCode} • Trip {trip.tripNo}</b>
                  </div>
                  <div className="loader-trip-card-meta">
                    <span><small>Bay</small><b>{trip.loadingBay}</b></span>
                    <span><small>Stops</small><b>{trip.stops.length}</b></span>
                    <span><small>Departure</small><b>{trip.plannedDeparture}</b></span>
                  </div>
                  <div className="loader-util-line"><i><em style={{ width: String(totals.volumePct) + "%" }} /></i><span>{totals.volumePct}% volume</span></div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="loader-panel">
          <div className="loader-panel-head">
            <div><h2>Dock exceptions</h2><p>Shortfalls reported before departure.</p></div>
            <button className="loader-text-btn" onClick={onOpenIssues}>Open issue desk <ChevronRight size={15} /></button>
          </div>
          <div className="loader-issue-list">
            {issues.slice(0, 4).map(function (issue) {
              return (
                <div className="loader-issue-row" key={issue.id}>
                  <span className="loader-alert-icon"><AlertTriangle size={17} /></span>
                  <div><strong>{issue.item}</strong><small>{issue.vehicleId} • {issue.outlet}</small></div>
                  <b>{issue.available}/{issue.expected} {issue.unit}</b>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function StatCard({ icon: Icon, tone, value, label, meta }) {
  return (
    <article className="loader-stat-card">
      <span className={"loader-stat-icon " + tone}><Icon size={21} /></span>
      <div><strong>{value}</strong><b>{label}</b><small>{meta}</small></div>
    </article>
  );
}

function LoadingPlan({ trips, tripStatuses, planSearch, setPlanSearch, planBrand, setPlanBrand, onOpenTrip }) {
  return (
    <>
      <PageHeader
        eyebrow="TODAY • PELIYAGODA"
        title="Loading Plan"
        description="Dispatcher-assigned vehicles and trips. The Loader executes this plan; vehicle allocation is not changed here."
      />

      <div className="loader-toolbar">
        <label className="loader-search"><Search size={16} /><input value={planSearch} onChange={function (e) { setPlanSearch(e.target.value); }} placeholder="Search vehicle, route, district..." /></label>
        <label className="loader-select"><Filter size={15} /><select value={planBrand} onChange={function (e) { setPlanBrand(e.target.value); }}>
          <option value="All">All brands</option>
          <option value="Waypoint Fresh">Waypoint Fresh</option>
          <option value="Waypoint Style">Waypoint Style</option>
          <option value="Waypoint Tech">Waypoint Tech</option>
        </select></label>
        <div className="loader-plan-sync"><Wifi size={15} /><span><b>Plan synced</b><small>Dispatcher changes appear here</small></span></div>
      </div>

      <section className="loader-panel loader-table-panel">
        <div className="loader-table-wrap">
          <table className="loader-data-table">
            <thead><tr><th>Vehicle / trip</th><th>Route</th><th>Vehicle type</th><th>Bay</th><th>Stops</th><th>Capacity</th><th>Departure</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {trips.map(function (trip) {
                const totals = tripTotals(trip);
                return (
                  <tr key={trip.id}>
                    <td><div className="loader-table-primary"><span className="loader-table-icon"><Truck size={17} /></span><span><b>{trip.vehicleId}</b><small>{BRAND_SHORT[trip.brand]} • Trip {trip.tripNo}</small></span></div></td>
                    <td><b>{trip.district}</b><small className="loader-cell-sub">{trip.routeCode}</small></td>
                    <td><b>{trip.vehicleType}</b><small className="loader-cell-sub">{trip.vehicleTemp}</small></td>
                    <td>{trip.loadingBay}</td>
                    <td>{trip.stops.length}</td>
                    <td><div className="loader-mini-meter"><span><i style={{ width: String(totals.volumePct) + "%" }} /></span><small>{trip.load.volume}/{trip.capacity.volume} m³</small></div></td>
                    <td><b>{trip.plannedDeparture}</b><small className="loader-cell-sub">Plan {trip.planVersion}</small></td>
                    <td><b className={"loader-status " + statusClass(tripStatuses[trip.id])}>{tripStatuses[trip.id]}</b></td>
                    <td><button className="loader-row-action" onClick={function () { onOpenTrip(trip.id); }}>Open load <ChevronRight size={15} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function LoadingSequence(props) {
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

function Inventory({ rows, search, setSearch, onOpenIssues }) {
  return (
    <>
      <PageHeader
        eyebrow="WAREHOUSE STOCK"
        title="Inventory Lookup"
        description="Quick pick-face lookup for the Loader. This is not stock administration; it helps confirm availability and warehouse zones during loading."
        actions={<button className="loader-secondary-btn" onClick={onOpenIssues}><MessageSquare size={16} /> Report stock issue</button>}
      />
      <div className="loader-toolbar">
        <label className="loader-search wide"><Search size={16} /><input value={search} onChange={function (e) { setSearch(e.target.value); }} placeholder="Search SKU, item, category, pick zone..." /></label>
      </div>
      <section className="loader-panel loader-table-panel">
        <div className="loader-table-wrap">
          <table className="loader-data-table">
            <thead><tr><th>SKU</th><th>Item</th><th>Category</th><th>Pick zone</th><th>On hand</th><th>Allocated today</th><th>Balance after allocation</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map(function (row) {
                return (
                  <tr key={row.sku}>
                    <td><b>{row.sku}</b></td>
                    <td>{row.item}</td>
                    <td><span className={"loader-temp " + row.category.toLowerCase()}>{row.category}</span></td>
                    <td><b>{row.zone}</b></td>
                    <td>{row.onHand} {row.unit}</td>
                    <td>{row.allocated} {row.unit}</td>
                    <td><b>{row.onHand - row.allocated} {row.unit}</b></td>
                    <td><b className={"loader-inventory-status " + row.status.toLowerCase()}>{row.status}</b></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function IssuesAndEnquiries(props) {
  const {
    issues,
    enquiries,
    enquiryTrip,
    setEnquiryTrip,
    enquirySubject,
    setEnquirySubject,
    enquiryMessage,
    setEnquiryMessage,
    onSubmit
  } = props;

  return (
    <>
      <PageHeader
        eyebrow="EXCEPTION DESK"
        title="Issues & Enquiries"
        description="Record missing, damaged, or mismatched items and send operational questions to the dispatcher before the vehicle leaves."
      />

      <section className="loader-exception-grid">
        <div className="loader-panel">
          <div className="loader-panel-head"><div><h2>Reported loading issues</h2><p>Every shortfall remains visible until the dispatcher responds.</p></div><span className="loader-count-pill">{issues.length}</span></div>
          <div className="loader-issue-table">
            {issues.map(function (issue) {
              return (
                <article key={issue.id}>
                  <div className="loader-issue-id"><span className="loader-alert-icon"><AlertTriangle size={16} /></span><div><b>{issue.id}</b><small>{issue.time} • {issue.tripId}</small></div></div>
                  <div><strong>{issue.item}</strong><small>{issue.sku} • {issue.outlet}</small></div>
                  <div><small>Expected / available</small><b>{issue.expected} / {issue.available} {issue.unit}</b></div>
                  <div><small>Reason</small><b>{issue.reason}</b></div>
                  <div><b className={"loader-status " + statusClass(issue.status)}>{issue.status}</b></div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="loader-panel">
          <div className="loader-panel-head"><div><h2>Send enquiry</h2><p>Ask the dispatcher about a route, bay, quantity, or changed plan.</p></div><HelpCircle size={19} /></div>
          <form className="loader-enquiry-form" onSubmit={onSubmit}>
            <label><span>Trip</span><select value={enquiryTrip} onChange={function (e) { setEnquiryTrip(e.target.value); }}>{loaderTrips.map(function (trip) { return <option key={trip.id} value={trip.id}>{trip.vehicleId} • {trip.routeCode} • Trip {trip.tripNo}</option>; })}</select></label>
            <label><span>Subject</span><input value={enquirySubject} onChange={function (e) { setEnquirySubject(e.target.value); }} placeholder="Example: Route list changed after picking" /></label>
            <label><span>Message</span><textarea value={enquiryMessage} onChange={function (e) { setEnquiryMessage(e.target.value); }} placeholder="Describe what you need the dispatcher to confirm..." rows={5} /></label>
            <button className="loader-primary-btn" type="submit"><Send size={16} /> Send to dispatcher</button>
          </form>

          <div className="loader-enquiry-history">
            <h3>Recent enquiries</h3>
            {enquiries.map(function (row) {
              return (
                <div key={row.id}><span><b>{row.subject}</b><small>{row.id} • {row.tripId} • {row.time}</small></span><b className={"loader-status " + statusClass(row.status)}>{row.status}</b><p>{row.message}</p></div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function HistoryView({ tripStatuses }) {
  const readyTrips = loaderTrips.filter(function (trip) { return tripStatuses[trip.id] === "Ready"; });

  return (
    <>
      <PageHeader
        eyebrow="SHIFT RECORD"
        title="Completed Loads"
        description="Vehicles already cleared by the Loader for driver handover. This provides a simple operational audit trail for the prototype."
      />
      <section className="loader-history-grid">
        {readyTrips.map(function (trip) {
          return (
            <article className="loader-history-card" key={trip.id}>
              <div className="loader-history-icon"><CheckCircle2 size={21} /></div>
              <div><span className="loader-kicker">{trip.id}</span><h3>{trip.vehicleId} • {trip.routeCode}</h3><p>{BRAND_SHORT[trip.brand]} • {trip.district} • Trip {trip.tripNo}</p></div>
              <div className="loader-history-meta"><span><small>Bay</small><b>{trip.loadingBay}</b></span><span><small>Departure</small><b>{trip.plannedDeparture}</b></span><span><small>Plan</small><b>{trip.planVersion}</b></span></div>
            </article>
          );
        })}
        {!readyTrips.length && <div className="loader-empty"><Inbox size={28} /><b>No completed loads yet</b><span>Vehicles marked Ready will appear here.</span></div>}
      </section>
    </>
  );
}

function IssueModal({ item, trip, reason, setReason, availableQty, setAvailableQty, note, setNote, onClose, onSubmit }) {
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
