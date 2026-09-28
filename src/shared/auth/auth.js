// src/auth/auth.js
// PROTOTYPE LOGIN ONLY — credentials are hard-coded in the browser and are not secure.
// Replace with a real authentication service before production use.

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
  }
];

export function getRoleHome(session) {
  if (!session) return "/login";
  return session.role === "Loader" ? "/loader" : "/dashboard";
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

    // Keep old dispatcher sessions working after this UI update.
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
