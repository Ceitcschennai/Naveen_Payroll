import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/login.css";

const AdminResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `http://localhost:5000/reset-password/${token}`, // ✅ FIXED
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setMessage("✅ Password reset successful. Redirecting...");
        setTimeout(() => navigate("/login/admin"), 2000);
      } else {
        setMessage(`❌ ${data.message || "Reset failed"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error. Try again.");
    }
  };

  return (
    <div className="login-page admin-bg">
      <div className="login-box">
        <h1 className="app-title">CeiTCS Payroll</h1>
        <h2>Reset Password (Admin)</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-login">
            Reset Password
          </button>
        </form>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
};

export default AdminResetPassword;
