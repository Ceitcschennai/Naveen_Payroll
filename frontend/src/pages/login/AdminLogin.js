import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/login.css";

const AdminLogin = ({ setRole }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();
      console.log("Admin login response:", data);

      if (!response.ok || !data.success) {
        Swal.fire("Login Failed", data.message || "Invalid credentials", "error");
        return;
      }

      // ✅ Successful login (works for reset password too)
      localStorage.setItem("role", "admin");
      setRole("admin");

      Swal.fire({
        title: "Success!",
        text: "Admin logged in successfully 🎉",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });

      // ✅ ALWAYS go to dashboard after login
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire("Server Error", "Please try again later", "error");
    }
  };

  return (
    <div className="login-page admin-bg">
      <div className="login-box">
        <h1 className="app-title">CeiTCS Payroll</h1>
        <h2>Admin Login</h2>

        <form onSubmit={handleLogin}>
          <input
            className="login-input"
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="login-input"
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-login">
            Login
          </button>
        </form>

        <div className="login-links">
          <Link to="/admin/forgot-password">Forgot Password?</Link><br />
     
          <Link to="/">Back to page</Link>
          <p>Default email: payrollmanagementsystem123@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
