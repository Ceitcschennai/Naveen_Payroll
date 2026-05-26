import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import "../../styles/attendancePage.css";

const COLORS = ["#4CAF50", "#F44336", "#FF9800", "#2196F3"];

const AttendancePage = () => {
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [attendance, setAttendance] = useState({});

    // Fetch employees
    const fetchEmployees = async () => {
        try {
            const res = await axios.get("http://localhost:5000/employees");

            const data = res.data;
            const empList = Array.isArray(data)
                ? data
                : Array.isArray(data.employees)
                    ? data.employees
                    : [];

            setEmployees(empList);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setEmployees([]);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleStatusChange = (employeeId, status) => {
        setAttendance((prev) => ({ ...prev, [employeeId]: status }));
    };

    const handleSaveAttendance = async () => {
        if (!selectedDate) {
            alert("Please select a date before saving attendance.");
            return;
        }

        // 🔥 FIXED → send empId (required by your backend schema)
        const attendanceRecords = Object.keys(attendance).map((employeeMongoId) => {
            const emp = employees.find((e) => e._id === employeeMongoId);

            return {
                empId: emp?.empId || employeeMongoId, // ensure required empId field
                date: selectedDate,
                status: attendance[employeeMongoId],
            };
        });

        if (attendanceRecords.length === 0) {
            alert("No attendance data to save!");
            return;
        }

        try {
            const response = await axios.post(
                "http://localhost:5000/attendance/save-all",
                { records: attendanceRecords }
            );

            if (response.data.success) {
                alert("✅ Attendance saved successfully!");
            } else {
                alert("⚠️ Some records failed to save.");
            }
        } catch (err) {
            console.error("Error saving attendance:", err);
            alert("❌ Server error while saving attendance.");
        }
    };

    const filteredEmployees = employees.filter((emp) =>
        (emp.username || emp.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const totalEmployees = employees.length;
    const statusCount = {
        Present: Object.values(attendance).filter((s) => s === "Present").length,
        Absent: Object.values(attendance).filter((s) => s === "Absent").length,
        Late: Object.values(attendance).filter((s) => s === "Late").length,
        Leave: Object.values(attendance).filter((s) => s === "Leave").length,
    };

    const pieData = Object.entries(statusCount).map(([key, value]) => ({
        name: key,
        value,
    }));

    const deptData = employees.reduce((acc, emp) => {
        const dept = emp.department || emp.position || "Unknown";
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
    }, {});
    const barData = Object.entries(deptData).map(([dept, count]) => ({
        department: dept,
        count,
    }));

    return (
        <div className="attendance-page">
            <div className="attendance-container">
                <h1 className="attendance-title">Employee Attendance</h1>

                {/* Summary Cards */}
                <div className="attendance-summary-cards">
                    <div className="summary-card total">
                        <h3>{totalEmployees}</h3>
                        <p>Total Employees</p>
                    </div>
                    <div className="summary-card present">
                        <h3>{statusCount.Present}</h3>
                        <p>Present</p>
                    </div>
                    <div className="summary-card absent">
                        <h3>{statusCount.Absent}</h3>
                        <p>Absent</p>
                    </div>
                    <div className="summary-card leave">
                        <h3>{statusCount.Leave}</h3>
                        <p>On Leave</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="attendance-charts">
                    <div className="chart-box">
                        <h3>Attendance Status Overview</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-box">
                        <h3>Employees by Department</h3>
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="department" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#2196F3" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Search + Date Section */}
                <div className="attendance-header">
                    <input
                        type="text"
                        placeholder="🔍 Search employee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>

                {/* Table Section */}
                <table className="attendance-table">
                    <thead>
                        <tr>
                            <th>S.NO</th>
                            <th>Employee Name</th>
                            <th>Department</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp, index) => {
                                const status = attendance[emp._id] || "";
                                return (
                                    <tr key={emp._id}>
                                        <td>{index + 1}</td>
                                        <td>{emp.username || emp.name || "Unnamed Employee"}</td>
                                        <td>{emp.department || emp.position || "-"}</td>
                                        <td>{selectedDate || "—"}</td>
                                        <td>
                                            <select
                                                className={`status-select ${status.toLowerCase()}`}
                                                value={status}
                                                onChange={(e) => handleStatusChange(emp._id, e.target.value)}
                                            >
                                                <option value="">Select</option>
                                                <option value="Present">Present</option>
                                                <option value="Absent">Absent</option>
                                                <option value="Late">Late</option>
                                                <option value="Leave">Leave</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="no-data">
                                    No employees found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <button className="save-btn" onClick={handleSaveAttendance}>
                    Save Attendance
                </button>
            </div>
        </div>
    );
};

export default AttendancePage;
