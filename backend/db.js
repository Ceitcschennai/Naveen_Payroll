import sql from 'mssql/msnodesqlv8.js';

const sqlConfig = {
    server: 'DESKTOP-84EBH07\\SQLEXPRESS',
    database: 'PayrollDB',
    driver: 'ODBC Driver 17 for SQL Server',
    options: {
        trustedConnection: true,
        encrypt: false, // For local dev, false is usually needed, or use trustServerCertificate: true
        trustServerCertificate: true
    }
};

let poolPromise = sql.connect(sqlConfig)
    .then(pool => {
        console.log('✅ SQL Server connected to PayrollDB');
        return pool;
    })
    .catch(err => console.log('❌ SQL Database Connection Failed!', err));

export const logAdminActivity = async (message, empId = 'ADMIN') => {
    try {
        const pool = await poolPromise;
        const empExists = await pool.request()
            .input("emp_id", sql.VarChar, empId)
            .query(`SELECT EMP_ID FROM EMPLOYEE_LOGIN WHERE EMP_ID = @emp_id`);
        
        if (empExists.recordset.length > 0) {
            await pool.request()
                .input('emp_id', sql.VarChar, empId)
                .input('message', sql.VarChar, message)
                .query('INSERT INTO ACTIVITYTABLE (EMP_ID, MESSAGE) VALUES (@emp_id, @message)');
        }
    } catch (err) {
        console.error("Activity Logging failed:", err.message);
    }
};

export { sql, poolPromise };
