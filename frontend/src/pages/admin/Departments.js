import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "../../styles/departments.css";

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [form, setForm] = useState({ name: "", manager: "", description: "" });

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

    useEffect(() => {
        fetchDepartments();
    }, []);

    // ✅ Add new department
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/departments", form);
            if (res.data.success) {
                Swal.fire("Added!", "Department added successfully", "success");
                setForm({ name: "", manager: "", description: "" });
                fetchDepartments(); // refresh list + count
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
                <input
                    type="text"
                    placeholder="Manager"
                    value={form.manager}
                    onChange={(e) => setForm({ ...form, manager: e.target.value })}
                    required
                />
                <textarea
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <button type="submit" className="add-btn">➕ Add Department</button>
            </form>

            <div className="department-list">
                {departments.length > 0 ? (
                    departments.map((dept) => (
                        <div key={dept.name} className="department-card">
                            <div className="department-info">
                                <h4>{dept.name}</h4>
                                <p><strong>Manager:</strong> {dept.manager}</p>
                                {dept.description && <p>{dept.description}</p>}
                            </div>
                            <button
                                className="delete-btn"
                                onClick={() => handleDelete(dept.name)}
                            >
                                🗑 Delete
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="no-data">No departments found.</p>
                )}
            </div>
        </div>
    );
};

export default Departments;
