// src/pages/admin/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/adminDashboard.css";
import Swal from "sweetalert2";
import axios from "axios";
import {
    FaUsers,
    FaMoneyBillWave,
    FaChartLine,
    FaBell,
    FaBuilding,
    FaFileAlt,
    FaUserAlt,
} from "react-icons/fa";
import { NotificationStore } from "../../utils/NotificationStore";
import AdminActivityFeed from "../../components/AdminActivityFeed";

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [employeeCount, setEmployeeCount] = useState(0);
    const [departmentCount, setDepartmentCount] = useState(0);
    const [monthlyPayroll, setMonthlyPayroll] = useState(0);
    const [recentHires, setRecentHires] = useState([]);

    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // ------------------ NOTIFICATIONS ------------------
    useEffect(() => {
        const unsub = NotificationStore.subscribe((list) => {
            setNotifications(list);
        });

        setNotifications(NotificationStore.list());

        return () => unsub();
    }, []);

    // ------------------ FETCH FUNCTIONS ------------------
    const fetchRecentHires = async () => {
        try {
            const res = await axios.get("http://localhost:5000/employees");
            const employees = res.data.employees || [];
            const latest = employees
                .filter((emp) => emp.joinDate)
                .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
                .slice(0, 5);
            setRecentHires(latest);
        } catch (err) {
            console.error("Error fetching recent hires:", err);
        }
    };

    const fetchEmployeeCount = async () => {
        try {
            const res = await axios.get("http://localhost:5000/employees");
            setEmployeeCount(res.data.employees?.length || 0);
        } catch (err) {
            console.error("Error fetching employee count:", err);
        }
    };

    const fetchDepartmentCount = async () => {
        try {
            const res = await axios.get("http://localhost:5000/departments");
            setDepartmentCount(res.data.departments?.length || 0);
        } catch (err) {
            console.error("Error fetching department count:", err);
        }
    };

    const fetchPayroll = async () => {
        try {
            const res = await axios.get("http://localhost:5000/monthly-payroll/live");
            setMonthlyPayroll(res.data.totalPayroll || 0);
        } catch (err) {
            console.error("Error fetching payroll:", err);
        }
    };

    // ------------------ AUTO LIVE UPDATES ------------------
    useEffect(() => {
        // Initial load
        fetchEmployeeCount();
        fetchDepartmentCount();
        fetchPayroll();
        fetchRecentHires();

        // Auto-refresh every 5 seconds
        const interval = setInterval(() => {
            fetchEmployeeCount();
            fetchDepartmentCount();
            fetchPayroll();
            fetchRecentHires();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // -------------------------------------------------------
    return (
        <div className="admin-dashboard-container">
            {/* Notification Bell */}
            <div className="notification-wrapper">
                <FaBell
                    className="bell-icon"
                    onClick={() => setShowDropdown(!showDropdown)}
                />

                {notifications.length > 0 && (
                    <span className="notif-count">{notifications.length}</span>
                )}

                {showDropdown && (
                    <div className="notif-dropdown">
                        <h4>Notifications</h4>

                        {notifications.length === 0 ? (
                            <p className="empty-msg">No notifications</p>
                        ) : (
                            notifications.map((n, i) => (
                                <div key={i} className="notif-item">
                                    <p>{n.message}</p>
                                    <span>{n.time}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Main */}
            <main className="dashboard-content">
                <div className="dashboard-header">
                    <h1>Welcome, Admin!</h1>
                    <p>Manage employees, departments, and insights.</p>
                </div>

                {/* Cards */}
                <div className="cards-container">
                    <div className="card blue" onClick={() => navigate("/admin/employees")}>
                        <FaUsers className="card-icon" />
                        <div>
                            <h2>{employeeCount}</h2>
                            <p>Total Employees</p>
                        </div>
                    </div>

                    <div className="card purple" onClick={() => navigate("/admin/departments")}>
                        <FaBuilding className="card-icon" />
                        <div>
                            <h2>{departmentCount}</h2>
                            <p>Departments</p>
                        </div>
                    </div>

                    <div className="card green" onClick={() => navigate("/admin/monthly-payroll")}>
                        <FaMoneyBillWave className="card-icon" />
                        <div>
                            <h2>₹ {monthlyPayroll.toLocaleString()}</h2>
                            <p>Monthly Payroll</p>
                        </div>
                    </div>


                </div>

                {/* Wrapper for side-by-side on large screens */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
                    
                {/* Recent Hires */}
                <div className="recent-hires-container" style={{ flex: 2, minWidth: '400px', marginTop: 0 }}>
                    <h3 className="recent-title">
                        <FaFileAlt className="recent-icon" /> Recent Hires
                    </h3>

                    {recentHires.length > 0 ? (
                        <div className="recent-hires-grid">
                            {recentHires.map((emp, i) => (
                                <div className="hire-card" key={i}>
                                    <div className="hire-color-bar"></div>
                                    <div className="hire-content">
                                        <div className="hire-avatar">
                                            <FaUserAlt className="hire-avatar-icon" />
                                        </div>
                                        <div>
                                            <p className="hire-name">{emp.name || emp.username}</p>
                                            <p className="hire-role">{emp.position}</p>
                                            <p className="hire-date">
                                                Joined: {new Date(emp.joinDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No recent hires</p>
                    )}
                </div>
                <AdminActivityFeed />
               </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
