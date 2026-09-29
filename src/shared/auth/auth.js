// Prototype authentication only. Replace browser-side credentials with backend auth before production.

const SESSION_KEY = "waypoint_session";
const LEGACY_SESSION_KEY = "dispatcher_session";

export const PROTOTYPE_USERS = [
  {
    username: "dispatcher",
    password: "Dispatch@2026",
    name: "Dispatch Officer",
    role: "Dispatcher",
    depot: "Peliyagoda"
  },
  {
    username: "loader",
    password: "Load@2026",
    name: "Warehouse Loader",
    role: "Loader",
    depot: "Peliyagoda"
  },
  {
    username: "driver",
    password: "Driver@2026",
    name: "Mahesh Senanayake",
    role: "Driver",
    depot: "Peliyagoda",
    driverId: "DRV001",
    phone: "072-3530829"
  },
  {
    username: "freshmanager",
    password: "Fresh@2026",
    name: "Fresh Store Manager",
    role: "Store Manager",
    storeType: "fresh",
    brand: "Waypoint Fresh",
    outlet: "Colombo 03"
  },
  {
    username: "stylemanager",
    password: "Style@2026",
    name: "Style Store Manager",
    role: "Store Manager",
    storeType: "style",
    brand: "Waypoint Style",
    outlet: "Wattala"
  },
  {
    username: "techmanager",
    password: "Tech@2026",
    name: "Tech Store Manager",
    role: "Store Manager",
    storeType: "tech",
    brand: "Waypoint Tech",
    outlet: "Colombo 07"
  }
];

export function getRoleHome(session) {
  if (!session) return "/login";
  if (session.role === "Loader") return "/loader";
  if (session.role === "Driver") return "/driver";
  if (session.role === "Store Manager") return "/store-manager";
  return "/dashboard";
}

export function login(username, password) {
  // Ensure inputs exist and are converted safely to strings before operations
  if (!username || !password) return null;

  const cleanUsername = String(username).trim().toLowerCase();
  const cleanPassword = String(password).trim();

  const user = PROTOTYPE_USERS.find(
    (u) => u.username.toLowerCase() === cleanUsername && u.password === cleanPassword
  );
  if (!user) return null;

  const session = {
    username: user.username,
    name: user.name,
    role: user.role,
    depot: user.depot,
    storeType: user.storeType,
    brand: user.brand,
    outlet: user.outlet,
    driverId: user.driverId,
    phone: user.phone,
    loginAt: new Date().toISOString()
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
  return session;
}

export function getSession() {
  try {
    const current = sessionStorage.getItem(SESSION_KEY);
    if (current) return JSON.parse(current);

    const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!legacy) return null;

    const session = JSON.parse(legacy);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return session;
  } catch {
    return null;
  }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(LEGACY_SESSION_KEY);
}