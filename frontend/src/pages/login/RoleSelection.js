import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/RoleSelection.css";

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="role-wrapper">
      <h1 className="main-title">CeiTCS Payroll Management System</h1>
      <p className="subtitle">Login to access Employee Details</p>

      <div className="role-card">
        <h2 className="choose-title">Choose Your Role</h2>
        <p className="choose-sub">Select your role to continue</p>

        <div className="role-options">
          {/* ADMIN */}
          <div
            className="role-box admin-box"
            onClick={() => navigate("/login/admin")}
          >
            <div className="emoji"></div>
            <h3 >Admin</h3>
            <p>Manage employee records</p>
          </div>

          {/* EMPLOYEE */}
          <div
            className="role-box emp-box"
            onClick={() => navigate("/login/employee")}
          >
            <div className="emoji"></div>
            <h3>Employee</h3>
            <p>View your details</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
