import React from "react";
import { MessageSquare, Search } from "lucide-react";
import PageHeader from "../components/PageHeader";

export default function LoaderInventoryPage({ rows, search, setSearch, onOpenIssues }) {
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
                    <td data-label="SKU"><b>{row.sku}</b></td>
                    <td data-label="Item">{row.item}</td>
                    <td data-label="Category"><span className={"loader-temp " + row.category.toLowerCase()}>{row.category}</span></td>
                    <td data-label="Pick zone"><b>{row.zone}</b></td>
                    <td data-label="On hand">{row.onHand} {row.unit}</td>
                    <td data-label="Allocated today">{row.allocated} {row.unit}</td>
                    <td data-label="Balance"><b>{row.onHand - row.allocated} {row.unit}</b></td>
                    <td data-label="Status"><b className={"loader-inventory-status " + row.status.toLowerCase()}>{row.status}</b></td>
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
