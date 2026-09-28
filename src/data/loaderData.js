export const loaderTrips = [
  {
    id: "TRP-260928-014",
    vehicleId: "VEH014",
    vehicleType: "Reefer Truck",
    vehicleTemp: "Reefer • 0–4°C",
    brand: "Waypoint Fresh",
    district: "Colombo",
    routeCode: "C01",
    tripNo: 1,
    loadingBay: "Bay 03",
    driver: "Kamal Perera",
    plannedDeparture: "05:10",
    planVersion: "v12",
    updatedAt: "04:18",
    status: "Loading",
    capacity: { volume: 15, weight: 3200 },
    load: { volume: 11.2, weight: 2410 },
    stops: [
      {
        sequence: 1,
        outletId: "OUT003",
        outlet: "Waypoint Fresh • Colombo 03",
        window: "06:00–06:35",
        access: "Rear dock",
        items: [
          { sku: "FRZ-001", name: "Chicken Nuggets 1kg", temp: "Frozen", qty: 10, unit: "CTN", zone: "FZ-02", weight: 118, volume: 0.46 },
          { sku: "CHL-012", name: "Fresh Milk 1L", temp: "Chilled", qty: 18, unit: "CRT", zone: "CH-04", weight: 216, volume: 0.72 }
        ]
      },
      {
        sequence: 2,
        outletId: "OUT008",
        outlet: "Waypoint Fresh • Dematagoda",
        window: "06:40–07:05",
        access: "Street",
        items: [
          { sku: "CHL-005", name: "Yogurt 100g", temp: "Chilled", qty: 12, unit: "CTN", zone: "CH-03", weight: 102, volume: 0.38 },
          { sku: "AMB-019", name: "Fresh Vegetables", temp: "Ambient", qty: 5, unit: "CRT", zone: "A-12", weight: 74, volume: 0.42 }
        ]
      },
      {
        sequence: 3,
        outletId: "OUT017",
        outlet: "Waypoint Fresh • Nugegoda",
        window: "07:05–07:25",
        access: "Rear dock",
        items: [
          { sku: "FRZ-002", name: "Ice Cream 2L", temp: "Frozen", qty: 8, unit: "CTN", zone: "FZ-05", weight: 96, volume: 0.54 },
          { sku: "CHL-021", name: "Cheese Slices 200g", temp: "Chilled", qty: 6, unit: "CTN", zone: "CH-07", weight: 44, volume: 0.18 }
        ]
      },
      {
        sequence: 4,
        outletId: "OUT021",
        outlet: "Waypoint Fresh • Maharagama",
        window: "07:20–07:40",
        access: "Street",
        items: [
          { sku: "AMB-032", name: "Rice 5kg", temp: "Ambient", qty: 22, unit: "BAG", zone: "A-04", weight: 110, volume: 0.28 },
          { sku: "AMB-041", name: "Canned Food Mix", temp: "Ambient", qty: 14, unit: "CTN", zone: "A-09", weight: 126, volume: 0.34 }
        ]
      },
      {
        sequence: 5,
        outletId: "OUT026",
        outlet: "Waypoint Fresh • Dehiwala",
        window: "07:30–07:50",
        access: "Rear dock",
        items: [
          { sku: "CHL-031", name: "Butter 200g", temp: "Chilled", qty: 10, unit: "CTN", zone: "CH-06", weight: 66, volume: 0.22 },
          { sku: "AMB-055", name: "Breakfast Cereal", temp: "Ambient", qty: 9, unit: "CTN", zone: "A-14", weight: 48, volume: 0.30 }
        ]
      },
      {
        sequence: 6,
        outletId: "OUT033",
        outlet: "Waypoint Fresh • Rajagiriya",
        window: "07:35–07:55",
        access: "Rear dock",
        items: [
          { sku: "FRZ-011", name: "Frozen Fish 500g", temp: "Frozen", qty: 10, unit: "CTN", zone: "FZ-04", weight: 90, volume: 0.40 },
          { sku: "AMB-062", name: "Bottled Water 1.5L", temp: "Ambient", qty: 18, unit: "CRT", zone: "A-02", weight: 270, volume: 0.62 }
        ]
      }
    ]
  },
  {
    id: "TRP-260928-021",
    vehicleId: "VEH021",
    vehicleType: "Dry-box Truck",
    vehicleTemp: "Ambient",
    brand: "Waypoint Style",
    district: "Gampaha",
    routeCode: "G02",
    tripNo: 1,
    loadingBay: "Bay 06",
    driver: "Niroshan Silva",
    plannedDeparture: "09:00",
    planVersion: "v7",
    updatedAt: "07:42",
    status: "Waiting",
    capacity: { volume: 18, weight: 4200 },
    load: { volume: 14.6, weight: 1910 },
    stops: [
      {
        sequence: 1,
        outletId: "OUT084",
        outlet: "Waypoint Style • Wattala",
        window: "10:00–11:00",
        access: "Mall bay",
        items: [
          { sku: "GAR-104", name: "Men's Shirts • Hanging", temp: "Ambient", qty: 42, unit: "PCS", zone: "G-11", weight: 64, volume: 1.70 },
          { sku: "GAR-223", name: "Women's Dresses • Hanging", temp: "Ambient", qty: 36, unit: "PCS", zone: "G-08", weight: 58, volume: 1.82 }
        ]
      },
      {
        sequence: 2,
        outletId: "OUT087",
        outlet: "Waypoint Style • Ja-Ela",
        window: "11:20–12:10",
        access: "Rear dock",
        items: [
          { sku: "GAR-332", name: "Denim Cartons", temp: "Ambient", qty: 18, unit: "CTN", zone: "G-03", weight: 284, volume: 2.10 },
          { sku: "GAR-410", name: "Footwear Cartons", temp: "Ambient", qty: 14, unit: "CTN", zone: "G-04", weight: 196, volume: 1.66 }
        ]
      },
      {
        sequence: 3,
        outletId: "OUT091",
        outlet: "Waypoint Style • Negombo",
        window: "13:00–14:00",
        access: "Mall bay",
        items: [
          { sku: "GAR-518", name: "Seasonal Collection", temp: "Ambient", qty: 24, unit: "CTN", zone: "G-15", weight: 322, volume: 3.30 }
        ]
      }
    ]
  },
  {
    id: "TRP-260928-028",
    vehicleId: "VEH028",
    vehicleType: "Dry-box Truck",
    vehicleTemp: "Ambient",
    brand: "Waypoint Tech",
    district: "Colombo",
    routeCode: "C05",
    tripNo: 1,
    loadingBay: "Bay 08",
    driver: "Suneth Dias",
    plannedDeparture: "10:30",
    planVersion: "v4",
    updatedAt: "08:50",
    status: "Waiting",
    capacity: { volume: 20, weight: 6000 },
    load: { volume: 8.1, weight: 3680 },
    stops: [
      {
        sequence: 1,
        outletId: "OUT107",
        outlet: "Waypoint Tech • Colombo 07",
        window: "11:30–12:30",
        access: "Rear dock",
        items: [
          { sku: "TEC-701", name: "65-inch LED TV", temp: "Ambient", qty: 8, unit: "UNIT", zone: "T-SEC-01", weight: 304, volume: 2.40 },
          { sku: "TEC-744", name: "Laptop Carton • Sealed", temp: "Ambient", qty: 12, unit: "CTN", zone: "T-SEC-03", weight: 168, volume: 0.92 }
        ]
      },
      {
        sequence: 2,
        outletId: "OUT111",
        outlet: "Waypoint Tech • Bambalapitiya",
        window: "13:00–14:00",
        access: "Street",
        items: [
          { sku: "TEC-822", name: "Washing Machine 8kg", temp: "Ambient", qty: 5, unit: "UNIT", zone: "T-HEAVY-02", weight: 345, volume: 2.75 }
        ]
      },
      {
        sequence: 3,
        outletId: "OUT115",
        outlet: "Waypoint Tech • Dehiwala",
        window: "14:20–15:15",
        access: "Rear dock",
        items: [
          { sku: "TEC-901", name: "Refrigerator 320L", temp: "Ambient", qty: 4, unit: "UNIT", zone: "T-HEAVY-04", weight: 292, volume: 2.03 }
        ]
      }
    ]
  },
  {
    id: "TRP-260928-032",
    vehicleId: "VEH032",
    vehicleType: "Reefer Van",
    vehicleTemp: "Reefer • 0–4°C",
    brand: "Waypoint Fresh",
    district: "Colombo",
    routeCode: "C-VAN-02",
    tripNo: 2,
    loadingBay: "Bay 02",
    driver: "Pradeep Mendis",
    plannedDeparture: "06:10",
    planVersion: "v9",
    updatedAt: "04:55",
    status: "Ready",
    capacity: { volume: 7, weight: 1600 },
    load: { volume: 5.9, weight: 1310 },
    stops: [
      {
        sequence: 1,
        outletId: "OUT040",
        outlet: "Waypoint Fresh • Fort",
        window: "06:45–07:10",
        access: "Van only",
        items: [
          { sku: "CHL-044", name: "Dairy Mixed Crates", temp: "Chilled", qty: 12, unit: "CRT", zone: "CH-02", weight: 188, volume: 0.68 }
        ]
      },
      {
        sequence: 2,
        outletId: "OUT043",
        outlet: "Waypoint Fresh • Pettah",
        window: "07:10–07:35",
        access: "Van only",
        items: [
          { sku: "FRZ-018", name: "Frozen Mixed Cartons", temp: "Frozen", qty: 8, unit: "CTN", zone: "FZ-01", weight: 96, volume: 0.55 }
        ]
      }
    ]
  }
];

export const loaderInventory = [
  { sku: "FRZ-001", item: "Chicken Nuggets 1kg", category: "Frozen", zone: "FZ-02", onHand: 7, allocated: 10, unit: "CTN", status: "Short" },
  { sku: "FRZ-002", item: "Ice Cream 2L", category: "Frozen", zone: "FZ-05", onHand: 31, allocated: 8, unit: "CTN", status: "Available" },
  { sku: "CHL-005", item: "Yogurt 100g", category: "Chilled", zone: "CH-03", onHand: 68, allocated: 12, unit: "CTN", status: "Available" },
  { sku: "CHL-012", item: "Fresh Milk 1L", category: "Chilled", zone: "CH-04", onHand: 44, allocated: 18, unit: "CRT", status: "Available" },
  { sku: "AMB-019", item: "Fresh Vegetables", category: "Ambient", zone: "A-12", onHand: 17, allocated: 5, unit: "CRT", status: "Available" },
  { sku: "GAR-104", item: "Men's Shirts • Hanging", category: "Garments", zone: "G-11", onHand: 58, allocated: 42, unit: "PCS", status: "Available" },
  { sku: "GAR-518", item: "Seasonal Collection", category: "Garments", zone: "G-15", onHand: 29, allocated: 24, unit: "CTN", status: "Available" },
  { sku: "TEC-701", item: "65-inch LED TV", category: "Electronics", zone: "T-SEC-01", onHand: 8, allocated: 8, unit: "UNIT", status: "Allocated" },
  { sku: "TEC-901", item: "Refrigerator 320L", category: "Electronics", zone: "T-HEAVY-04", onHand: 11, allocated: 4, unit: "UNIT", status: "Available" }
];

export const initialLoaderIssues = [
  {
    id: "ISS-260928-004",
    time: "04:07",
    tripId: "TRP-260928-014",
    vehicleId: "VEH014",
    outlet: "Waypoint Fresh • Colombo 03",
    sku: "FRZ-001",
    item: "Chicken Nuggets 1kg",
    expected: 10,
    available: 7,
    unit: "CTN",
    reason: "Missing in warehouse",
    status: "Awaiting dispatcher",
    priority: "High",
    note: "3 cartons short at frozen pick face FZ-02."
  }
];

export const initialLoaderEnquiries = [
  {
    id: "ENQ-260928-002",
    time: "03:58",
    tripId: "TRP-260928-014",
    subject: "Loading bay confirmation",
    message: "Dispatcher confirmed VEH014 remains on Bay 03 after route update v12.",
    status: "Resolved"
  }
];

export function allTripItems(trip) {
  return trip.stops.flatMap((stop) =>
    stop.items.map((item) => ({ ...item, stopSequence: stop.sequence, outlet: stop.outlet, outletId: stop.outletId }))
  );
}

export function tripTotals(trip) {
  const items = allTripItems(trip);
  return {
    itemLines: items.length,
    units: items.reduce((sum, item) => sum + item.qty, 0),
    stops: trip.stops.length,
    volumePct: Math.round((trip.load.volume / trip.capacity.volume) * 100),
    weightPct: Math.round((trip.load.weight / trip.capacity.weight) * 100)
  };
}
