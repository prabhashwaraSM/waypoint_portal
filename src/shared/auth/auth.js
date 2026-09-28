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
  if (session.role === "Store Manager") return "/store-manager";
  return "/dashboard";
}

export function login(username, password) {
  const user = PROTOTYPE_USERS.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
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
