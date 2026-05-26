import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const EmployeeLogout = ({ setRole }) => {
  const navigate = useNavigate();

  useEffect(() => {
    setRole(null);
    localStorage.clear();

    setTimeout(() => {
      alert("✅ Employee has been logged out successfully!");
      navigate("/login/employee");
    }, 500);
  }, [navigate, setRole]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-semibold mb-2">Logging out Employee...</h2>
      <p className="text-gray-500">Please wait a moment.</p>
    </div>
  );
};

export default EmployeeLogout;
