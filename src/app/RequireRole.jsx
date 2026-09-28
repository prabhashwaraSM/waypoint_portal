import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getRoleHome, getSession } from "../shared/auth/auth";

export default function RequireRole({ role, children }) {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (role && session.role !== role) {
    return <Navigate to={getRoleHome(session)} replace />;
  }

  return children;
}
