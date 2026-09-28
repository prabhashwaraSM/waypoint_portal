import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import { getSession } from "./auth/auth";
import { useLocation } from "react-router-dom";
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

function RequireAuth({ children }) {
  const location = useLocation();
  if (!getSession()) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}