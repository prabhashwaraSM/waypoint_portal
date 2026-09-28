// src/auth/auth.js
// PROTOTYPE LOGIN ONLY — credentials are hard-coded in the browser and are not secure.
// Replace with a real authentication service before production use.

const SESSION_KEY = "dispatcher_session";

export const PROTOTYPE_USERS = [
  {
    username: "dispatcher",
    password: "Dispatch@2026",
    name: "Dispatch Officer",
    role: "Dispatcher",
    depot: "Peliyagoda"
  }
];

export function login(username, password) {
  const user = PROTOTYPE_USERS.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );
  if (!user) return null;
  const session = { username: user.username, name: user.name, role: user.role, depot: user.depot, loginAt: new Date().toISOString() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
