import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import { getRoleHome, getSession } from "./auth/auth";
import Dashboard from "./pages/Dashboard";
import Stores from "./pages/Stores";
import Inventory from "./pages/Inventory";
import Orders from "./pages/Orders";
import OrderApproval from "./pages/OrderApproval";
import Dispatch from "./pages/Dispatch";
import Reports from "./pages/Reports";
import FleetLayout from "./pages/fleet/FleetLayout";
import VehicleInformation from "./pages/fleet/VehicleInformation";
import VehicleTracking from "./pages/fleet/VehicleTracking";
import LoaderEntry from "./pages/loader/LoaderEntry";

function RequireRole({ role, children }) {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (role && session.role !== role) {
    return <Navigate to={getRoleHome(session)} replace />;
  }

  return children;
}

function HomeRedirect() {
  const session = getSession();
  return <Navigate to={getRoleHome(session)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/loader"
        element={
          <RequireRole role="Loader">
            <LoaderEntry />
          </RequireRole>
        }
      />

      <Route
        element={
          <RequireRole role="Dispatcher">
            <Layout />
          </RequireRole>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/approval" element={<OrderApproval />} />
        <Route path="/allocation" element={<OrderApproval />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/dispatch" element={<Dispatch />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/fleet" element={<FleetLayout />}>
          <Route index element={<Navigate to="vehicles" replace />} />
          <Route path="vehicles" element={<VehicleInformation />} />
          <Route path="tracking" element={<VehicleTracking />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
