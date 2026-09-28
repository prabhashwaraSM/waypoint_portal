import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ShieldCheck, Boxes, Truck, Smartphone, Store } from "lucide-react";
import Logo from "../../../shared/components/Logo";
import { getRoleHome, getSession, login } from "../../../shared/auth/auth";
import "../styles/login.css";

const rolePreview = [
  { name: "Dispatcher", icon: Truck, status: "Available", tone: "dispatcher" },
  { name: "Loader", icon: Boxes, status: "Available", tone: "loader" },
  { name: "Driver", icon: Smartphone, status: "Next phase", tone: "driver" },
  { name: "Store Manager", icon: Store, status: "Available", tone: "store" }
];

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const existingSession = getSession();
  if (existingSession) return <Navigate to={getRoleHome(existingSession)} replace />;

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

    navigate(getRoleHome(session), { replace: true });
  };

  return (
    <div className="login-page waypoint-login">
      <section className="login-brand waypoint-login-brand">
        <Logo size={48} subtitle="Unified Operations Portal" product="Portal" />

        <div className="login-brand-copy">
          <span className="login-eyebrow">WAREHOUSE DELIVERY PLANNING</span>
          <h1>One portal. Four roles. One delivery flow.</h1>
          <p>
            Sign in once and Waypoint automatically opens the workspace assigned to your role.
            Dispatcher planning, Loader dock execution and Store Manager receiving stay separate while sharing the same delivery workflow.
          </p>

          <div className="role-preview-grid">
            {rolePreview.map(({ name, icon: Icon, status, tone }) => (
              <div className={"role-preview-card " + tone} key={name}>
                <Icon size={19} />
                <div>
                  <strong>{name}</strong>
                  <small>{status}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="login-flow-strip" aria-hidden="true">
          <span>Plan</span><i>→</i><span>Load</span><i>→</i><span>Deliver</span><i>→</i><span>Receive</span>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card waypoint-login-card" onSubmit={submit} noValidate>
          <div className="login-card-badge"><ShieldCheck size={16} /> Secure role access</div>
          <h2>Welcome back</h2>
          <p className="login-sub">Use your Waypoint operational account to continue.</p>

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

          <button type="submit" className="login-btn waypoint-login-btn">
            <LogIn size={17} /> Sign in to workspace
          </button>

          <p className="login-role">
            <ShieldCheck size={15} /> Your workspace is selected automatically from your account role.
          </p>
        </form>
        <p className="login-foot">Prototype build. Authentication will be connected to the backend later.</p>
      </section>
    </div>
  );
}
