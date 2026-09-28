import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import RequireRole from "./RequireRole";
import { getRoleHome, getSession } from "../shared/auth/auth";

import LoginPage from "../features/auth/pages/LoginPage";

import DispatcherLayout from "../features/dispatcher/layout/DispatcherLayout";
import Dashboard from "../features/dispatcher/pages/Dashboard";
import Stores from "../features/dispatcher/pages/Stores";
import Orders from "../features/dispatcher/pages/Orders";
import OrderApproval from "../features/dispatcher/pages/OrderApproval";
import Inventory from "../features/dispatcher/pages/Inventory";
import Dispatch from "../features/dispatcher/pages/Dispatch";
import Reports from "../features/dispatcher/pages/Reports";
import FleetLayout from "../features/dispatcher/pages/fleet/FleetLayout";
import VehicleInformation from "../features/dispatcher/pages/fleet/VehicleInformation";
import VehicleTracking from "../features/dispatcher/pages/fleet/VehicleTracking";

import LoaderPage from "../features/loader/pages/LoaderPage";

function HomeRedirect() {
  const session = getSession();
  return <Navigate to={getRoleHome(session)} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/loader"
        element={
          <RequireRole role="Loader">
            <LoaderPage />
          </RequireRole>
        }
      />

      <Route
        element={
          <RequireRole role="Dispatcher">
            <DispatcherLayout />
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
