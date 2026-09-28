import React from "react";
import { AlertTriangle, HelpCircle, Send } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { loaderTrips } from "../data/loaderData";
import { statusClass } from "../utils/formatters";

export default function IssuesAndEnquiriesPage(props) {
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
