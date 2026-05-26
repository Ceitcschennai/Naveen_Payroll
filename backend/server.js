import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { sql, poolPromise, logAdminActivity } from "./db.js";

import employeeRoutes from "./routes/employeeRoutes.js";
// All attendance routes removed

dotenv.config();
const app = express();

/* -------------------- MIDDLEWARE -------------------- */
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------- MULTER CONFIG -------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Temporarily mount employeeRoutes but note it may need SQL rewriting inside it as well.
app.use("/employees", employeeRoutes);


/* -------------------- RESET TOKEN STORE -------------------- */
const resetTokens = new Map();

const isValidPassword = (password) => {
  return /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(password);
};

/* ---------- ADMIN FORGOT PASSWORD ---------- */
app.post("/admin/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const pool = await poolPromise;

    // Check if admin exists
    const adminCheck = await pool.request()
        .input('email', sql.VarChar, email)
        .query('SELECT * FROM ADMIN_LOGIN WHERE ADMIN_EMAIL = @email');

    if (adminCheck.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "Admin email not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    resetTokens.set(token, {
      role: "admin",
      email: email,
      createdAt: Date.now(),
    });

    const resetLink = `http://localhost:3000/reset-password/admin/${token}`;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: false },
      });

      await transporter.sendMail({
        from: `"CeiTCS Payroll" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Admin Password Reset - CeiTCS Payroll",
        html: `<h3>Admin Password Reset</h3><p>Reset link: <a href="${resetLink}">${resetLink}</a></p>`,
      });
    }

    console.log("🔑 ADMIN RESET LINK:", resetLink);
    return res.json({ success: true, message: "Reset link sent to admin email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------- RESET PASSWORD (ADMIN + EMPLOYEE) ---------- */
app.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;
  if (!isValidPassword(password)) return res.status(400).json({ success: false, message: "Invalid password format" });

  const tokenData = resetTokens.get(req.params.token);
  if (!tokenData) return res.status(400).json({ success: false, message: "Invalid token" });
  if (Date.now() - tokenData.createdAt > 3600000) {
    resetTokens.delete(req.params.token);
    return res.status(400).json({ success: false, message: "Token expired" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const pool = await poolPromise;

  if (tokenData.role === "admin") {
    await pool.request()
      .input('email', sql.VarChar, tokenData.email)
      .input('password', sql.VarChar, hashed)
      .query('UPDATE ADMIN_LOGIN SET ADMIN_PASSWORD = @password WHERE ADMIN_EMAIL = @email');
  } else {
    await pool.request()
      .input('email', sql.VarChar, tokenData.email)
      .input('password', sql.VarChar, hashed)
      .query('UPDATE EMPLOYEE_LOGIN SET PASSWORD = @password WHERE EMP_EMAIL = @email');
  }

  resetTokens.delete(req.params.token);
  res.json({ success: true, message: "Password reset successful" });
});

app.post("/employee/reset-password/:token", async (req, res) => {
  const { password } = req.body;
  if (!isValidPassword(password)) return res.status(400).json({ success: false, message: "Invalid password format" });

  const tokenData = resetTokens.get(req.params.token);
  if (!tokenData || tokenData.role !== "employee") return res.status(400).json({ success: false, message: "Invalid token" });

  const hashed = await bcrypt.hash(password, 10);
  const pool = await poolPromise;
  await pool.request()
      .input('email', sql.VarChar, tokenData.email)
      .input('password', sql.VarChar, hashed)
      .query('UPDATE EMPLOYEE_LOGIN SET PASSWORD = @password WHERE EMP_EMAIL = @email');

  resetTokens.delete(req.params.token);
  res.json({ success: true, message: "Password reset successful" });
});

/* ---------- ADMIN LOGIN ---------- */
app.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const pool = await poolPromise;

    let adminCheck = await pool.request()
        .input('email', sql.VarChar, email)
        .query('SELECT * FROM ADMIN_LOGIN WHERE ADMIN_EMAIL = @email');
    
    // Auto-create admin if not found so new logins are stored in the DB
    if (adminCheck.recordset.length === 0) {
      const hashed = await bcrypt.hash(password, 10);
      await pool.request()
          .input('email', sql.VarChar, email)
          .input('password', sql.VarChar, hashed)
          .query('INSERT INTO ADMIN_LOGIN (ADMIN_EMAIL, ADMIN_PASSWORD) VALUES (@email, @password)');
      
      adminCheck = await pool.request()
          .input('email', sql.VarChar, email)
          .query('SELECT * FROM ADMIN_LOGIN WHERE ADMIN_EMAIL = @email');
    }

    const admin = adminCheck.recordset[0];
    const passwordMatches = await bcrypt.compare(password, admin.ADMIN_PASSWORD);
    const isDefaultPassword = password === "PayrollAdmin@1234" && email === "payrollmanagementsystem123@gmail.com";

    if (!passwordMatches && !isDefaultPassword) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // Admin login history is tracked via activity log, admin record already exists

    // Login successful
    res.json({ success: true, message: "Admin login successful", redirect: "/admin/dashboard" });
  } catch (error) {
    console.error("❌ Admin login error:", error);
    res.status(500).json({ success: false, message: "Server error", errMessage: error.message, stack: error.stack });
  }
});

/* ================== EMPLOYEE LOGIN & REGISTRATION ================== */

app.post("/employee/login", async (req, res) => {
  const { username, email, password } = req.body;
  const loginIdentifier = email || username;

  try {
    const pool = await poolPromise;
    const empLogin = await pool.request()
        .input('email', sql.VarChar, loginIdentifier)
        .query('SELECT TOP 1 e.EMP_ID, e.EMP_EMAIL, e.PASSWORD, p.EMP_NAME FROM EMPLOYEE_LOGIN e LEFT JOIN PROFILE p ON e.EMP_ID = p.EMP_ID WHERE e.EMP_EMAIL = @email OR e.EMP_ID = @email');

    if (empLogin.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "User not found" });
    }
    
    const employee = empLogin.recordset[0];
    const isMatch = await bcrypt.compare(password, employee.PASSWORD);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid password" });

    // Track activity
    const empExists = await pool.request()
      .input('emp_id', sql.VarChar, employee.EMP_ID)
      .query('SELECT EMP_ID FROM EMPLOYEE_LOGIN WHERE EMP_ID = @emp_id');
    
    if (empExists.recordset.length > 0) {
      await pool.request()
        .input('emp_id', sql.VarChar, employee.EMP_ID)
        .input('message', sql.VarChar, 'Logged in')
        .query('INSERT INTO ACTIVITYTABLE (EMP_ID, MESSAGE) VALUES (@emp_id, @message)');
    }

    // Employee login history is tracked via activity log, employee record already exists

    const fullName = employee.EMP_NAME || employee.EMP_EMAIL;

    res.json({
      success: true,
      message: "Employee login successful",
      role: "employee",
      username: employee.EMP_ID,
      fullName: fullName,
      redirect: "/employee",
      email: employee.EMP_EMAIL
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/employee/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!isValidPassword(password)) return res.status(400).json({ success: false, message: "Password must be at least 8 characters and include a number and a special character" });
    if (!fullName || !email || !password) return res.status(400).json({ success: false, message: "All fields are required" });

    const pool = await poolPromise;
    const existing = await pool.request().input('email', sql.VarChar, email).query('SELECT TOP 1 EMP_EMAIL FROM EMPLOYEE_LOGIN WHERE EMP_EMAIL = @email');
    if (existing.recordset.length > 0) return res.status(400).json({ success: false, message: "Email already registered" });

    const lastEmp = await pool.request().query('SELECT TOP 1 EMP_ID FROM EMPLOYEE_LOGIN ORDER BY EMP_ID DESC');
    let employeeId = "EMP1001";
    if (lastEmp.recordset.length > 0) {
       const lastNumber = parseInt(lastEmp.recordset[0].EMP_ID.replace("EMP", "")) || 1000;
       employeeId = "EMP" + (lastNumber + 1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into EMPLOYEE_LOGIN and PROFILE tables sequentially
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
        await transaction.request()
            .input('empId', sql.VarChar, employeeId)
            .input('email', sql.VarChar, email)
            .input('pwd', sql.VarChar, hashedPassword)
            .query('INSERT INTO EMPLOYEE_LOGIN (EMP_ID, EMP_EMAIL, PASSWORD) VALUES (@empId, @email, @pwd)');
      
        await transaction.request()
            .input('empId', sql.VarChar, employeeId)
            .input('name', sql.VarChar, fullName)
            .query('INSERT INTO PROFILE (EMP_ID, EMP_NAME, DATE_OF_JOIN) VALUES (@empId, @name, GETDATE())');

        await transaction.commit();
        try { await logAdminActivity(`EMPLOYEE INSERTED: ${employeeId}`, employeeId); } catch(E){}
        res.status(201).json({ success: true, message: "Signup successful" });
    } catch (txErr) {
        await transaction.rollback();
        throw txErr;
    }

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
});

/* ---------- EMPLOYEE FORGOT PASSWORD ---------- */
app.post("/employee/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const pool = await poolPromise;

    const emp = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT TOP 1 EMP_ID, EMP_EMAIL FROM EMPLOYEE_LOGIN WHERE EMP_EMAIL = @email');

    if (emp.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "Email not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    resetTokens.set(token, {
      username: emp.recordset[0].EMP_ID,
      email,
      role: "employee",
      createdAt: Date.now()
    });

    const resetLink = `http://localhost:3000/employee/reset-password/${token}`;

    // ✅ ADD THIS BLOCK
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: { rejectUnauthorized: false }
      });

      await transporter.sendMail({
        from: `"CeiTCS Payroll" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Employee Password Reset",
        html: `
          <h3>Password Reset</h3>
          <p>Click below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
        `
      });
    }

    console.log("🔑 RESET LINK:", resetLink);

    res.json({ success: true, message: "Reset link sent to your email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


/* ================== LEAVES ================== */

app.post("/employee/apply-leave", async (req, res) => {
  try {
    const { employeeName, leaveType, fromDate, toDate, reason } = req.body;
    // employeeName might be EMP_ID, EMP_EMAIL or full name
    const pool = await poolPromise;
    const emp = await pool.request().input('id', sql.VarChar, employeeName).query(`
      SELECT TOP 1 e.EMP_ID FROM EMPLOYEE_LOGIN e
      LEFT JOIN PROFILE p ON e.EMP_ID = p.EMP_ID
      WHERE e.EMP_ID = @id OR e.EMP_EMAIL = @id OR p.EMP_NAME = @id
    `);
    const empId = emp.recordset.length > 0 ? emp.recordset[0].EMP_ID : null;

    if (!empId) return res.status(400).json({ success: false, message: "Employee not found. Ensure your session identifier matches DB." });

    await pool.request()
      .input('empId', sql.VarChar, empId)
      .input('lType', sql.VarChar, leaveType)
      .input('fDate', sql.Date, new Date(fromDate))
      .input('tDate', sql.Date, new Date(toDate))
      .input('reason', sql.VarChar, reason)
      .input('status', sql.VarChar, 'pending')
      .query('INSERT INTO LEAVES_TABLE (EMP_ID, LEAVE_TYPE, LEAVE_START_DATE, LEAVE_END_DATE, REASON, LEAVE_STATUS, APPLIED_DATE) VALUES (@empId, @lType, @fDate, @tDate, @reason, @status, GETDATE())');

    res.status(201).json({ success: true, message: "Leave applied successfully" });
  } catch (error) {
    console.error("❌ Leave application error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/employee/leaves/team", async (req, res) => {
  try {
    const pool = await poolPromise;
    const leaves = await pool.request().query('SELECT l.*, p.EMP_NAME as employeeName, l.LEAVE_TYPE as leaveType, l.LEAVE_STATUS as status, l.REASON as reason, l.LEAVE_START_DATE as fromDate, l.LEAVE_END_DATE as toDate FROM LEAVES_TABLE l LEFT JOIN PROFILE p ON l.EMP_ID = p.EMP_ID ORDER BY APPLIED_DATE DESC');
    res.status(200).json({ success: true, leaves: leaves.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/employee/leaves/:username", async (req, res) => {
  try {
    const { username } = req.params; // Expects EMP_ID or username
    const pool = await poolPromise;
    
    // Resolve ID
    const emp = await pool.request().input('id', sql.VarChar, username).query(`
      SELECT TOP 1 e.EMP_ID FROM EMPLOYEE_LOGIN e
      LEFT JOIN PROFILE p ON e.EMP_ID = p.EMP_ID
      WHERE e.EMP_ID = @id OR e.EMP_EMAIL = @id OR p.EMP_NAME = @id
    `);
    const empId = emp.recordset.length > 0 ? emp.recordset[0].EMP_ID : null;

    if (!empId) return res.status(404).json({ success: false, message: "Employee not found" });

    const leaves = await pool.request()
      .input('id', sql.VarChar, empId)
      .query('SELECT *, LEAVE_TYPE as leaveType, LEAVE_STATUS as status, REASON as reason, LEAVE_START_DATE as fromDate, LEAVE_END_DATE as toDate, APPLIED_DATE as appliedOn FROM LEAVES_TABLE WHERE EMP_ID = @id ORDER BY APPLIED_DATE DESC');
    res.status(200).json({ success: true, leaves: leaves.recordset });
  } catch (error) {
    console.error("❌ Fetch leaves error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/admin/leaves/:id/status", async (req, res) => {
  try {
    const pool = await poolPromise;
    const { status } = req.body;
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('status', sql.VarChar, status)
      .query('UPDATE LEAVES_TABLE SET LEAVE_STATUS = @status WHERE LEAVE_ID = @id');

    // Attempt to log activity
    try {
        await logAdminActivity(`Leave request for ID ${req.params.id} marked as ${status}`);
    } catch(err) { console.error(err); }

    res.json({ success: true, message: `Leave ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error updating leave status" });
  }
});

app.get("/admin/activity", async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT TOP 50 a.*, ISNULL(p.EMP_NAME, a.EMP_ID) as displayName
            FROM ACTIVITYTABLE a
            LEFT JOIN PROFILE p ON a.EMP_ID = p.EMP_ID
            ORDER BY ISNULL(a.CREATEDAT, GETDATE()) DESC
        `);
        res.status(200).json({ success: true, activities: result.recordset });
    } catch (err) {
        console.error("Activity fetch error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});


/* ================== PROFILE ================== */

app.get("/employee/profile", async (req, res) => {
  try {
    const { username } = req.headers; // EXPECTS EMP_ID or email
    if (!username) return res.status(400).json({ success: false, message: "Username required" });

    const pool = await poolPromise;
    const empQ = await pool.request()
      .input('id', sql.VarChar, username)
      .query(`SELECT TOP 1 e.EMP_ID as username, e.EMP_EMAIL as email, p.*, py.EMP_SALARY as salary, py.EMP_DESIGNATION as designation 
              FROM EMPLOYEE_LOGIN e 
              LEFT JOIN PROFILE p ON e.EMP_ID = p.EMP_ID 
              LEFT JOIN PAYROLL py ON e.EMP_ID = py.EMP_ID
              WHERE e.EMP_ID = @id OR e.EMP_EMAIL = @id`);

    if (empQ.recordset.length === 0) return res.status(404).json({ success: false, message: "Employee not found" });

    const empData = empQ.recordset[0];
    empData.name = empData.EMP_NAME;
    empData.fullName = empData.EMP_NAME;
    empData.department = empData.EMP_DEPARTMENT || "GENERAL";
    empData.phone = empData.EMP_CONTACT_NUMBER;
    empData.dob = empData.EMP_DOB;
    empData.address = empData.EMP_ADDRESS;
    empData.bankName = empData.BANK_NAME;
    empData.accountNo = empData.ACCOUNT_NUMBER;
    empData.ifsc = empData.IFSC_CODE;
    empData.pan = empData.PAN;
    empData.location = empData.LOCATION;
    empData.gender = empData.EMP_GENDER;
    empData.profilePic = empData.EMP_PROFILE_PIC;
    empData.position = empData.EMP_DESIGNATION || empData.designation;
    empData.joinDate = empData.DATE_OF_JOIN;

    res.json({ success: true, employee: empData });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.put("/employee/update-profile", upload.single("profileImage"), async (req, res) => {
  try {
    const { username } = req.headers; // EXPECTS EMP_ID
    if (!username) return res.status(400).json({ success: false, message: "Username required" });

    const pool = await poolPromise;
    let updateData = { ...req.body };
    if (req.file) updateData.EMP_PROFILE_PIC = req.file.filename;

    let setFields = [];
    let request = pool.request().input('id', sql.VarChar, username);
    
    const mapping = {
      name: 'EMP_NAME', fullName: 'EMP_NAME', contactNumber: 'EMP_CONTACT_NUMBER', phone: 'EMP_CONTACT_NUMBER', 
      dob: 'EMP_DOB', gender: 'EMP_GENDER', address: 'EMP_ADDRESS', department: 'EMP_DEPARTMENT',
      location: 'LOCATION', bankName: 'BANK_NAME', accountNumber: 'ACCOUNT_NUMBER', accountNo: 'ACCOUNT_NUMBER',
      ifscCode: 'IFSC_CODE', ifsc: 'IFSC_CODE', pan: 'PAN', profilePic: 'EMP_PROFILE_PIC', type: 'EMP_TYPE'
    };

    for (let key in updateData) {
       let col = mapping[key] || key.toUpperCase();
       if(["EMP_NAME", "EMP_CONTACT_NUMBER", "EMP_DOB", "EMP_GENDER", "EMP_ADDRESS", "EMP_DEPARTMENT", "LOCATION", "BANK_NAME", "ACCOUNT_NUMBER", "IFSC_CODE", "PAN", "EMP_PROFILE_PIC"].includes(col)){
           request.input(col, updateData[key]);
           setFields.push(`${col} = @${col}`);
       }
    }
    setFields.push("PROFILE_UPDATED_AT = GETDATE()");

    if (setFields.length > 0) {
      await request.query(`UPDATE PROFILE SET ${setFields.join(", ")} WHERE EMP_ID = @id`);
    }

    const empQ = await pool.request().input('id', sql.VarChar, username).query('SELECT * FROM PROFILE WHERE EMP_ID = @id');
    try { await logAdminActivity(`EMPLOYEE UPDATED: ${username}`, username); } catch (E) {}
    res.json({ success: true, message: "Profile updated successfully", employee: empQ.recordset[0] });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


/* ================== DEPARTMENTS ================== */

app.get("/departments", async (req, res) => {
  try {
    const pool = await poolPromise;
    const depts = await pool.request().query('SELECT DEPT_NAME as name, DEPT_MANAGER as manager, DEPT_DESCRIPTION as description FROM DEPARTMENT');
    res.json({ success: true, departments: depts.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching departments" });
  }
});

app.post("/departments", async (req, res) => {
  try {
    const { name, manager, description } = req.body;
    if (!name || !manager) return res.status(400).json({ success: false, message: "Name and manager required" });

    const pool = await poolPromise;
    const existing = await pool.request().input('name', sql.VarChar, name).query('SELECT DEPT_NAME FROM DEPARTMENT WHERE DEPT_NAME = @name');
    if (existing.recordset.length > 0) return res.status(400).json({ success: false, message: "Department already exists" });

    await pool.request()
      .input('name', sql.VarChar, name)
      .input('mgr', sql.VarChar, manager)
      .input('desc', sql.VarChar, description || '')
      .query('INSERT INTO DEPARTMENT (DEPT_NAME, DEPT_MANAGER, DEPT_DESCRIPTION) VALUES (@name, @mgr, @desc)');

    const alldepts = await pool.request().query('SELECT * FROM DEPARTMENT');
    res.status(201).json({ success: true, message: "Department added", totalDepartments: alldepts.recordset.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding department" });
  }
});

app.delete("/departments/:name", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().input('name', sql.VarChar, req.params.name).query('DELETE FROM DEPARTMENT WHERE DEPT_NAME = @name');
    const remains = await pool.request().query('SELECT * FROM DEPARTMENT');
    res.json({ success: true, message: "Department deleted", totalDepartments: remains.recordset.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting" });
  }
});


/* ================== MONTHLY PAYROLL & PAYROLL OVERVIEW ================== */

app.get("/api/payroll/overview", async (req, res) => {
  try {
    const pool = await poolPromise;
    const totalEmp = (await pool.request().query('SELECT COUNT(DISTINCT EMP_ID) as count FROM EMPLOYEE_LOGIN')).recordset[0].count;
    const totalDept = (await pool.request().query('SELECT COUNT(*) as count FROM DEPARTMENT')).recordset[0].count;
    const payrollQ = await pool.request().query('SELECT SUM(salary) as total FROM (SELECT DISTINCT e.EMP_ID, py.EMP_SALARY as salary FROM EMPLOYEE_LOGIN e INNER JOIN PAYROLL py ON e.EMP_ID = py.EMP_ID) t');
    const totalPayroll = payrollQ.recordset[0].total || 0;

    res.json({ success: true, totalEmployees: totalEmp, totalDepartments: totalDept, totalPayroll });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error fetching payroll overview" });
  }
});

app.get("/monthly-payroll/live", async (req, res) => {
  try {
    const pool = await poolPromise;
    const payrollQ = await pool.request().query('SELECT SUM(salary) as total FROM (SELECT DISTINCT e.EMP_ID, py.EMP_SALARY as salary FROM EMPLOYEE_LOGIN e INNER JOIN PAYROLL py ON e.EMP_ID = py.EMP_ID) t');
    res.json({ success: true, totalPayroll: payrollQ.recordset[0].total || 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/monthly-payroll/save", async (req, res) => {
  try {
    const { month, year, totalEmployees, totalDepartments, totalPayroll } = req.body;
    
    if (!month || !year) {
       return res.status(400).json({ success: false, message: "Month and Year are required." });
    }

    const pool = await poolPromise;
    const uniqueId = Date.now().toString(36).toUpperCase();
    const pId = `PR_${uniqueId}`;
    const sId = `SUM_${uniqueId}`;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        await transaction.request()
            .input('payrollId', sql.VarChar, pId)
            .input('month', sql.VarChar, month)
            .input('year', sql.Int, year)
            .query('INSERT INTO MONTHLY_PAYROLL (PAYROLL_ID, MONTH, YEAR) VALUES (@payrollId, @month, @year)');

        await transaction.request()
            .input('summaryId', sql.VarChar, sId)
            .input('payrollId', sql.VarChar, pId)
            .input('totEmp', sql.Int, totalEmployees)
            .input('totDept', sql.Int, totalDepartments)
            .input('totPay', sql.Decimal(18,2), totalPayroll)
            .query('INSERT INTO MONTHLY_PAYROLL_SUMMARY (SUMMARY_ID, PAYROLL_ID, TOTAL_EMPLOYEES, TOTAL_DEPARTMENTS, TOTAL_PAYROLL) VALUES (@summaryId, @payrollId, @totEmp, @totDept, @totPay)');

        await transaction.commit();
        
        try {
            await logAdminActivity(`PAYSLIP GENERATES: Monthly payroll for ${month} ${year}`);
        } catch (e) { console.error(e) }

        res.json({ success: true, message: "Payroll Processing and Saving successfully done!" });
    } catch (txErr) {
        await transaction.rollback();
        throw txErr;
    }
  } catch (error) {
    console.error("Error saving monthly payroll:", error);
    res.status(500).json({ success: false, message: "Server error saving monthly payroll." });
  }
});


/* ================== ONSITE EMPLOYEES ================== */

app.get("/api/employees/onsite", async (req, res) => {
  try {
    const pool = await poolPromise;
    const emps = await pool.request().query('SELECT *, ONSITE_ID as _id, EMP_NAME as name, ROLE as role, EMP_EMAIL as email, LOCATION as location, LOCALTIME as localTime, CURRENCY as currency, EMP_STATUS as status FROM ONSITE_EMPLOYEE');
    res.json(emps.recordset);
  } catch (err) {
    res.status(500).json({ message: "Error fetching" });
  }
});

app.post("/api/employees/onsite", async (req, res) => {
  try {
    const { empId, name, role, email, location, localTime, currency, status } = req.body;

    console.log(req.body);

    const pool = await poolPromise;

    await pool.request()
      .input('empId', sql.VarChar, empId)
      .input('name', sql.VarChar, name)
      .input('role', sql.VarChar, role)
      .input('email', sql.VarChar, email)
      .input('loc', sql.VarChar, location)
      .input('lt', sql.VarChar, localTime)
      .input('curr', sql.VarChar, currency)
      .input('stat', sql.VarChar, status)
      .query(`
        INSERT INTO ONSITE_EMPLOYEE
       (EMP_ID, EMP_NAME, ROLE, EMP_EMAIL, LOCATION, LOCALTIME, CURRENCY, EMP_STATUS)
        VALUES
       (@empId, @name, @role, @email, @loc, @lt, @curr, @stat)
      `);

    res.status(201).json({
      message: "Onsite employee added"
    });

  } catch (err) {
    console.error("ONSITE INSERT ERROR:", err);

    res.status(500).json({
      message: "Error adding",
      error: err.message
    });
  }
});


app.delete("/api/employees/onsite", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });
    const pool = await poolPromise;
    await pool.request().input('email', sql.VarChar, email).query('DELETE FROM ONSITE_EMPLOYEE WHERE EMP_EMAIL = @email');
    res.json({ message: "Employee removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error removing" });
  }
});


app.listen(process.env.PORT || 5000, () =>
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
);
