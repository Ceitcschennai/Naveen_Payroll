import express from "express";
import bcrypt from "bcrypt";
import { sql, poolPromise, logAdminActivity } from "../db.js";

const router = express.Router();

/* ---------------------------------------------
   GET ALL EMPLOYEES
----------------------------------------------*/
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const employees = await pool.request().query(`
      SELECT DISTINCT e.EMP_ID as _id, e.EMP_ID as employeeId, e.EMP_EMAIL as email, p.EMP_NAME as username, p.EMP_NAME as name, 
             p.DATE_OF_JOIN as joinDate, p.EMP_CONTACT_NUMBER as phone, p.EMP_ADDRESS as address,
             p.EMP_DEPARTMENT as department, py.EMP_SALARY as salary, py.EMP_DESIGNATION as position,
             p.EMP_TYPE as type, p.EMP_STATUS as status
      FROM EMPLOYEE_LOGIN e 
      LEFT JOIN PROFILE p ON e.EMP_ID = p.EMP_ID
      LEFT JOIN PAYROLL py ON e.EMP_ID = py.EMP_ID
    `);
    res.json({ success: true, employees: employees.recordset });
  } catch(err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------
   GET EMPLOYEE BY USERNAME
----------------------------------------------*/
router.get("/username/:username", async (req, res) => {
  try {
    const pool = await poolPromise;
    const employee = await pool.request()
      .input('id', sql.VarChar, req.params.username)
      .query(`SELECT p.*, py.EMP_SALARY as salary, py.EMP_DESIGNATION as position 
              FROM PROFILE p 
              LEFT JOIN PAYROLL py ON p.EMP_ID = py.EMP_ID 
              WHERE p.EMP_ID = @id OR p.EMP_NAME = @id`);
    if (employee.recordset.length === 0) return res.status(404).json({ success: false, message: "Employee not found" });
    
    // Map properties for MonthlyPayroll.js and others
    const emp = employee.recordset[0];
    emp.salary = emp.salary || 0;
    emp.department = emp.EMP_DEPARTMENT || "";
    emp.fullName = emp.EMP_NAME;
    
    res.json({ success: true, employee: emp });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* ---------------------------------------------
   CREATE EMPLOYEE (ADMIN USAGE)
----------------------------------------------*/
router.post("/", async (req, res) => {
  try {
    let { employeeId, username, name, email, password, joinDate, phone, address, salary, position, department, type, status } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const pool = await poolPromise;
    const exists = await pool.request().input('email', sql.VarChar, email).query('SELECT EMP_EMAIL FROM EMPLOYEE_LOGIN WHERE EMP_EMAIL = @email');
    if (exists.recordset.length > 0) return res.status(400).json({ success: false, message: "Email already exists" });

    if (!employeeId?.trim()) {
      const lastEmp = await pool.request().query('SELECT TOP 1 EMP_ID FROM EMPLOYEE_LOGIN ORDER BY EMP_ID DESC');
      employeeId = "EMP1001";
      if (lastEmp.recordset.length > 0) {
         const lastNumber = parseInt(lastEmp.recordset[0].EMP_ID.replace("EMP", "")) || 1000;
         employeeId = "EMP" + (lastNumber + 1);
      }
    }

    const hashedPassword = await bcrypt.hash(password || "emp123", 10);
    const parseDate = joinDate ? new Date(joinDate) : new Date();
    const sal = salary || 0;

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
            .input('name', sql.VarChar, name || username)
            .input('dt', sql.Date, parseDate)
            .input('phone', sql.VarChar, phone || '')
            .input('addr', sql.VarChar, address || '')
            .input('dept', sql.VarChar, department || '')
            .input('type', sql.VarChar, type || 'Permanent')
            .input('status', sql.VarChar, status || 'Active')
            .query('INSERT INTO PROFILE (EMP_ID, EMP_NAME, DATE_OF_JOIN, EMP_CONTACT_NUMBER, EMP_ADDRESS, EMP_DEPARTMENT, EMP_TYPE, EMP_STATUS) VALUES (@empId, @name, @dt, @phone, @addr, @dept, @type, @status)');

        // Pre-initialize payroll
        await transaction.request()
            .input('empId', sql.VarChar, employeeId)
            .input('name', sql.VarChar, name || username)
            .input('pos', sql.VarChar, position || '')
            .input('sal', sql.Decimal, sal)
            .query("INSERT INTO PAYROLL (PAYROLL_ID, EMP_ID, EMP_NAME, EMP_DESIGNATION, EMP_SALARY, EMP_BONUS, EMP_DEDUCTIONS, EMP_NETPAY) VALUES (@empId + '_PAY01', @empId, @name, @pos, @sal, 0, 0, @sal)");

        await transaction.commit();
        try {
            await logAdminActivity(`EMPLOYEE INSERTED: ${employeeId}`);
        } catch (e) {}
        res.json({ success: true, employee: { _id: employeeId, employeeId, email, name: name || username } });
    } catch (txErr) {
        await transaction.rollback();
        throw txErr;
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ---------------------------------------------
   UPDATE EMPLOYEE
----------------------------------------------*/
router.put("/:id", async (req, res) => {
  try {
    const empId = req.params.id;
    const { name, phone, address, salary, position, joinDate, department, type, status } = req.body;
    
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Update Profile Fields
      const updateProfileQ = "UPDATE PROFILE SET EMP_NAME = @name, EMP_CONTACT_NUMBER = @phone, EMP_ADDRESS = @address, DATE_OF_JOIN = @dt, EMP_DEPARTMENT = @dept, EMP_TYPE = @type, EMP_STATUS = @status WHERE EMP_ID = @id";
      await transaction.request()
        .input('id', sql.VarChar, empId)
        .input('name', sql.VarChar, name || '')
        .input('phone', sql.VarChar, phone || '')
        .input('address', sql.VarChar, address || '')
        .input('dept', sql.VarChar, department || '')
        .input('dt', sql.Date, joinDate ? new Date(joinDate) : new Date())
        .input('type', sql.VarChar, type || 'Permanent')
        .input('status', sql.VarChar, status || 'Active')
        .query(updateProfileQ);

      // Verify if Payroll exists
      const payExists = await transaction.request()
        .input('id', sql.VarChar, empId)
        .query("SELECT * FROM PAYROLL WHERE EMP_ID = @id");

      const sal = salary ? parseFloat(salary) : 0;
      
      if (payExists.recordset.length > 0) {
        // Update existing payroll
        await transaction.request()
          .input('id', sql.VarChar, empId)
          .input('name', sql.VarChar, name || '')
          .input('pos', sql.VarChar, position || '')
          .input('sal', sql.Decimal, sal)
          .query("UPDATE PAYROLL SET EMP_NAME = @name, EMP_DESIGNATION = @pos, EMP_SALARY = @sal, EMP_NETPAY = @sal WHERE EMP_ID = @id");
      } else {
        // Insert if missing
        await transaction.request()
          .input('id', sql.VarChar, empId)
          .input('name', sql.VarChar, name || '')
          .input('pos', sql.VarChar, position || '')
          .input('sal', sql.Decimal, sal)
          .query("INSERT INTO PAYROLL (PAYROLL_ID, EMP_ID, EMP_NAME, EMP_DESIGNATION, EMP_SALARY, EMP_BONUS, EMP_DEDUCTIONS, EMP_NETPAY) VALUES (@id + '_PAY01', @id, @name, @pos, @sal, 0, 0, @sal)");
      }

      await transaction.commit();
      try { await logAdminActivity(`EMPLOYEE UPDATED: ${empId}`); } catch(e){}
      res.json({ success: true, message: "Employee details synced successfully" });
    } catch (txErr) {
      await transaction.rollback();
      throw txErr;
    }
  } catch (err) {
    console.error("PUT /employees/:id Error:", err);
    res.status(500).json({ success: false, message: "Server error updating employee" });
  }
});

/* ---------------------------------------------
   DELETE EMPLOYEE
----------------------------------------------*/
router.delete("/:id", async (req, res) => {
  try {
    const pool = await poolPromise;
    const empId = req.params.id;
    // Delete queries (Foreign key order constraint must be respected)
    await pool.request().input('id', sql.VarChar, empId).query('DELETE FROM PROFILE WHERE EMP_ID = @id');
    await pool.request().input('id', sql.VarChar, empId).query('DELETE FROM LEAVES_TABLE WHERE EMP_ID = @id');
    await pool.request().input('id', sql.VarChar, empId).query('DELETE FROM PAYROLL WHERE EMP_ID = @id');
    await pool.request().input('id', sql.VarChar, empId).query('DELETE FROM ACTIVITYTABLE WHERE EMP_ID = @id');
    await pool.request().input('id', sql.VarChar, empId).query('DELETE FROM ONSITE_EMPLOYEE WHERE EMP_ID = @id');
    await pool.request().input('id', sql.VarChar, empId).query('DELETE FROM EMPLOYEE_LOGIN WHERE EMP_ID = @id');
    try {
        await logAdminActivity(`EMPLOYEE DELETED: ${empId}`);
    } catch (e) {}
    res.json({ success: true, message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
