import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FiDollarSign, FiDownload, FiInfo, FiTrendingUp } from "react-icons/fi";
import "../../styles/empPayrollPremium.css";

const MonthlyPayroll = () => {
  const [employee, setEmployee] = useState(null);
  const [personalSummary, setPersonalSummary] = useState({
    basicSalary: 0,
    bonus: 0,
    deductions: 0,
    netPay: 0,
  });

  const empUsername = localStorage.getItem("empUsername") || localStorage.getItem("username");

  const fetchPayrollData = async () => {
    try {
      if (!empUsername) {
        Swal.fire("Error", "User details not found. Please log in again.", "error");
        return;
      }

      const res = await axios.get(`http://localhost:5000/employees/username/${empUsername}`);
      if (res.data && res.data.success && res.data.employee) {
        const emp = res.data.employee;
        const basic = Number(emp.salary || 0);
        const bonus = basic * 0.1;
        const deductions = basic * 0.03;
        const netPay = basic + bonus - deductions;

        setEmployee(emp);
        setPersonalSummary({ basicSalary: basic, bonus, deductions, netPay });
      } else {
        Swal.fire("Error", "Employee payroll record not found", "error");
      }
    } catch (err) {
      console.error("Error fetching personal payroll data:", err);
      Swal.fire("Error", "Failed to load individual payroll data", "error");
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, []);

  const generatePayslipPDF = (emp) => {
    if (!emp) return;
    const basic = Number(emp.salary || 0);
    const bonus = basic * 0.1;
    const deductions = basic * 0.03;
    const netPay = basic + bonus - deductions;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    // Add border
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(1);
    doc.rect(5, 5, 200, 287);
    
    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(5, 5, 200, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("CeiTCS Pvt Ltd.", 15, 20);
    
    doc.setFontSize(14);
    doc.text("Official Monthly Payslip", 15, 28);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 190, 20, { align: "right" });
    
    // Reset text color for body
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Employee Details", 15, 45);
    doc.line(15, 47, 75, 47);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Employee Name: ${emp.fullName || emp.username || emp.name || "--"}`, 15, 55);
    doc.text(`Department: ${emp.department?.toUpperCase() || "GENERAL"}`, 15, 62);
    doc.text(`Designation: ${emp.position?.toUpperCase() || "--"}`, 115, 55);
    doc.text(`Month & Year: ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`, 115, 62);
    
    // Format amounts
    const fmtBasic = basic.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtBonus = bonus.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDeductions = deductions.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtNet = netPay.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    doc.autoTable({
      startY: 75,
      head: [["Earnings", "Amount (INR)", "Deductions", "Amount (INR)"]],
      body: [
        ["Basic Salary", fmtBasic, "Tax / PF (3%)", fmtDeductions],
        ["Bonus (10%)", fmtBonus, "", ""],
      ],
      foot: [
        ["Gross Earnings", (basic + bonus).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "Total Deductions", fmtDeductions]
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold" },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" },
      styles: { fontSize: 10, cellPadding: 4, halign: "center" },
      columnStyles: {
        0: { halign: 'left', cellWidth: 50 },
        1: { halign: 'right', cellWidth: 40 },
        2: { halign: 'left', cellWidth: 50 },
        3: { halign: 'right', cellWidth: 40 },
      }
    });

    const netY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 138);
    // Draw a box around net pay
    doc.setDrawColor(30, 58, 138);
    doc.setFillColor(245, 247, 250);
    doc.rect(13, netY - 5, 184, 12, 'FD');
    doc.text(`NET PAYABLE  :  INR ${fmtNet}`, 15, netY + 3);
    doc.setTextColor(0, 0, 0);

    const finalY = netY + 30;
    
    // Add Best Regards
    doc.setFont("helvetica", "italic");
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text("BEST REGARDS,", 15, finalY);
    doc.setFont("helvetica", "bolditalic");
    doc.text("CeiTCS", 15, finalY + 6);
    
    // Auth Signature
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Authorized Signatory", 150, finalY + 6);
    doc.setDrawColor(0, 0, 0);
    doc.line(145, finalY + 1, 190, finalY + 1);

    // Footer note
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer-generated document. No signature is required.", 105, 280, { align: "center" });

    doc.save(`${emp.username}_Payslip_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`);
  };

  return (
    <div className="payroll-premium-container">
      <header className="payroll-header-premium">
        <h2>My Payroll Overview</h2>
        <p>Detailed breakdown of your monthly earnings and deductions</p>
      </header>

      <div className="payroll-stats-grid">
        <div className="payroll-stat-card card-basic">
          <span className="card-label">Basic Salary</span>
          <div className="card-value">₹ {personalSummary.basicSalary.toLocaleString("en-IN")}</div>
        </div>
        <div className="payroll-stat-card card-bonus">
          <span className="card-label">Bonus (10%)</span>
          <div className="card-value">+ ₹ {personalSummary.bonus.toLocaleString("en-IN")}</div>
        </div>
        <div className="payroll-stat-card card-net">
          <span className="card-label">Net Payable</span>
          <div className="card-value">₹ {personalSummary.netPay.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <section className="payroll-table-section">
        <h3><FiDollarSign /> Current Month Breakdown</h3>
        <div className="payroll-table-wrapper">
          <table className="payroll-modern-table">
            <thead>
              <tr>
                <th>Earnings</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Net Pay</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employee ? (
                <tr>
                  <td>₹ {personalSummary.basicSalary.toLocaleString("en-IN")}</td>
                  <td>₹ {personalSummary.bonus.toLocaleString("en-IN")}</td>
                  <td>₹ {personalSummary.deductions.toLocaleString("en-IN")}</td>
                  <td style={{ color: '#10b981', fontWeight: 800 }}>₹ {personalSummary.netPay.toLocaleString("en-IN")}</td>
                  <td>
                    <button className="download-btn-premium" onClick={() => generatePayslipPDF(employee)}>
                      <FiDownload /> Payslip
                    </button>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading record...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default MonthlyPayroll;
