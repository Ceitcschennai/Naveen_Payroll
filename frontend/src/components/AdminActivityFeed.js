import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaUserPlus, FaUserMinus, FaUserEdit, FaMoneyCheckAlt, FaCalendarCheck, FaInfoCircle } from "react-icons/fa";
import "../styles/adminDashboard.css"; // Reuse card dashboard styles

const AdminActivityFeed = () => {
    const [activities, setActivities] = useState([]);

    const fetchActivities = async () => {
        try {
            const res = await axios.get("http://localhost:5000/admin/activity");
            if (res.data && res.data.success) {
                setActivities(res.data.activities);
            }
        } catch (err) {
            console.error("Error fetching admin activity:", err);
        }
    };

    useEffect(() => {
        fetchActivities();
        const interval = setInterval(fetchActivities, 5000);
        return () => clearInterval(interval);
    }, []);

    const getIconForMessage = (msg) => {
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes("added")) return <FaUserPlus className="act-icon text-green" style={{ color: '#10b981' }}/>;
        if (lowerMsg.includes("removed")) return <FaUserMinus className="act-icon text-red" style={{ color: '#ef4444' }}/>;
        if (lowerMsg.includes("updated")) return <FaUserEdit className="act-icon text-blue" style={{ color: '#3b82f6' }}/>;
        if (lowerMsg.includes("payroll")) return <FaMoneyCheckAlt className="act-icon text-purple" style={{ color: '#8b5cf6' }}/>;
        if (lowerMsg.includes("leave")) return <FaCalendarCheck className="act-icon text-orange" style={{ color: '#f59e0b' }}/>;
        return <FaInfoCircle className="act-icon text-gray" style={{ color: '#6b7280' }}/>;
    };

    return (
        <div className="activity-feed-container" style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            flex: 1, /* Allow side by side if used in flex container */
            minWidth: "300px",
            maxHeight: "410px",
            overflowY: "auto"
        }}>
            <h3 style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: "10px", marginBottom: "15px", color: "#1f2937", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ background: "#e0e7ff", padding: "6px", borderRadius: "50%", display: "inline-flex" }}><FaInfoCircle color="#4f46e5" /></span>
                System Activity Log
            </h3>
            
            {activities.length === 0 ? (
                <p style={{ color: "#6b7280", textAlign: "center" }}>No recent activity.</p>
            ) : (
                <div className="activity-list" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {activities.map((act) => (
                        <div key={act.ACTIVITY_ID} className="activity-item" style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                            <div className="activity-icon-container" style={{ marginTop: "2px" }}>
                                {getIconForMessage(act.MESSAGE)}
                            </div>
                            <div className="activity-details" style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: "0.95rem", color: "#374151" }}>
                                    {act.MESSAGE}
                                </p>
                                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                                    {act.displayName || act.EMP_ID}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminActivityFeed;
