import React, { useState } from "react";
import "../styles/empSidebarPremium.css";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaHome,
  FaUser,
  FaMoneyCheckAlt,
  FaClipboardList,
  FaCalendarCheck,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaRocket
} from "react-icons/fa";

function SidebarEmp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openLeaveMenu, setOpenLeaveMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    Swal.fire({
      title: "Confirm Logout",
      text: "Are you sure you want to end your session?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear(); // Clear all for safety
        Swal.fire({
          title: "Logged Out",
          icon: "success",
          timer: 1000,
          showConfirmButton: false,
        });
        setTimeout(() => navigate("/login/employee"), 1000);
      }
    });
  };

  return (
    <aside className="emp-sidebar-premium">
      <div className="emp-sidebar-header">
        <div className="emp-sidebar-logo">
          <div className="logo-icon"><FaRocket /></div>
          <span>CeiTCS</span>
        </div>
      </div>

      <nav className="emp-nav-list">
        <div className="emp-nav-item">
          <div
            className={`emp-nav-link ${isActive("/employee") ? "active" : ""}`}
            onClick={() => navigate("/employee")}
          >
            <FaHome className="nav-icon" />
            <span>Dashboard</span>
          </div>
        </div>

        <div className="emp-nav-item">
       {/*<div
            className={`emp-nav-link ${isActive("/employee/attendance") ? "active" : ""}`}
            onClick={() => navigate("/employee/attendance")}
          >
            <FaCalendarCheck className="nav-icon" />
            <span>Attendance</span>
          </div> */}
        </div>

        <div className="emp-nav-item">
          <div
            className={`emp-nav-link ${isActive("/employee/apply-leave") ? "active" : ""}`}
            onClick={() => setOpenLeaveMenu(!openLeaveMenu)}
          >
            <FaClipboardList className="nav-icon" />
            <span>Leaves</span>
            {openLeaveMenu ? <FaChevronUp className="chevron" /> : <FaChevronDown className="chevron" />}
          </div>
          {openLeaveMenu && (
            <div className="emp-submenu-container">
              <div
                className="emp-submenu-item"
                onClick={() => navigate("/employee/apply-leave")}
              >
                Apply Leave
              </div>
            </div>
          )}
        </div>

        <div className="emp-nav-item">
          <div
            className={`emp-nav-link ${isActive("/employee/payslips") ? "active" : ""}`}
            onClick={() => navigate("/employee/payslips")}
          >
            <FaMoneyCheckAlt className="nav-icon" />
            <span>Payroll</span>
          </div>
        </div>

        <div className="emp-nav-item">
          <div
            className={`emp-nav-link ${isActive("/employee/profile") ? "active" : ""}`}
            onClick={() => navigate("/employee/profile")}
          >
            <FaUser className="nav-icon" />
            <span>My Profile</span>
          </div>
        </div>
      </nav>

      <div className="emp-logout-area">
        <button className="emp-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default SidebarEmp;
