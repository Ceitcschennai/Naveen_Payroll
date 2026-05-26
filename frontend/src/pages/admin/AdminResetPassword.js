import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../../styles/login.css";

const AdminResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // 🔐 Same password rule as employee
  const passwordRegex =
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // ✅ Frontend validation
    if (!passwordRegex.test(password)) {
      setMessage(
        "⚠️ Password must be at least 8 characters and include a number & special character"
      );
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setMessage("✅ Password reset successful. Redirecting...");
        setTimeout(() => navigate("/login/admin"), 2000);
      } else {
        setMessage(data.message || "❌ Reset failed. Link may be expired.");
      }
    } catch (err) {
      console.error("Reset error:", err);
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

          <p style={{ fontSize: "12px", color: "#ccc", marginTop: "5px" }}>
            Password must be at least 8 characters, include a number & special
            character
          </p>

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
