import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";
import Logo from "../components/Logo";
import { getSession, login } from "../auth/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  if (getSession()) return <Navigate to="/dashboard" replace />;

  const submit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    const session = login(username, password);
    if (!session) {
      setError("Username or password is incorrect. Check the details and try again.");
      return;
    }
    navigate(location.state?.from || "/dashboard", { replace: true });
  };

  return (
    <div className="login-page">
      <section className="login-brand">
        <Logo size={48} subtitle="Waypoint Group PVT LTD" />
        <div className="login-brand-copy">
          <h1>Plan the route. Load the truck. Track every drop.</h1>
          <p>Dispatch control for Waypoint Fresh, Style and Tech deliveries from the Peliyagoda and Kandy depots.</p>
        </div>
        <svg className="login-route" viewBox="0 0 400 180" aria-hidden="true">
          <path d="M20 150 C 90 150, 80 60, 160 70 S 250 140, 300 90 S 360 30, 380 30" />
          <circle cx="20" cy="150" r="7" />
          <circle cx="160" cy="70" r="5" />
          <circle cx="300" cy="90" r="5" />
          <circle cx="380" cy="30" r="7" />
        </svg>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit} noValidate>
          <h2>Sign in</h2>
          <p className="login-sub">Use your dispatcher account to continue.</p>

          <label className="login-field">
            <span>Username</span>
            <input
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              placeholder="Enter username"
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <div className="login-password">
              <input
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter password"
              />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="login-btn">
            <LogIn size={17} /> Sign in
          </button>

          <p className="login-role">
            <ShieldCheck size={15} /> Access level: <b>Dispatcher</b>
          </p>
        </form>
        <p className="login-foot">Prototype build. Sign-in is for demonstration only.</p>
      </section>
    </div>
  );
}
