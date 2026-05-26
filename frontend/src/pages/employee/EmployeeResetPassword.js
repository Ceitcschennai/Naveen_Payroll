import React, { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const EmployeeResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await axios.post(`http://localhost:5000/employee/reset-password/${token}`, {
        password,
      });
      setMessage("✅ " + res.data.message);
      setTimeout(() => navigate("/login/employee"), 2000);
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.message || "Reset failed"));
    }
  };

  return (
    <div className="login-page employee-bg">
      <div className="login-box">
        <h1 className="app-title">CeiTCS Payroll</h1>
        <h2>Reset Employee Password</h2>

        <form onSubmit={handleReset}>
          <input
            type="password"
            placeholder="Enter New Password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-login">
            Reset Password
          </button>
        </form>

        {message && <p className="status-message">{message}</p>}
      </div>
    </div>
  );
};

export default EmployeeResetPassword;
