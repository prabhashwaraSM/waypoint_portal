# Loader feature

Owns the warehouse Loader experience.

Folders:
- `pages/` — Overview, Loading Plan, Loading Sequence, Inventory Lookup, Issues & Enquiries, and Completed Loads.
- `components/` — Loader-only reusable UI such as the issue modal and page header.
- `data/` — Loader prototype/operational data.
- `styles/` — Responsive Loader UI.
- `utils/` — Loader formatting helpers.

Recommended branch: `loader`.

The Loader executes Dispatcher-assigned trips and should not contain Dispatcher allocation logic.
