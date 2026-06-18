import React from "react";
import { Outlet } from "react-router-dom";
import SidebarEmp from "../components/SidebarEmp";
import "../styles/empSidebarPremium.css";

const EmpLayout = () => {
  return (
    <div className="layout">
      <SidebarEmp />

      <div className="layout-content">
        <Outlet />
      </div>
    </div>
  );
};

export default EmpLayout;