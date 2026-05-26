import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/employeeSignup.css";
import axios from "axios";

const EmployeeSignup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  // 🔐 Password rules
  const passwordRegex =
    /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // ✅ Frontend password validation
    if (!passwordRegex.test(formData.password)) {
      setMessage(
        "⚠️ Password must be at least 8 characters and include a number & special character"
      );
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/employee/signup",
        formData
      );

      if (res.data.success) {
        // ✅ store email for login auto-fill
        localStorage.setItem("signupEmail", formData.email);

        setMessage("✅ Signup successful! Redirecting to login...");
        setTimeout(() => navigate("/login/employee"), 1500);
      } else {
        setMessage(res.data.message || "❌ Signup failed!");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setMessage("❌ Server error. Please try again.");
    }
  };

  return (
    <div className="login-page employee-bg">
      <div className="login-box">
        <h2>Employee Sign Up</h2>
        <h3>Create a new account</h3>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <p style={{ fontSize: "12px", color: "#ccc", marginTop: "5px" }}>
            Password must be at least 8 characters, include a number & special
            character
          </p>

          <button type="submit" className="btn-login">
            Register
          </button>
        </form>

        {message && <p>{message}</p>}

        <p>
          Already have an account?{" "}
          <Link to="/login/employee">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default EmployeeSignup;
