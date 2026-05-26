// src/components/ProtectedRoute.js
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ role, allowedRole, children }) => {
  if (!role) return <Navigate to="/login/admin" replace />;
  if (role !== allowedRole) return <Navigate to="/login/admin" replace />;
  return children ? children : <Outlet />;
};

export default ProtectedRoute;
