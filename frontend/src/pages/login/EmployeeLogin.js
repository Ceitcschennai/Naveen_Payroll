import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/login.css";

const EmployeeLogin = ({ setRole }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ✅ Auto-fill email after signup
  useEffect(() => {
    const savedEmail = localStorage.getItem("signupEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      localStorage.removeItem("signupEmail");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/employee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success && data.role === "employee") {
        setRole("employee");

        // ✅ store username for attendance/profile
        localStorage.setItem("empUsername", data.username);
        localStorage.setItem("empFullName", data.fullName);
        localStorage.setItem("username", data.username); // For older components


        Swal.fire({
          icon: "success",
          title: "Login Successful",
          timer: 2000,
          showConfirmButton: false,
        });

        navigate("/employee");
      } else {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: data.message || "Invalid credentials",
        });
      }
    } catch (err) {
      console.error("Login error:", err);
      Swal.fire({
        icon: "warning",
        title: "Server Error",
        text: "Please try again later",
      });
    }
  };

  return (
    <div className="login-page employee-bg">
      <div className="login-box">
        <h1 className="app-title">CeiTCS Payroll</h1>
        <h2>Employee Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-container" style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "15px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <button type="submit" className="btn-login">
            Login
          </button>
        </form>

        <div className="login-links">
          <Link to="/forgot-password/employee">Forgot Password?</Link>
        </div>

        <p className="signup-link">
          New user? <Link to="/signup/employee">Create an account</Link>
        </p>

        <p>
          Are you an admin? <Link to="/login/admin">Login as Admin</Link>
        </p>
      </div>
    </div>
  );
};

export default EmployeeLogin;