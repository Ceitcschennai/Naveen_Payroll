import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/empEditProfilePremium.css";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCamera } from "react-icons/fi";
import Swal from "sweetalert2";

const EditEmployeeProfile = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem("empUsername") || localStorage.getItem("username");

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", dob: "", department: "",
    position: "", address: "", bankName: "", accountNo: "", ifsc: "", pan: "",
    gender: "", location: ""
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!username) return;
    axios.get("http://localhost:5000/employee/profile", { headers: { username } })
      .then(res => {
        if (res.data?.success && res.data.employee) {
          const emp = res.data.employee;
          setForm({
            fullName: emp.fullName || "",
            email: emp.email || "",
            phone: emp.phone || "",
            dob: emp.dob ? emp.dob.split("T")[0] : "",
            department: emp.department || "",
            position: emp.position || "",
            address: emp.address || "",
            bankName: emp.bankName || "",
            accountNo: emp.accountNo || "",
            ifsc: emp.ifsc || "",
            pan: emp.pan || "",
            gender: emp.gender || "",
            location: emp.location || ""
          });
          if (emp.profilePic) setPreview(`http://localhost:5000/uploads/${emp.profilePic}`);
        }
      })
      .catch(err => console.error(err));
  }, [username]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImage = e => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!username) return;

    try {
      const data = new FormData();
      Object.keys(form).forEach(k => data.append(k, form[k]));
      if (imageFile) data.append("profileImage", imageFile);

      const res = await axios.put("http://localhost:5000/employee/update-profile", data, {
        headers: { "Content-Type": "multipart/form-data", username }
      });

      if (res.data?.success) {
        Swal.fire({ title: "Profile Updated", icon: "success", timer: 1500, showConfirmButton: false });
        window.dispatchEvent(new Event("profileUpdated"));
        navigate("/employee/profile");
      } else {
        Swal.fire("Error", res.data?.message || "Update failed", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Server side issue occurred", "error");
    }
  };

  return (
    <div className="edit-premium-layout">
      <div className="edit-premium-container">
        <div className="back-btn-premium" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back to Profile
        </div>

        <header className="edit-header-premium">
          <h2>Edit My Profile</h2>
          <p>Update your personal and professional information</p>
        </header>

        <div className="edit-premium-card">
          <aside className="edit-left-avatar">
            <div className="avatar-preview-wrapper">
              <img src={preview || "https://cdn-icons-png.flaticon.com/512/9131/9131529.png"} alt="Preview" className="avatar-preview-big" />
            </div>
            <label className="upload-overlay-btn">
              <FiCamera /> Change Photo
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
            </label>
            <p style={{ marginTop: '20px', color: '#718096', fontSize: '13px', textAlign: 'center' }}>
              Upload a professional photo. Recommended size: 400x400px.
            </p>
          </aside>

          <form className="edit-right-form" onSubmit={handleSave}>
            <div className="form-grid-premium">
              <div className="form-group-premium full-width-form">
                <label>Full Name</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" />
              </div>
              <div className="form-group-premium">
                <label>Email Address</label>
                <input name="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
              </div>
              <div className="form-group-premium">
                <label>Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+1 234 567 890" />
              </div>
              <div className="form-group-premium">
                <label>Date of Birth</label>
                <input type="date" name="dob" value={form.dob} onChange={handleChange} />
              </div>
              <div className="form-group-premium">
                <label>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group-premium">
                <label>Department</label>
                <input name="department" value={form.department} readOnly style={{ background: '#f1f5f9', cursor: 'not-allowed' }} />
              </div>
              <div className="form-group-premium full-width-form">
                <label>Address</label>
                <textarea name="address" rows="3" value={form.address} onChange={handleChange} placeholder="Your residential address" />
              </div>
              <div className="form-group-premium">
                <label>Location</label>
                <input name="location" value={form.location} onChange={handleChange} placeholder="E.g. New York, NY" />
              </div>
              <div className="form-group-premium">
                <label>Bank Name</label>
                <input name="bankName" value={form.bankName} onChange={handleChange} />
              </div>
              <div className="form-group-premium">
                <label>Account Number</label>
                <input name="accountNo" value={form.accountNo} onChange={handleChange} />
              </div>
              <div className="form-group-premium">
                <label>IFSC Code</label>
                <input name="ifsc" value={form.ifsc} onChange={handleChange} />
              </div>
              <div className="form-group-premium">
                <label>PAN Number</label>
                <input name="pan" value={form.pan} onChange={handleChange} />
              </div>
            </div>

            <button type="submit" className="btn-save-premium">Save Major Changes</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeProfile;
