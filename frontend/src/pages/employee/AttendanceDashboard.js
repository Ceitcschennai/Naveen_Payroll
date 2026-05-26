import React, { useEffect, useState, useRef } from "react";
import "../../styles/empAttendancePremium.css";
import { FaClock, FaCalendarAlt, FaCheckCircle, FaRunning } from "react-icons/fa";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDate = (iso) => {
  try {
    const [y, m, d] = iso.split("-");
    const dt = new Date(y, m - 1, d);
    return `${MONTH_NAMES[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
  } catch {
    return iso;
  }
};

export default function AttendanceDashboard() {
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [elapsed, setElapsed] = useState("00:00:00");

  const timerRef = useRef(null);
  // ✅ FIXED KEY: matching new dashboard and login
  const employeeName = localStorage.getItem("empUsername") || localStorage.getItem("username") || "employee";

  /* ================= FETCH DATA ================= */

  const fetchHistory = async () => {
    try {
      const res = await fetch(`http://localhost:5000/attendance/history/${employeeName}`);
      const data = await res.json();
      if (data.success) setRecords(data.records);
    } catch (err) { console.error(err); }
  };

  const fetchToday = async () => {
    try {
      const res = await fetch(`http://localhost:5000/attendance/today/${employeeName}`);
      const data = await res.json();
      if (data.success) {
        setTodayRecord(data.record);
        if (data.record?.clockIn && !data.record?.clockOut) {
          setIsClockedIn(true);
          startTimer(data.record);
        } else {
          stopTimer();
          setIsClockedIn(false);
        }
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchHistory();
    fetchToday();
    return stopTimer;
  }, []);

  /* ================= TIMER ================= */

  const startTimer = (record) => {
    stopTimer();
    timerRef.current = setInterval(() => {
      const start = new Date(`${record.date} ${record.clockIn}`);
      const diff = Date.now() - start;
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff / 60000) % 60)).padStart(2, "0");
      const s = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    setElapsed("00:00:00");
  };

  /* ================= CLOCK ACTIONS ================= */

  const handleClockIn = async () => {
    await fetch("http://localhost:5000/attendance/clock-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeName })
    });
    fetchToday();
    fetchHistory();
  };

  const handleClockOut = async () => {
    await fetch("http://localhost:5000/attendance/clock-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeName })
    });
    fetchToday();
    fetchHistory();
  };

  return (
    <div className="att-premium-container">
      <header className="att-header-premium">
        <h2>Attendance Overview</h2>
        <p>Monitor your daily work hours and status</p>
      </header>

      {/* TOP GRID */}
      <div className="att-top-grid-premium">
        {/* TODAY CARD */}
        <div className="att-glass-card att-card-today" style={{ background: 'white' }}>
          <div className="att-card-header">
            <span>Current Status</span>
            <strong><FaCalendarAlt /> {formatDate(new Date().toISOString().split("T")[0])}</strong>
          </div>

          <div className="clock-info-row">
            <div className="info-item">
              <label>Clock In</label>
              <span>{todayRecord?.clockIn || "--:--"}</span>
            </div>
            <div className="info-item">
              <label>Clock Out</label>
              <span>{todayRecord?.clockOut || "--:--"}</span>
            </div>
          </div>

          <div className={`att-status-badge ${isClockedIn ? "working" : "done"}`}>
            {isClockedIn ? (
              <><FaClock /> Working — {elapsed}</>
            ) : todayRecord?.clockOut ? (
              <><FaCheckCircle /> Shift Completed</>
            ) : (
              <><FaRunning /> Ready to Start</>
            )}
          </div>

          <div className="att-btn-row">
            <button
              className="att-btn att-btn-primary"
              onClick={handleClockIn}
              disabled={todayRecord?.clockIn && !todayRecord?.clockOut}
            >
              Clock In
            </button>
            <button
              className="att-btn att-btn-danger"
              onClick={handleClockOut}
              disabled={!todayRecord?.clockIn || todayRecord?.clockOut}
            >
              Clock Out
            </button>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="att-glass-card" style={{ background: 'white' }}>
          <div className="att-card-header">
            <span>Today's Summary</span>
          </div>

          <div className="att-summary-content">
            <div className="summary-line">
              <span>Shift Progress</span>
              <strong>{isClockedIn ? "Active" : todayRecord?.clockOut ? "Completed" : "Offline"}</strong>
            </div>
            <div className="summary-line">
              <span>Worked Hours</span>
              <strong>{todayRecord?.totalHours || (isClockedIn ? elapsed : "--")}</strong>
            </div>
            <div className="summary-line">
              <span>Total Records</span>
              <strong>{records.length} Days</strong>
            </div>
          </div>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <section className="att-history-section" style={{ background: 'white' }}>
        <h3>Attendance History</h3>
        <div className="att-table-wrapper">
          <table className="att-modern-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? records.map((r, i) => (
                <tr key={i}>
                  <td>{formatDate(r.date)}</td>
                  <td>{r.clockIn || "--:--"}</td>
                  <td>{r.clockOut || "--:--"}</td>
                  <td><strong>{r.totalHours || "--"}</strong></td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "50px" }}>No history found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
