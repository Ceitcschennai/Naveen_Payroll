import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogout = ({ setRole }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear role and any stored data
    setRole(null);
    localStorage.clear();

    setTimeout(() => {
      alert("✅ Admin has been logged out successfully!");
      navigate("/login/admin");
    }, 500);
  }, [navigate, setRole]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-semibold mb-2">Logging out Admin...</h2>
      <p className="text-gray-500">Please wait a moment.</p>
    </div>
  );
};

export default AdminLogout;

