# Update: login, logo, order report, dispatch details

## Prototype login
Run `npm run dev`; the app opens on the login page.

- Username: `dispatcher`
- Password: `Dispatch@2026`

The session lasts until the browser tab is closed or you click the sign-out icon (top right).
Credentials are in `src/auth/auth.js`. This is a demo login only and is not secure.

## Logo and role
New Waypoint Dispatcher logo (`src/components/Logo.jsx`, also used as the browser tab icon)
at the top left, with the signed-in role (Dispatcher) under it and in the top bar.

## Reports: Order Dispatch Report
One row per order (all 1,500 orders) showing main warehouse, store, customer/agent, dispatch
type, invoice number, dispatch date, assigned vehicle, driver, goods, load and status.
Filter by status, brand, warehouse, district, dispatch type, vehicle assignment and date range.
Click a row for the full order report (printable). Export CSV or print the filtered report.

## Dispatch page
When dispatching you now set: dispatch type (order type), customer or agent, invoice number,
dispatch date and time, vehicle (with vehicle details) and driver (with driver details).
A dispatch note is shown for review, then saved. Saved dispatches appear in Reports and on
Fleet > Vehicle Tracking. The vehicle list only shows vehicles from the orders' warehouse,
and vehicles in the workshop cannot be used.

## New data files (public/)
drivers.csv, agents_customers.csv, order_dispatch_records.csv (dispatch history for
orders that are loading, dispatched, in transit or delivered).
