export const storeProfiles = {
  fresh: {
    key: "fresh",
    brand: "Waypoint Fresh",
    label: "Fresh Store",
    outlet: "Colombo 03",
    outletId: "OUT003",
    manager: "Fresh Store Manager",
    service: "Daily delivery • before 8:00 AM",
    accent: "green",
    dashboard: {
      deliveryToday: 2,
      pending: 3,
      deferred: 1,
      stockAlert: 2
    },
    products: [
      { id: "f1", name: "Fresh Milk 1L", category: "Chilled", price: 350, unit: "CRT", available: 44 },
      { id: "f2", name: "Butter 200g", category: "Chilled", price: 450, unit: "CTN", available: 31 },
      { id: "f3", name: "Frozen Chicken 1kg", category: "Frozen", price: 1200, unit: "CTN", available: 22 },
      { id: "f4", name: "Cheese Block 200g", category: "Chilled", price: 600, unit: "CTN", available: 18 },
      { id: "a1", name: "Carrot 1kg", category: "Ambient", price: 250, unit: "KG", available: 3 },
      { id: "a2", name: "Big Onion 1kg", category: "Ambient", price: 150, unit: "KG", available: 28 },
      { id: "a3", name: "Tomato 1kg", category: "Ambient", price: 120, unit: "KG", available: 24 },
      { id: "a4", name: "Sliced Bread 450g", category: "Ambient", price: 220, unit: "PCS", available: 16 }
    ],
    vehicleNote: "Chilled / frozen orders require reefer capacity.",
    upcomingDelivery: {
      id: "ORD-1025",
      status: "In Transit",
      eta: "07:35",
      vehicle: "V-102",
      trip: "Trip 1",
      planVersion: "v12",
      items: [
        { id: "milk", name: "Fresh Milk", expected: 100, unit: "L", priority: true },
        { id: "carrot", name: "Carrot", expected: 50, unit: "KG", priority: false }
      ]
    }
  },
  style: {
    key: "style",
    brand: "Waypoint Style",
    label: "Style Store",
    outlet: "Wattala",
    outletId: "OUT084",
    manager: "Style Store Manager",
    service: "Weekly delivery • mall / outlet windows",
    accent: "green",
    dashboard: {
      deliveryToday: 1,
      pending: 4,
      deferred: 1,
      stockAlert: 3
    },
    products: [
      { id: "s1", name: "Cotton T-Shirt (M/L)", category: "Garment", price: 1850, unit: "PCS", available: 12 },
      { id: "s2", name: "Men's Shirt • Hanging", category: "Hanging", price: 2650, unit: "PCS", available: 20 },
      { id: "s3", name: "Women's Dress • Hanging", category: "Hanging", price: 4200, unit: "PCS", available: 9 },
      { id: "s4", name: "Denim Jeans Carton", category: "Carton", price: 18500, unit: "CTN", available: 6 },
      { id: "s5", name: "Footwear Carton", category: "Carton", price: 22400, unit: "CTN", available: 4 }
    ],
    vehicleNote: "Protect hanging garments and respect fixed mall receiving windows.",
    upcomingDelivery: {
      id: "STY-9017",
      status: "Scheduled",
      eta: "10:30",
      vehicle: "VEH021",
      trip: "Trip 1",
      planVersion: "v7",
      items: [
        { id: "shirts", name: "Men's Shirts • Hanging", expected: 42, unit: "PCS", priority: true },
        { id: "denim", name: "Denim Cartons", expected: 18, unit: "CTN", priority: false }
      ]
    }
  },
  tech: {
    key: "tech",
    brand: "Waypoint Tech",
    label: "Tech Store",
    outlet: "Colombo 07",
    outletId: "OUT107",
    manager: "Tech Store Manager",
    service: "As needed • high-value / fragile deliveries",
    accent: "green",
    dashboard: {
      deliveryToday: 1,
      pending: 2,
      deferred: 0,
      stockAlert: 2
    },
    products: [
      { id: "t1", name: "MSI Cyborg 15 Laptop", category: "Computing", price: 425000, unit: "UNIT", available: 5 },
      { id: "t2", name: "65-inch LED TV", category: "Display", price: 289000, unit: "UNIT", available: 8 },
      { id: "t3", name: "Arduino Nano V3.0", category: "Components", price: 3400, unit: "UNIT", available: 4 },
      { id: "t4", name: "Raspberry Pi 4 Model B", category: "Components", price: 28500, unit: "UNIT", available: 1 },
      { id: "t5", name: "Washing Machine 8kg", category: "Appliance", price: 179000, unit: "UNIT", available: 7 }
    ],
    vehicleNote: "Fragile and high-value items require controlled handling and serial verification.",
    upcomingDelivery: {
      id: "TEC-4421",
      status: "Scheduled",
      eta: "11:45",
      vehicle: "VEH028",
      trip: "Trip 1",
      planVersion: "v4",
      items: [
        { id: "tv", name: "65-inch LED TV", expected: 8, unit: "UNIT", priority: true },
        { id: "laptop", name: "Laptop Carton • Sealed", expected: 12, unit: "CTN", priority: true }
      ]
    }
  }
};

export const recentOrders = {
  fresh: [
    { id: "ORD-9012", status: "Completed", detail: "Fresh replenishment" },
    { id: "ORD-9013", status: "Pending", detail: "Ambient grocery top-up" },
    { id: "ORD-9014", status: "Cancelled", detail: "Duplicate request" }
  ],
  style: [
    { id: "STY-9002", status: "Completed", detail: "Weekly garment replenishment" },
    { id: "STY-9003", status: "Pending", detail: "Seasonal collection" },
    { id: "STY-9004", status: "Deferred", detail: "Next mall access window" }
  ],
  tech: [
    { id: "TEC-4408", status: "Completed", detail: "Consumer electronics" },
    { id: "TEC-4412", status: "Pending", detail: "High-value replenishment" },
    { id: "TEC-4419", status: "Pending", detail: "Appliance delivery" }
  ]
};

export const initialWastageRows = [
  { id: "milk", item: "Fresh Milk", unit: "L", arrived: 80, sold: 70, wastage: 2 },
  { id: "lettuce", item: "Lettuce", unit: "KG", arrived: 35, sold: 30, wastage: 2 },
  { id: "carrot", item: "Carrot", unit: "KG", arrived: 45, sold: 35, wastage: 3 }
];

export function getStoreProfile(storeType) {
  return storeProfiles[storeType] || storeProfiles.fresh;
}
