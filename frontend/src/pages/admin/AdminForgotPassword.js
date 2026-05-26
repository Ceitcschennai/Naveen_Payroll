import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/login.css";

const ADMIN_EMAIL = "payrollmanagementsystem123@gmail.com";

const AdminForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");

    // ✅ EMAIL RESTRICTION
    if (email.trim().toLowerCase() !== ADMIN_EMAIL) {
      setMessage("❌ Only authorized admin email is allowed.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ADMIN_EMAIL }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage("✅ Reset link sent. Please check your email.");
      } else {
        setMessage(data.message || "⚠ Error sending reset link.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage("⚠ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page admin-bg">
      <div className="login-box">
        <h1 className="app-title">CeiTCS Payroll</h1>
        <h2>Forgot Password (Admin)</h2>

        <form onSubmit={handleReset}>
          <input
            type="email"
            className="login-input"
            placeholder="Enter admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && <p className="login-message">{message}</p>}

        <Link to="/login/admin">Back to Login</Link>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
