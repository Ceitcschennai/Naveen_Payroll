import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/login.css";

const AdminForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:5000/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage("✅ Reset link sent to your email.");
      } else {
        setMessage("⚠️ " + data.message);
      }
    } catch (error) {
      setMessage("⚠️ Server error. Try again later.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="app-title">CeiTCS Payroll</h1>
        <h2>Forgot Password (admin)</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="btn-login">Send Reset Link</button>
        </form>
        {message && <p>{message}</p>}
        <div className="login-links">
          <Link to="/login/admin">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
