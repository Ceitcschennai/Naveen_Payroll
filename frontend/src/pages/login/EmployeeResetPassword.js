import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import "../../styles/login.css";

const EmployeeResetPassword = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  // 🔐 Password validation regex
  const passwordRegex =
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // ✅ FRONTEND VALIDATION
    if (!passwordRegex.test(password)) {
      setMessage(
        "⚠️ Password must be at least 8 characters and include a number and a special character"
      );
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/employee/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (data.success) {
        setMessage("✅ Password reset successful!");
        setTimeout(() => navigate("/login/employee"), 1500);
      } else {
        setMessage("⚠️ " + data.message);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setMessage("⚠️ Server error, please try again.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1 className="app-title">CeiTCS Payroll</h1>
        <h2>Reset Password (employee)</h2>

        <form onSubmit={handleSubmit}>
          <div className="password-container" style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
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

          {/* Password rules hint */}
          <p style={{ fontSize: "12px", marginTop: "8px", color: "#ccc" }}>
            Password must be at least 8 characters, include a number & a special
            character
          </p>

          <button type="submit" className="btn-login">
            Reset Password
          </button>
        </form>

        {message && <p>{message}</p>}

        <div className="login-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeResetPassword;
