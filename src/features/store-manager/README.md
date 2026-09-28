# Store Manager feature

Owns the outlet-side Waypoint Store Manager experience.

The original source prototype contained three store variants: Fresh, Cloth, and Tech. In the integrated Waypoint portal, Cloth is presented as **Waypoint Style** so the naming matches the wider project.

## Screens preserved from the source prototype

### Waypoint Fresh
- Dashboard
- Place Order
- Receive Delivery
- Daily Wastage & Smart Forecast

### Waypoint Style
- Dashboard
- Place Order
- Receive Order / MRN
- Store Adjustments & Losses

### Waypoint Tech
- Dashboard
- Place Order
- Receive Delivery / GRN
- Hardware Adjustments & RMAs

## Folder ownership

- `pages/` — role screens
- `components/` — Store Manager only reusable UI
- `data/` — Store Manager mock / prototype data
- `styles/` — responsive Store Manager styling

Recommended feature branch: `stock-manager`.

Shared login/session code stays under `src/shared/auth/`.
