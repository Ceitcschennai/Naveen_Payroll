import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/onsiteEmployees.css";
import Swal from "sweetalert2";
import {
    ComposableMap,
    Geographies,
    Geography,
} from "react-simple-maps";

// ✅ Reliable world map source
const geoUrl =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const OnsiteEmployees = () => {
    const [allEmployees, setAllEmployees] = useState([]);
    const [onsiteEmployees, setOnsiteEmployees] = useState([]);
    const [selectedCountry, setSelectedCountry] = useState("All");
    const [loading, setLoading] = useState(false);

    const countries = [
        "All",
        "USA",
        "UK",
        "Germany",
        "Australia",
        "Singapore",
    ];

    /* ================= FETCH DATA ================= */

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [empRes, onsiteRes] = await Promise.all([
                axios.get("http://localhost:5000/employees"),
                axios.get("http://localhost:5000/api/employees/onsite"),
            ]);

            console.log("EMPLOYEES:", empRes.data);
            console.log("ONSITE:", onsiteRes.data);

            setAllEmployees(empRes.data.employees || []);
            setOnsiteEmployees(onsiteRes.data || []);
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    /* ================= CURRENCY ================= */

    const getCurrency = (country) => {
        const map = {
            USA: "USD ($)",
            UK: "GBP (£)",
            Germany: "EUR (€)",
            Australia: "AUD (A$)",
            Singapore: "SGD (S$)",
        };

        return map[country] || "INR (₹)";
    };

    /* ================= ASSIGN EMPLOYEE ================= */

    const assignCountry = async (empId, country) => {
        try {
            if (!empId) {
                Swal.fire(
                    "Warning",
                    "Please select an employee first",
                    "warning"
                );
                return;
            }

            // ✅ FIXED EMPLOYEE FIND
            const emp = allEmployees.find(
                (e) =>
                    String(e.employeeId || e._id || e.EMP_ID) ===
                    String(empId)
            );

            console.log("FOUND EMPLOYEE:", emp);

            if (!emp) {
                Swal.fire(
                    "Error",
                    "Selected employee not found",
                    "error"
                );
                return;
            }

            // ✅ SAFE PAYLOAD
            const payload = {
    empId:
        emp.employeeId ||
        emp._id ||
        emp.EMP_ID,

    name:
        emp.username ||
        emp.name ||
        emp.EMP_NAME ||
        "Employee",

    role:
        emp.position ||
        emp.role ||
        emp.EMP_DESIGNATION ||
        "Employee",

    email:
        emp.email ||
        emp.EMP_EMAIL ||
        "",

    location: country || "",
    localTime: new Date().toLocaleTimeString(),
    currency: getCurrency(country),
    status: "Active",
};
            console.log("PAYLOAD:", payload);

            // ✅ VALIDATION
            if (!payload.email) {
                Swal.fire(
                    "Error",
                    "Employee email missing",
                    "error"
                );
                return;
            }

            setLoading(true);

            const response = await axios.post(
                "http://localhost:5000/api/employees/onsite",
                payload
            );

            console.log("RESPONSE:", response.data);

            if (response.status === 201 || response.status === 200) {
                // ✅ ADD TO TABLE INSTANTLY
                setOnsiteEmployees((prev) => [
                    ...prev,
                    {
                        ...payload,
                    },
                ]);

                Swal.fire({
                    icon: "success",
                    title: "Assigned!",
                    text: `${payload.name} has been assigned to ${country}.`,
                    confirmButtonColor: "#4634eb",
                });
            }
        } catch (error) {
            console.error("FULL ERROR:", error);

            console.error(
                "BACKEND ERROR:",
                error?.response?.data
            );

            Swal.fire(
                "❌ Error",
                error?.response?.data?.message ||
                    "Failed to assign employee",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    /* ================= REMOVE EMPLOYEE ================= */

    const removeEmployee = async (email) => {
        const confirm = await Swal.fire({
            title: "Are you sure?",
            text: "This will remove the employee from the onsite list.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, remove",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#e63946",
            cancelButtonColor: "#6c757d",
            background: "#fff",
            color: "#333",
            reverseButtons: true,
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete(
                "http://localhost:5000/api/employees/onsite",
                {
                    data: { email },
                }
            );

            setOnsiteEmployees((prev) =>
                prev.filter((emp) => emp.email !== email)
            );

            Swal.fire({
                icon: "success",
                title: "Removed!",
                text: "Employee removed successfully.",
                confirmButtonColor: "#4634eb",
            });
        } catch (error) {
            console.error(error);

            Swal.fire(
                "❌ Error",
                "Failed to remove employee",
                "error"
            );
        }
    };

    /* ================= FILTER ================= */

    const filteredEmployees =
        selectedCountry === "All"
            ? onsiteEmployees
            : onsiteEmployees.filter(
                  (emp) =>
                      emp.location?.toLowerCase() ===
                      selectedCountry.toLowerCase()
              );

    const getCount = (country) =>
        country === "All"
            ? onsiteEmployees.length
            : onsiteEmployees.filter(
                  (e) =>
                      e.location?.toLowerCase() ===
                      country.toLowerCase()
              ).length;

    /* ================= UI ================= */

    return (
        <div className="onsite-container">
            <h2 className="onsite-title">
                🌍 Onsite Employees
            </h2>

            <p className="onsite-subtitle">
                Manage employees working from
                international locations
            </p>

            <div className="onsite-top">

                {/* LEFT SECTION */}
                <div className="country-section">
                    <h3>Distribution by Country</h3>

                    {countries.map((country) => (
                        <button
                            key={country}
                            className={`country-btn ${
                                selectedCountry === country
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() =>
                                setSelectedCountry(country)
                            }
                        >
                            {country}

                            <span className="count">
                                {getCount(country)}
                            </span>
                        </button>
                    ))}
                </div>

                {/* MAP */}
                <div className="map-section">
                    <h3>Global Distribution</h3>

                    <div className="map-container">
                        <ComposableMap
                            projectionConfig={{ scale: 140 }}
                            width={800}
                            height={400}
                        >
                            <Geographies geography={geoUrl}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const name =
                                            geo.properties.name;

                                        const countryNameMap = {
                                            "United States of America":
                                                "USA",
                                            "United Kingdom":
                                                "UK",
                                            Germany: "Germany",
                                            Australia:
                                                "Australia",
                                            Singapore:
                                                "Singapore",
                                        };

                                        const mapped =
                                            countryNameMap[name];

                                        const hasEmployees =
                                            mapped &&
                                            onsiteEmployees.some(
                                                (emp) =>
                                                    emp.location?.toLowerCase() ===
                                                    mapped.toLowerCase()
                                            );

                                        const countryColors = {
                                            USA: "#4caf50",
                                            UK: "#2196f3",
                                            Germany:
                                                "#ff9800",
                                            Australia:
                                                "#9c27b0",
                                            Singapore:
                                                "#f44336",
                                        };

                                        const fillColor =
                                            hasEmployees
                                                ? countryColors[
                                                      mapped
                                                  ] || "#ccc"
                                                : "#e0e0e0";

                                        return (
                                            <Geography
                                                key={
                                                    geo.rsmKey
                                                }
                                                geography={
                                                    geo
                                                }
                                                fill={
                                                    fillColor
                                                }
                                                stroke="#fff"
                                                strokeWidth={
                                                    0.5
                                                }
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        </ComposableMap>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="onsite-table-container">
                <table className="onsite-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Location</th>
                            <th>Role</th>
                            <th>Email</th>
                            <th>Currency</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp, i) => (
                                <tr key={i}>
                                    <td>{emp.name}</td>
                                    <td>{emp.location}</td>
                                    <td>{emp.role}</td>
                                    <td>{emp.email}</td>
                                    <td>{emp.currency}</td>

                                    <td>
                                        <span className="status-badge active">
                                            {emp.status}
                                        </span>
                                    </td>

                                    <td>
                                        <button
                                            className="remove-btn"
                                            onClick={() =>
                                                removeEmployee(
                                                    emp.email
                                                )
                                            }
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="no-data"
                                >
                                    No employees found for{" "}
                                    {selectedCountry}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ASSIGN SECTION */}
            <div className="assign-section">
                <h3>
                    Assign Employee to Country
                </h3>

                <div className="assign-form">

                    {/* EMPLOYEE SELECT */}
                    <select id="employeeSelect">
                        <option value="">
                            Select Employee
                        </option>

                        {allEmployees.map((e, index) => (
                            <option
                                key={
                                    e.employeeId ||
                                    e._id ||
                                    e.EMP_ID ||
                                    index
                                }
                                value={
                                    e.employeeId ||
                                    e._id ||
                                    e.EMP_ID
                                }
                            >
                                {e.username ||
                                    e.name ||
                                    e.EMP_NAME}
                            </option>
                        ))}
                    </select>

                    {/* COUNTRY SELECT */}
                    <select id="countrySelect">
                        {countries
                            .filter((c) => c !== "All")
                            .map((c) => (
                                <option key={c}>
                                    {c}
                                </option>
                            ))}
                    </select>

                    {/* BUTTON */}
                    <button
                        disabled={loading}
                        onClick={() =>
                            assignCountry(
                                document.getElementById(
                                    "employeeSelect"
                                ).value,
                                document.getElementById(
                                    "countrySelect"
                                ).value
                            )
                        }
                    >
                        {loading
                            ? "Assigning..."
                            : "Assign"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnsiteEmployees;