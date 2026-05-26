import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/sidebar.css";
import {
  FaTachometerAlt,
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaBell,
  FaCog,
  FaSignOutAlt,
  FaUserCog,
} from "react-icons/fa";

const AdminLayout = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ FIXED: supports nested paths
  const getActiveClass = (path) =>
    location.pathname.startsWith(path) ? "active" : "";

  // ✅ Logout with confirmation popup
  const handleLogout = () => {
    Swal.fire({
      title: "Logout Confirmation",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        if (onLogout) onLogout();
        navigate("/login/admin");
      }
    });
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <h2 className="sidebar-title">CeiTCS Admin</h2>

        <nav className="sidebar-nav">
          <ul>
            <li
              className={getActiveClass("/admin/dashboard")}
              onClick={() => navigate("/admin/dashboard")}
            >
              <FaTachometerAlt /> <span>Dashboard</span>
            </li>

            <li
              className={getActiveClass("/admin/employees")}
              onClick={() => navigate("/admin/employees")}
            >
              <FaUsers /> <span>Employees</span>
            </li>

            <li
              className={getActiveClass("/admin/leave-approvals")}
              onClick={() => navigate("/admin/leave-approvals")}
            >
              <FaChartLine /> <span>Leave Approvals</span>
            </li>

            <li
              className={getActiveClass("/admin/monthly-payroll")}
              onClick={() => navigate("/admin/monthly-payroll")}
            >
              <FaMoneyBillWave /> <span>Payroll</span>
            </li>

            <li
              className={getActiveClass("/admin/onsite")}
              onClick={() => navigate("/admin/onsite")}
            >
              <FaBell /> <span>Onsite</span>
            </li>

            <li
              className={getActiveClass("/admin/reports-analytics")}
              onClick={() => navigate("/admin/reports-analytics")}
            >
              <FaUserCog /> <span>Reports</span>
            </li>


          </ul>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> <span>Logout</span>
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
