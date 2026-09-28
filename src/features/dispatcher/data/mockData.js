// src/data/mockData.js

export const brands = [
  { id: "Waypoint Fresh", name: "Waypoint Fresh" },
  { id: "Waypoint Style", name: "Waypoint Style" },
  { id: "Waypoint Tech", name: "Waypoint Tech" }
];

export const warehouses = [
  { id: "Peliyagoda", name: "Peliyagoda Depot" },
  { id: "Kandy", name: "Kandy Depot" }
];

export const brandDashboard = {
  "Waypoint Fresh": {
    pendingDispatch: 12,
    pendingApproval: 4,
    orders: [
      { id: "ORD-A1042", store: "Colombo 01", product: "Garments", status: "Pending Dispatch", time: "09:42" },
      { id: "ORD-A1041", store: "Gampaha 02", product: "Electronics", status: "Approved", time: "09:35" },
      { id: "ORD-A1040", store: "Negombo 01", product: "Garments", status: "Allocated", time: "09:21" },
      { id: "ORD-A1039", store: "Kandy 03", product: "Fresh Food", status: "Dispatched", time: "09:15" }
    ]
  },
  "Waypoint Style": {
    pendingDispatch: 8,
    pendingApproval: 7,
    orders: [
      { id: "ORD-B2088", store: "Kandy 03", product: "Electronics", status: "Pending Dispatch", time: "09:39" },
      { id: "ORD-B2087", store: "Matale 01", product: "Garments", status: "Pending Approval", time: "09:28" },
      { id: "ORD-B2086", store: "Kurunegala 02", product: "Fresh Food", status: "Allocated", time: "09:18" },
      { id: "ORD-B2085", store: "Colombo 04", product: "Electronics", status: "Dispatched", time: "09:04" }
    ]
  },
  "Waypoint Tech": {
    pendingDispatch: 15,
    pendingApproval: 3,
    orders: [
      { id: "ORD-C3017", store: "Jaffna 01", product: "Fresh Food", status: "Pending Dispatch", time: "09:44" },
      { id: "ORD-C3016", store: "Vavuniya 02", product: "Garments", status: "Pending Approval", time: "09:31" },
      { id: "ORD-C3015", store: "Kandy 02", product: "Electronics", status: "Allocated", time: "09:17" },
      { id: "ORD-C3014", store: "Galle 01", product: "Garments", status: "Dispatched", time: "08:58" }
    ]
  }
};

// Fleet is shared across all brands as requested.
export const fleet = [
  { id: "V-07", type: "Truck", driver: "Kasun Perera", status: "In Transit", shipment: "SHP-1023", destination: "Colombo", temp: "Normal", progress: 68, lat: 6.9271, lng: 79.8612 },
  { id: "V-12", type: "Reefer Van", driver: "Nimal Silva", status: "In Transit", shipment: "SHP-1024", destination: "Gampaha", temp: "Reefer", progress: 46, lat: 7.0840, lng: 80.0098 },
  { id: "V-03", type: "Truck", driver: "Amal Fernando", status: "Delayed", shipment: "SHP-1025", destination: "Kandy", temp: "Normal", progress: 31, lat: 7.2906, lng: 80.6337 },
  { id: "V-09", type: "Van", driver: "Ruwan Jayasuriya", status: "Available", shipment: "—", destination: "—", temp: "Normal", progress: 0, lat: 6.9550, lng: 79.8737 }
];

export const alerts = [
  { id: 1, severity: "critical", vehicle: "V-07", title: "Vehicle temperature rising", detail: "Driver reported a temperature warning.", time: "2 min ago" },
  { id: 2, severity: "warning", vehicle: "V-12", title: "Traffic delay reported", detail: "Driver reports heavy traffic on route.", time: "8 min ago" },
  { id: 3, severity: "info", vehicle: "V-03", title: "Shipment delayed", detail: "ETA has moved by approximately 25 minutes.", time: "15 min ago" }
];

export const fleetSummary = {
  total: 24,
  available: 9,
  inTransit: 11,
  maintenance: 2,
  offline: 2
};

// Legacy/shared datasets used by the detailed pages.
// These are temporary mock values and will later be replaced by the project CSV data.
export const stores = [
  { id: "ST-001", name: "Colombo 01", grade: "A", demand: 100, stock: 25, preAllocated: 75, sales: 1850000 },
  { id: "ST-002", name: "Gampaha 02", grade: "A", demand: 90, stock: 30, preAllocated: 60, sales: 1620000 },
  { id: "ST-003", name: "Kandy 03", grade: "B", demand: 80, stock: 25, preAllocated: 55, sales: 1340000 },
  { id: "ST-004", name: "Negombo 01", grade: "B", demand: 70, stock: 20, preAllocated: 50, sales: 1180000 },
  { id: "ST-005", name: "Matale 01", grade: "C", demand: 55, stock: 15, preAllocated: 40, sales: 870000 },
  { id: "ST-006", name: "Kurunegala 02", grade: "C", demand: 60, stock: 18, preAllocated: 42, sales: 920000 },
  { id: "ST-007", name: "Jaffna 01", grade: "D", demand: 45, stock: 10, preAllocated: 25, sales: 610000 },
  { id: "ST-008", name: "Vavuniya 02", grade: "D", demand: 40, stock: 8, preAllocated: 22, sales: 540000 }
];

export const products = [
  { id: "P-001", name: "Garment Pack A", category: "Garments", stock: 750, demand: 1000, incoming: 300 },
  { id: "P-002", name: "Garment Pack B", category: "Garments", stock: 620, demand: 700, incoming: 180 },
  { id: "P-003", name: "Electronics Unit A", category: "Electronics", stock: 420, demand: 500, incoming: 120 },
  { id: "P-004", name: "Fresh Food Crate", category: "Fresh Food", stock: 280, demand: 450, incoming: 200 },
  { id: "P-005", name: "Electronics Unit B", category: "Electronics", stock: 350, demand: 400, incoming: 100 }
];

export const orders = [
  { id: "ORD-A1042", store: "Colombo 01", product: "Garment Pack A", qty: 75, status: "Pending Dispatch", date: "2026-09-26" },
  { id: "ORD-A1041", store: "Gampaha 02", product: "Electronics Unit A", qty: 40, status: "Approved", date: "2026-09-26" },
  { id: "ORD-B2088", store: "Kandy 03", product: "Electronics Unit B", qty: 35, status: "Pending Dispatch", date: "2026-09-26" },
  { id: "ORD-B2087", store: "Matale 01", product: "Garment Pack B", qty: 30, status: "Pending Approval", date: "2026-09-26" },
  { id: "ORD-C3017", store: "Jaffna 01", product: "Fresh Food Crate", qty: 25, status: "Pending Dispatch", date: "2026-09-26" },
  { id: "ORD-C3016", store: "Vavuniya 02", product: "Garment Pack A", qty: 20, status: "Pending Approval", date: "2026-09-26" }
];
