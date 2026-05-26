import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import RoleSelection from "./pages/login/RoleSelection";   // ⭐ NEW FILE ADDED

import AdminLogin from "./pages/login/AdminLogin";
import EmployeeLogin from "./pages/login/EmployeeLogin";
import EmployeeSignup from "./pages/login/EmployeeSignup";

import AdminLayout from "./layouts/AdminLayout";
import EmpLayout from "./layouts/EmpLayout";

import AdminDashboard from "./pages/admin/AdminDashboard";
import EmpDashboard from "./pages/employee/EmpDashboard";
import AttendanceDashboard from "./pages/employee/AttendanceDashboard";
import EmpLeave from "./pages/employee/EmpLeave";
import EmpPayroll from "./pages/employee/MonthlyPayroll";
import EmpProfile from "./pages/employee/EmpProfile";
import EditEmployeeProfile from "./pages/employee/EditEmployeeProfile";

import ProtectedRoute from "./components/ProtectedRoute";

import AdminForgotPassword from "./pages/admin/AdminForgotPassword";
import AdminResetPassword from "./pages/admin/AdminResetPassword";

import EmployeeForgotPassword from "./pages/employee/EmployeeForgotPassword";
import EmployeeResetPassword from "./pages/employee/EmployeeResetPassword";

import EmployeeList from "./pages/admin/EmployeeList";
import Departments from "./pages/admin/Departments";
import MonthlyPayroll from "./pages/admin/MonthlyPayroll";
import OnsiteEmployees from "./pages/admin/OnsiteEmployees";
import AttendancePage from "./pages/admin/AttendancePage";
import LeaveApprovals from "./pages/admin/LeaveApprovals";

import ReportsAnalytics from "./pages/admin/ReportsAnalytics";


function App() {
  const [role, setRole] = useState(localStorage.getItem("role"));

  useEffect(() => {
    if (role) localStorage.setItem("role", role);
    else localStorage.removeItem("role");
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem("role");
    setRole(null);
    window.location.href = "/login/admin";
  };

  return (
    <Routes>
      {/* ⭐ Default route is Role Selection page */}
      <Route path="/" element={<RoleSelection />} />

      {/* Signup Routes */}
      <Route path="/signup/employee" element={<EmployeeSignup />} />

      {/* Login Routes */}
      <Route path="/login/admin" element={<AdminLogin setRole={setRole} />} />
      <Route path="/login/employee" element={<EmployeeLogin setRole={setRole} />} />

      {/* Admin Forgot/Reset Password */}
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
     <Route
  path="/reset-password/admin/:token"
  element={<AdminResetPassword />}
/>


      {/* Employee Forgot/Reset Password */}
      <Route path="/forgot-password/employee" element={<EmployeeForgotPassword />} />
      <Route path="/employee/reset-password/:token" element={<EmployeeResetPassword />} />

      {/* ADMIN PROTECTED ROUTES */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role={role} allowedRole="admin">
            <AdminLayout onLogout={handleLogout} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="employees" element={<EmployeeList />} />
        <Route path="departments" element={<Departments />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="monthly-payroll" element={<MonthlyPayroll />} />
        <Route path="onsite" element={<OnsiteEmployees />} />
        <Route path="leave-approvals" element={<LeaveApprovals />} />
        <Route path="reports-analytics" element={<ReportsAnalytics />} />

      </Route>

      {/* EMPLOYEE PROTECTED ROUTE */}
      <Route
        path="/employee"
        element={
          <ProtectedRoute role={role} allowedRole="employee">
            <EmpLayout onLogout={handleLogout} />
          </ProtectedRoute>
        }
      >
        <Route index element={<EmpDashboard />} />
        <Route path="attendance" element={<AttendanceDashboard />} />
        <Route path="apply-leave" element={<EmpLeave />} />
        <Route path="payslips" element={<EmpPayroll />} />
        <Route path="profile" element={<EmpProfile />} />
        <Route path="profile/edit" element={<EditEmployeeProfile />} />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={<h2 style={{ textAlign: "center", marginTop: "50px" }}>404 - Page Not Found</h2>}
      />
    </Routes>
  );
}

export default App;
