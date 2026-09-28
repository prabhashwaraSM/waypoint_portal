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
import PortalChrome from "../../../shared/components/PortalChrome";
import { getSession, logout } from "../../../shared/auth/auth";
import {
  allTripItems,
  initialLoaderEnquiries,
  initialLoaderIssues,
  loaderInventory,
  loaderTrips,
  tripTotals
} from "../data/loaderData";
import "../styles/loader.css";
import "../../../shared/styles/portalLayout.css";
import Overview from "./OverviewPage";
import LoadingPlan from "./LoadingPlanPage";
import LoadingSequence from "./LoadingSequencePage";
import Inventory from "./LoaderInventoryPage";
import IssuesAndEnquiries from "./IssuesAndEnquiriesPage";
import HistoryView from "./CompletedLoadsPage";
import IssueModal from "../components/IssueModal";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "plan", label: "Loading Plan", icon: ClipboardList },
  { id: "sequence", label: "Loading Sequence", icon: PackageCheck },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "issues", label: "Issues & Enquiries", icon: MessageSquare },
  { id: "history", label: "Completed Loads", icon: History }
];

export default function LoaderPage() {
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

  const nav = NAV_ITEMS.map(function (item) {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        className={"portal-nav-item " + (section === item.id ? "active" : "")}
        onClick={function () { setSection(item.id); }}
      >
        <Icon size={20} />
        <span>{item.label}</span>
        {item.id === "issues" && stats.openIssues > 0 && (
          <b className="portal-nav-badge">{stats.openIssues}</b>
        )}
      </button>
    );
  });

  return (
    <PortalChrome
      theme="loader-theme"
      product="Loader"
      accent="#f59e0b"
      session={session}
      role="Loader"
      nav={nav}
      notificationCount={stats.openIssues}
      onNotifications={function () { setSection("issues"); }}
      onLogout={signOut}
      contentClassName="loader-content"
    >
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

      {section === "history" && <HistoryView tripStatuses={tripStatuses} />}

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
    </PortalChrome>
  );
}
