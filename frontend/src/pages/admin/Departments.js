import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../../styles/departments.css";

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState({ name: "", empId: "", manager: "", description: "" });

    // ✅ Fetch all departments
    const fetchDepartments = async () => {
        try {
            const res = await axios.get("http://localhost:5000/departments");
            if (res.data && Array.isArray(res.data.departments)) {
                setDepartments(res.data.departments);
            } else {
                console.error("Invalid department data:", res.data);
                setDepartments([]);
            }
        } catch (err) {
            console.error("Error loading departments:", err);
            Swal.fire("Error", "Failed to load departments", "error");
        }
    };

    // ✅ Fetch all employees for manager dropdown
    const fetchEmployees = async () => {
        try {
            const res = await axios.get("http://localhost:5000/employees");
            setEmployees(res.data.employees || []);
        } catch (err) {
            console.error("Error loading employees:", err);
        }
    };

    useEffect(() => {
        fetchDepartments();
        fetchEmployees();
    }, []);

    // ✅ Handle manager selection
    const handleManagerChange = (e) => {
        const selectedValue = e.target.value;
        if (!selectedValue) {
            setForm({ ...form, empId: "", manager: "" });
            return;
        }
        const [empId, ...nameParts] = selectedValue.split(" - ");
        const manager = nameParts.join(" - ");
        setForm({ ...form, empId: empId.trim(), manager: manager.trim() });
    };

    // ✅ Add new department
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/departments", {
                name: form.name,
                empId: form.empId,
                manager: form.manager,
                description: form.description,
            });
            if (res.data.success) {
                Swal.fire("Added!", "Department added successfully", "success");
                setForm({ name: "", empId: "", manager: "", description: "" });
                fetchDepartments();
            } else {
                Swal.fire("Error", res.data.message || "Failed to add department", "error");
            }
        } catch (err) {
            console.error("Error adding department:", err);
            Swal.fire("Error", "Failed to add department", "error");
        }
    };

    // ✅ Delete department
    const handleDelete = async (id) => {
        try {
            const res = await axios.delete(`http://localhost:5000/departments/${id}`);
            if (res.data.success) {
                Swal.fire("Deleted!", "Department deleted successfully", "success");
                fetchDepartments();
            } else {
                Swal.fire("Error", res.data.message || "Failed to delete department", "error");
            }
        } catch (err) {
            console.error("Error deleting department:", err);
            Swal.fire("Error", "Failed to delete department", "error");
        }
    };

    return (
        <div className="departments-container">
            <div className="departments-header">
                <h2>🏢 Departments</h2>
                <span className="dept-count">Total: {departments.length}</span>
            </div>

            <form className="department-form" onSubmit={handleSubmit}>
                <h3>Add New Department</h3>
                <input
                    type="text"
                    placeholder="Department Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />

                <select
                    value={form.empId && form.manager ? `${form.empId} - ${form.manager}` : ""}
                    onChange={handleManagerChange}
                    required
                >
                    <option value="">Select Manager</option>
                    {employees.map((emp) => {
                        const id = emp.employeeId || emp.EMP_ID || "";
                        const name = emp.name || emp.EMP_NAME || emp.username || "";
                        if (!id || !name) return null;
                        return (
                            <option key={id} value={`${id} - ${name}`}>
                                {id} - {name}
                            </option>
                        );
                    })}
                </select>

                <textarea
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <button type="submit" className="add-btn">➕ Add Department</button>
            </form>

            <div className="department-list">
                {departments.length > 0 ? (
                    <table className="dept-table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Employee ID</th>
                                <th>Manager Name</th>
                                <th>Description</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map((dept) => (
                                <tr key={dept.name}>
                                    <td>{dept.name}</td>
                                    <td>{dept.empId || "—"}</td>
                                    <td>{dept.manager || "—"}</td>
                                    <td>{dept.description || "—"}</td>
                                    <td>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(dept.name)}
                                        >
                                            🗑 Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data">No departments found.</p>
                )}
            </div>
        </div>
    );
};

export default Departments;