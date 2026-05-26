import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FiCheck, FiX, FiClock } from "react-icons/fi";
// We can use a basic table style or reuse existing styles if we want.
// For now let's use some inline/basic classes or a dedicated css file.
import "../../styles/MonthlyPayroll.css"; // Reuse table styles

const LeaveApprovals = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const res = await axios.get("http://localhost:5000/employee/leaves/team");
            if (res.data && res.data.success) {
                setLeaves(res.data.leaves);
            }
        } catch (err) {
            console.error("Error fetching leaves:", err);
            Swal.fire("Error", "Could not fetch leave requests", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaves();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        try {
            const res = await axios.put(`http://localhost:5000/admin/leaves/${id}/status`, { status });
            if (res.data && res.data.success) {
                Swal.fire("Success", `Leave request ${status} successfully!`, "success");
                fetchLeaves();
            } else {
                Swal.fire("Error", "Failed to update leave status", "error");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            Swal.fire("Error", "Server error updating leave status", "error");
        }
    };

    return (
        <div className="payroll-container" style={{ padding: "30px", minHeight: "100vh" }}>
            <h2 className="payroll-title" style={{ marginBottom: "20px" }}>🛡️ Leave Approvals</h2>
            
            <div className="payroll-table-section">
                <h3>Employee Leave Requests</h3>
                
                {loading ? (
                    <p>Loading requests...</p>
                ) : (
                    <table className="leave-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Type</th>
                                <th>Duration</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center" }}>No leave requests found</td>
                                </tr>
                            ) : (
                                leaves.map((l) => (
                                    <tr key={l.LEAVE_ID}>
                                        <td><strong>{l.employeeName}</strong></td>
                                        <td>{l.leaveType}</td>
                                        <td>
                                            {new Date(l.fromDate).toLocaleDateString()} - {new Date(l.toDate).toLocaleDateString()}
                                        </td>
                                        <td>{l.reason || "--"}</td>
                                        <td>
                                            <span style={{
                                                padding: "5px 10px", 
                                                borderRadius: "20px",
                                                fontWeight: "bold",
                                                fontSize: "0.85rem",
                                                textTransform: "capitalize",
                                                backgroundColor: l.status === 'approved' ? '#d1fae5' : l.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                                color: l.status === 'approved' ? '#065f46' : l.status === 'rejected' ? '#991b1b' : '#92400e'
                                            }}>
                                                {l.status}
                                            </span>
                                        </td>
                                        <td>
                                            {l.status === 'pending' ? (
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(l.LEAVE_ID, 'approved')}
                                                        style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <FiCheck /> Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateStatus(l.LEAVE_ID, 'rejected')}
                                                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <FiX /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <FiClock /> Processed
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default LeaveApprovals;
