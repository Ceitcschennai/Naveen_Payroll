import React from "react";
import { Outlet } from "react-router-dom";
import SidebarEmp from "../components/SidebarEmp";
import Navbar from "../components/Navbar";
import "../styles/empSidebarPremium.css";

const EmpLayout = () => {
  return (
    <div className="layout">
      <SidebarEmp />
      <div className="layout-content">
        <Navbar title="Employee Dashboard" />
        <Outlet />
      </div>
    </div>
  );
};

export default EmpLayout;
