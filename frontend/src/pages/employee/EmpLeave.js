import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FiPlus,
  FiCalendar,
  FiUsers,
  FiClock,
} from "react-icons/fi";
import Swal from "sweetalert2";
import "../../styles/empLeavePremium.css";

const EmpLeave = () => {
  const userName =
    localStorage.getItem("empFullName") ||
    localStorage.getItem("empUsername") ||
    "Employee";

  const userKey =
    localStorage.getItem("empUsername") ||
    localStorage.getItem("username");

  const [showModal, setShowModal] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [teamLeaves, setTeamLeaves] = useState([]);
  const [activeTab, setActiveTab] = useState("My Requests");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: "Casual Leave",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  useEffect(() => {
    fetchLeaves();
    fetchTeamLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/employee/leaves/${encodeURIComponent(
          userName
        )}`
      );

      if (res.data?.success) {
        const normalized = res.data.leaves.map((l) => ({
          ...l,
          leaveType: l.leaveType || "Casual Leave",
          status: (l.status || "Pending").toLowerCase(),
        }));

        setLeaves(normalized);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeaves = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/employee/leaves/team"
      );

      if (res.data?.success) {
        setTeamLeaves(res.data.leaves || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const summary = useMemo(() => {
    const leaveLimits = {
      "Casual Leave": 12,
      "Sick Leave": 7,
      "Earned Leave": 10,
      "Comp Off": 2,
    };

    const used = {
      "Casual Leave": 0,
      "Sick Leave": 0,
      "Earned Leave": 0,
      "Comp Off": 0,
    };

    leaves.forEach((leave) => {
      if (used[leave.leaveType] !== undefined) {
        const days =
          Math.ceil(
            (new Date(leave.toDate) - new Date(leave.fromDate)) /
              86400000
          ) + 1;

        used[leave.leaveType] += days;
      }
    });

    return Object.keys(leaveLimits).map((type) => ({
      type,
      used: used[type],
      total: leaveLimits[type],
    }));
  }, [leaves]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const reqDays =
        Math.ceil(
          (new Date(formData.toDate) -
            new Date(formData.fromDate)) /
            86400000
        ) + 1;

      if (reqDays <= 0) {
        Swal.fire(
          "Invalid Dates",
          "End date must be after start date",
          "error"
        );
        return;
      }

      const leaveStat = summary.find(
        (s) => s.type === formData.leaveType
      );

      if (
        leaveStat &&
        leaveStat.used + reqDays > leaveStat.total
      ) {
        Swal.fire(
          "Rejected",
          "Leave limit exceeded",
          "error"
        );
        return;
      }

      const payload = {
        ...formData,
        employeeName: userKey || userName,
      };

      const res = await axios.post(
        "http://localhost:5000/employee/apply-leave",
        payload
      );

      if (res.data?.success) {
        Swal.fire(
          "Success",
          "Leave request submitted",
          "success"
        );

        setShowModal(false);

        setFormData({
          leaveType: "Casual Leave",
          fromDate: "",
          toDate: "",
          reason: "",
        });

        fetchLeaves();
        fetchTeamLeaves();
      }
    } catch (err) {
      console.error(err);

      Swal.fire(
        "Error",
        "Failed to submit leave request",
        "error"
      );
    }
  };

  return (
    <div className="leave-premium-container">
      <header className="leave-header-premium">
        <div>
          <h2>Leave Management</h2>
          <p>Request and track your time off</p>
        </div>

        <button
          className="apply-btn-premium"
          onClick={() => setShowModal(true)}
        >
          <FiPlus />
          Apply for Leave
        </button>
      </header>

      <div className="leave-stats-grid">
        {summary.map((item, index) => (
          <div className="leave-stat-card" key={index}>
            <h4>{item.type}</h4>

            <div className="count">
              {item.used}
              <span className="total">
                {" "}
                / {item.total} Days
              </span>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(
                    100,
                    (item.used / item.total) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="emp-tabs-premium">
        <button
          className={`emp-tab-btn ${
            activeTab === "My Requests" ? "active" : ""
          }`}
          onClick={() => setActiveTab("My Requests")}
        >
          <FiClock />
          My Requests
        </button>

        <button
          className={`emp-tab-btn ${
            activeTab === "Team" ? "active" : ""
          }`}
          onClick={() => setActiveTab("Team")}
        >
          <FiUsers />
          Team Status
        </button>

        <button
          className={`emp-tab-btn ${
            activeTab === "Holidays" ? "active" : ""
          }`}
          onClick={() => setActiveTab("Holidays")}
        >
          <FiCalendar />
          Holidays
        </button>
      </div>

      <div className="leave-table-section">
        {activeTab === "My Requests" && (
          <table className="leave-modern-table">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>

            <tbody>
              {leaves.map((leave, index) => (
                <tr key={index}>
                  <td>{leave.leaveType}</td>

                  <td>
                    {new Date(
                      leave.fromDate
                    ).toLocaleDateString()}{" "}
                    -
                    {new Date(
                      leave.toDate
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    {Math.ceil(
                      (new Date(leave.toDate) -
                        new Date(leave.fromDate)) /
                        86400000
                    ) + 1}
                  </td>

                  <td>
                    <span
                      className={`status-pill status-${leave.status}`}
                    >
                      {leave.status}
                    </span>
                  </td>

                  <td>{leave.reason || "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-premium">

            <h3>Apply for Leave</h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group-premium">
                <label>Leave Type</label>

                <select
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleChange}
                >
                  <option>Casual Leave</option>
                  <option>Sick Leave</option>
                  <option>Earned Leave</option>
                  <option>Comp Off</option>
                </select>
              </div>

              <div className="date-row">
                <div className="form-group-premium">
                  <label>From Date</label>

                  <input
                    type="date"
                    name="fromDate"
                    value={formData.fromDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group-premium">
                  <label>To Date</label>

                  <input
                    type="date"
                    name="toDate"
                    value={formData.toDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group-premium">
                <label>Reason</label>

                <textarea
                  name="reason"
                  rows="4"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Briefly explain your reason..."
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-submit"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpLeave;