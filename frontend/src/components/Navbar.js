import React, { useState, useEffect } from "react";
import { FiSearch, FiChevronDown } from "react-icons/fi";
import { FaSignOutAlt } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/navbar.css";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  const navigate = useNavigate();

  const fetchProfile = () => {
    const username = localStorage.getItem("empUsername") || localStorage.getItem("username");
    if (!username) return;

    axios
      .get(`http://localhost:5000/employee/profile`, { headers: { username } })
      .then((res) => {
        if (res.data?.success && res.data.employee) {
          setProfile(res.data.employee);
        }
      })
      .catch((err) => console.log("Profile load error:", err));
  };

  useEffect(() => {
    fetchProfile();
    window.addEventListener("profileUpdated", fetchProfile);
    return () => window.removeEventListener("profileUpdated", fetchProfile);
  }, []);

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
        localStorage.removeItem("empUsername");
        localStorage.removeItem("employeeToken");
        Swal.fire({
          title: "Logged Out",
          text: "You have been logged out successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/login/employee");
      }
    });
  };


  return (
    <nav className="top-navbar">
      <div className="left">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Search anything..." />
        </div>
      </div>
      

      <div className="right">

        {/* User Profile */}
        <div className="user-info" onClick={() => setOpen(!open)}>
          <img
            src={
              profile?.profilePic
                ? `http://localhost:5000/uploads/${profile.profilePic}`
                : "https://cdn-icons-png.flaticon.com/512/9131/9131529.png"
            }
            alt="user"
            className="user-avatar"
          />
          <span className="username">
            Hi, {profile?.fullName || profile?.username || "Employee"}
          </span>
          <FiChevronDown className={`dropdown-icon ${open ? "rotate" : ""}`} />

          {open && (
            <div className="dropdown-menu">
              <div
                className="dropdown-item"
                onClick={() => {
                  setOpen(false);
                  navigate("/employee/profile");
                }}
              >
                My Profile
              </div>
              <div className="logout-section" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
