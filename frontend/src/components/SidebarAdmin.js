import React from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/sidebar.css";

const SidebarAdmin = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        Swal.fire({
          title: "Logged Out",
          text: "You have been logged out successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        navigate("/login/admin");
      }
    });
  };

  return (
    <div className="sidebar">
      <h2 className="logo">Admin Panel</h2>

      <ul className="menu-list">
        <li onClick={() => navigate("/admin/dashboard")}>
          Dashboard
        </li>
        <li onClick={() => navigate("/admin/employees")}>
          Manage Employees
        </li>
        <li onClick={() => navigate("/admin/reports-analytics")}>
          Reports
        </li>
      </ul>

      <div className="logout-section" onClick={handleLogout}>
        Logout
      </div>
    </div>
  );
};

export default SidebarAdmin;
