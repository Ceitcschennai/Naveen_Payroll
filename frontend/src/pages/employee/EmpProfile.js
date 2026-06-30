import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiEdit2,
  FiCheckCircle,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiBriefcase,
  FiCreditCard,
  FiFileText,
} from "react-icons/fi";
import "../../styles/empProfilePremium.css";
import { useNavigate } from "react-router-dom";

const Tab = ({ children, active, onClick }) => (
  <button
    type="button"
    className={`profile-tab-btn ${active ? "active" : ""}`}
    onClick={onClick}
  >
    {children}
  </button>
);

/**
 * Calculates years and remaining months of service from a given joinDate to today.
 * Correctly handles month-boundary edge cases: if the current day-of-month is
 * before the join day-of-month, one month is subtracted from the total months count.
 *
 * @param {string|Date} joinDate - The employee's join date.
 * @returns {string} e.g. "3 Years 3 Months", "0 Years 5 Months", or "Not Available".
 */
const getYearsOfService = (joinDate) => {
  if (!joinDate) return "Not Available";

  const start = new Date(joinDate);
  if (isNaN(start.getTime())) return "Not Available";

  const today = new Date();

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();

  // If the current day-of-month hasn't yet reached the join day-of-month,
  // the current month is not yet complete — subtract one month.
  if (today.getDate() < start.getDate()) {
    months -= 1;
  }

  // Normalise: negative months roll back a year
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return `${years} ${years === 1 ? "Year" : "Years"} ${months} ${months === 1 ? "Month" : "Months"}`;
};

const EmpProfile = () => {
  const navigate = useNavigate();
  const username =
    localStorage.getItem("empUsername") || localStorage.getItem("username");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    axios
      .get("http://localhost:5000/employee/profile", {
        headers: { username },
      })
      .then((res) => {
        if (res.data?.success && res.data.employee) {
          setProfile(res.data.employee);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="pf-loading">Loading your profile...</div>;
  if (!profile)
    return (
      <div className="pf-empty">
        Profile data not found. Please login again.
      </div>
    );

  /* ---------------- SAFE FALLBACK VALUES ---------------- */
  const fullName =
    profile.fullName ||
    profile.name ||
    profile.username ||
    "--";

  const avatarSrc = profile.profilePic
    ? `http://localhost:5000/uploads/${profile.profilePic}`
    : "https://cdn-icons-png.flaticon.com/512/9131/9131529.png";

  /* ---------------- PROFILE COMPLETENESS ---------------- */
  const completenessKeys = [
    fullName,
    profile.email,
    profile.phone,
    profile.dob,
    profile.address,
    profile.bankName,
  ];
  const filled = completenessKeys.filter(Boolean).length;
  const pct = Math.round((filled / completenessKeys.length) * 100);

  return (
    <div className="profile-premium-container">
      {/* ================= TOP BAR ================= */}
      <div className="profile-top-bar">
        <div className="profile-title-area">
          <h1>My Profile</h1>
          <p>Personalize and manage your professional identity</p>
        </div>

        <div className="completion-widget">
          <div>
            <div className="completion-label">Completeness</div>
            <div className="completion-bar-outer">
              <div
                className="completion-bar-inner"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <strong className="completion-percent">{pct}%</strong>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="profile-main-grid">
        {/* -------- LEFT CARD -------- */}
        <aside className="profile-left-card">
          <img
            src={avatarSrc}
            alt="Profile"
            className="profile-avatar-big"
          />

          <h3 className="profile-name">{fullName}</h3>
          <div className="profile-role-badge">
            {profile.position || "Employee"}
          </div>
          <div className="profile-dept-tag">
            {profile.department || "General"}
          </div>

          <div className="profile-mini-info">
            <div className="mini-info-row">
              <span className="key">Employee ID</span>
              <span className="val">
                {profile.employeeId || "EMP-001"}
              </span>
            </div>

            <div className="mini-info-row">
              <span className="key">Email</span>
              <span className="val">{profile.email || "--"}</span>
            </div>

            <div className="mini-info-row">
              <span className="key">Joined</span>
              <span className="val">
                {profile.joinDate
                  ? new Date(profile.joinDate).toLocaleDateString()
                  : "--"}
              </span>
            </div>
          </div>

          <div className="profile-actions-grid">
            <button
              className="btn-premium-action btn-solid"
              onClick={() => navigate("/employee/profile/edit")}
            >
              <FiEdit2 /> Edit Profile
            </button>
          </div>
        </aside>

        {/* -------- RIGHT CONTENT -------- */}
        <section className="profile-right-content">
          <nav className="profile-tabs-nav">
            {["Overview", "Personal", "Finance"].map((t) => (
              <Tab
                key={t}
                active={tab === t}
                onClick={() => setTab(t)}
              >
                {t}
              </Tab>
            ))}
          </nav>

          <div className="profile-tab-body">
            {/* ===== OVERVIEW ===== */}
            {tab === "Overview" && (
              <div className="overview-content">
                <h4>
                  Welcome back, {fullName.split(" ")[0]}!
                </h4>

                <div className="info-grid-premium">
                  <div className="data-group">
                    <label>
                      <FiCalendar /> Birthday
                    </label>
                    <p>
                      {profile.dob
                        ? new Date(profile.dob).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>

                  <div className="data-group">
                    <label>
                      <FiMapPin /> Location
                    </label>
                    <p>
                      {profile.location ||
                        profile.address ||
                        "Not set"}
                    </p>
                  </div>

                  {/* Replaced Experience (always 0) with dynamically calculated Years of Service */}
                  <div className="data-group">
                    <label>
                      <FiBriefcase /> Years of Service
                    </label>
                    <p>{getYearsOfService(profile.joinDate)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PERSONAL ===== */}
            {tab === "Personal" && (
              <div className="info-grid-premium">
                <div className="data-group">
                  <label>
                    <FiUser /> Full Name
                  </label>
                  <p>{fullName}</p>
                </div>

                <div className="data-group">
                  <label>
                    <FiMail /> Email
                  </label>
                  <p>{profile.email || "--"}</p>
                </div>

                <div className="data-group">
                  <label>
                    <FiPhone /> Phone
                  </label>
                  <p>{profile.phone || "--"}</p>
                </div>

                <div className="data-group">
                  <label>
                    <FiMapPin /> Address
                  </label>
                  <p>{profile.address || "--"}</p>
                </div>
              </div>
            )}

            {/* ===== FINANCE ===== */}
            {tab === "Finance" && (
              <div className="info-grid-premium">
                <div className="data-group">
                  <label>
                    <FiCreditCard /> Bank Name
                  </label>
                  <p>{profile.bankName || "--"}</p>
                </div>

                <div className="data-group">
                  <label>
                    <FiFileText /> Account Number
                  </label>
                  <p>{profile.accountNo || "--"}</p>
                </div>

                <div className="data-group">
                  <label>
                    <FiCheckCircle /> IFSC Code
                  </label>
                  <p>{profile.ifsc || "--"}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmpProfile;