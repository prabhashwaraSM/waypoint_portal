import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import RequireRole from "./RequireRole";
import { getRoleHome, getSession } from "../shared/auth/auth";

import { LoginPage } from "../features/auth";
import {
  DispatcherLayout,
  Dashboard,
  Stores,
  Orders,
  OrderApproval,
  Inventory,
  Dispatch,
  Reports,
  FleetLayout,
  VehicleInformation,
  VehicleTracking,
  DriverNotifications,
  ShortagesDelays
} from "../features/dispatcher";
import { LoaderPage } from "../features/loader";
import { StoreManagerPage } from "../features/store-manager";

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
        path="/store-manager"
        element={
          <RequireRole role="Store Manager">
            <StoreManagerPage />
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
        <Route path="/orders" element={<OrderApproval />} />
        <Route path="/approval" element={<OrderApproval />} />
        <Route path="/allocation" element={<OrderApproval />} />

        <Route path="/inventory" element={<Navigate to="/inventory/store" replace />} />
        <Route path="/inventory/store" element={<Inventory view="store" />} />
        <Route path="/inventory/warehouse" element={<Inventory view="warehouse" />} />

        <Route path="/dispatch" element={<Navigate to="/dispatch/plan" replace />} />
        <Route path="/dispatch/plan" element={<Dispatch />} />
        <Route path="/dispatch/shortages" element={<ShortagesDelays />} />

        <Route path="/reports" element={<Reports />} />
        <Route path="/fleet" element={<FleetLayout />}>
          <Route index element={<Navigate to="vehicles" replace />} />
          <Route path="vehicles" element={<VehicleInformation />} />
          <Route path="tracking" element={<VehicleTracking />} />
          <Route path="driver-notifications" element={<DriverNotifications />} />
        </Route>
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
