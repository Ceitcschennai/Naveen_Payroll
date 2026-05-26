import React, { useEffect, useState } from "react";
import "../../styles/empDashboardPremium.css";
import {
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaUserMinus,
  FaCalendarAlt,
  FaHistory
} from "react-icons/fa";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    leave: 0,
    late: 0
  });

  const employeeUsername =
    localStorage.getItem("empUsername") || "employee";

  const fetchProfile = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/employee/profile`,
        {
          headers: { username: employeeUsername }
        }
      );
      const data = await res.json();
      if (data.success) setProfile(data.employee);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  };

  const fetchRecentAttendance = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/attendance/history/${employeeUsername}`
      );
      const data = await res.json();

      if (data.success) {
        const sorted = data.records.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setRecentAttendance(sorted.slice(0, 5));

        const statObj = { present: 0, absent: 0, leave: 0, late: 0 };
        data.records.forEach((r) => {
          const status = r.status?.toLowerCase();
          if (status === "present") statObj.present++;
          else if (status === "absent") statObj.absent++;
          else if (status === "on leave" || status === "leave")
            statObj.leave++;
          else if (status === "late") statObj.late++;
        });
        setStats(statObj);
      }
    } catch (err) {
      console.error("Recent attendance fetch error:", err);
    }
  };

  useEffect(() => {
    fetchRecentAttendance();
    fetchProfile();

    window.addEventListener("profileUpdated", fetchProfile);

    const interval = setInterval(() => {
      const trigger = localStorage.getItem("refreshDashboard");
      if (trigger) {
        fetchRecentAttendance();
        localStorage.removeItem("refreshDashboard");
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("profileUpdated", fetchProfile);
    };
  }, []);

  const formatDate = (iso) => {
    try {
      const dt = new Date(iso);
      return dt.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="emp-dash-premium">
      {/* HEADER */}
      <header className="emp-dash-header">
        <div className="emp-welcome">
          <div className="emp-avatar-container">
            <img
              src={
                profile?.profilePic
                  ? `http://localhost:5000/uploads/${profile.profilePic}`
                  : "https://cdn-icons-png.flaticon.com/512/9131/9131529.png"
              }
              alt="user"
              className="emp-dash-avatar"
            />
            <span className="status-dot"></span>
          </div>
          <div>
            <h2>
              Welcome,{" "}
              {profile?.fullName ||
                profile?.username ||
                "Employee"}
              !
            </h2>
            <p className="emp-dash-sub">
              Here's your productivity overview for today.
            </p>
          </div>
        </div>

        <div className="emp-dash-date">
          <FaCalendarAlt className="calendar-icon" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </header>

      {/* STATS */}
      <div className="emp-stats-grid">
        <div className="emp-stat-card stat-present">
          <div className="card-icon">
            <FaUserCheck />
          </div>
          <div>
            <span className="label">Present Days</span>
            <div className="value">{stats.present}</div>
          </div>
        </div>

        <div className="emp-stat-card stat-absent">
          <div className="card-icon">
            <FaUserTimes />
          </div>
          <div>
            <span className="label">Days Absent</span>
            <div className="value">{stats.absent}</div>
          </div>
        </div>

        <div className="emp-stat-card stat-leave">
          <div className="card-icon">
            <FaUserMinus />
          </div>
          <div>
            <span className="label">Total Leaves</span>
            <div className="value">{stats.leave}</div>
          </div>
        </div>

        <div className="emp-stat-card stat-late">
          <div className="card-icon">
            <FaUserClock />
          </div>
          <div>
            <span className="label">Late Entries</span>
            <div className="value">{stats.late}</div>
          </div>
        </div>
      </div>

      {/* ATTENDANCE */}
      <section className="emp-attendance-container glass-panel">
        <h3>
          <FaHistory /> Recent Attendance History
        </h3>

        <div className="emp-table-wrapper">
          <table className="emp-modern-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Clock In</th>
                <th>Clock Out</th>
              </tr>
            </thead>

            <tbody>
              {recentAttendance.length > 0 ? (
                recentAttendance.map((r, i) => {
                  const statusClass = r.status
                    ?.toLowerCase()
                    .replace(" ", "-");
                  return (
                    <tr key={i}>
                      <td>{formatDate(r.date)}</td>
                      <td>
                        <span
                          className={`status-badge badge-${statusClass}`}
                        >
                          {r.status || "--"}
                        </span>
                      </td>
                      <td>{r.clockIn || "--"}</td>
                      <td>{r.clockOut || "--"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: "center",
                      padding: "40px"
                    }}
                  >
                    No recent records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
