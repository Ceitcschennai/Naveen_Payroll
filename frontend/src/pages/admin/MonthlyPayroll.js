// src/pages/admin/MonthlyPayroll.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
    BarChart, Bar, XAxis, YAxis,
    Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import "../../styles/MonthlyPayroll.css";
import { NotificationStore } from "../../utils/NotificationStore";

const MonthlyPayroll = () => {
    const [employees, setEmployees] = useState([]);
    const [summary, setSummary] = useState({
        totalEmployees: 0,
        totalDepartments: 0,
        totalPayroll: 0,
    });
    const [chartData, setChartData] = useState([]);

    const fetchPayrollData = async () => {
        try {
            const res = await axios.get("http://localhost:5000/employees");
            if (Array.isArray(res.data.employees)) {
                const data = res.data.employees;
                const totalEmployees = data.length;
                const departments = [...new Set(data.map(e =>
                    e.position?.trim().toLowerCase()
                ))];

                const totalPayroll = data.reduce((s, e) => s + Number(e.salary || 0), 0);

                const deptCounts = {};
                data.forEach((e) => {
                    const dept = e.position?.trim().toLowerCase();
                    if (!dept) return;
                    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
                });

                const chartFormatted = Object.keys(deptCounts).map((d) => ({
                    department: d.toUpperCase(),
                    employees: deptCounts[d],
                }));

                setEmployees(data);
                setSummary({
                    totalEmployees,
                    totalDepartments: departments.length,
                    totalPayroll,
                });
                setChartData(chartFormatted);

            } else {
                Swal.fire("Error", "Server returned invalid data", "error");
            }

        } catch (err) {
            Swal.fire("Error", "Unable to load payroll", "error");
        }
    };

    useEffect(() => {
        fetchPayrollData();
        const timer = setInterval(fetchPayrollData, 4000);
        return () => clearInterval(timer);
    }, []);

    const calcNetPay = (salary) => {
        const bonus = salary * 0.1;
        const deductions = salary * 0.03;
        return { bonus, deductions, netPay: salary + bonus - deductions };
    };

    const generatePayslipPDF = (emp) => {
        const salary = Number(emp.salary);
        const { bonus, deductions, netPay } = calcNetPay(salary);

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
        doc.text("CeiTCS", 15, 20);
        
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
        doc.text(`Department: ${emp.department?.toUpperCase() || (emp.position?.trim().toLowerCase() !== "general" ? emp.position?.toUpperCase() : "GENERAL") || "GENERAL"}`, 15, 62);
        doc.text(`Designation: ${emp.position?.toUpperCase() || "--"}`, 115, 55);
        doc.text(`Month & Year: ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`, 115, 62);
        
        // Format amounts
        const fmtBasic = salary.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
            ["Gross Earnings", (salary + bonus).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "Total Deductions", fmtDeductions]
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

        doc.save(`${emp.username || emp.name}_Payslip.pdf`);

        NotificationStore.push(`Payslip generated for ${emp.username || emp.name}`);
    };

    const generateAll = async () => {
        if (employees.length === 0)
            return Swal.fire("No Data", "No employees found", "warning");

        Swal.fire("Generating...", "Please wait", "info");

        const date = new Date();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();

        try {
            await axios.post("http://localhost:5000/monthly-payroll/save", {
                 month,
                 year,
                 totalEmployees: summary.totalEmployees,
                 totalDepartments: summary.totalDepartments,
                 totalPayroll: summary.totalPayroll
            }, { withCredentials: true });
            NotificationStore.push(`Monthly payroll records saved to database`);
        } catch(err) {
            console.error("Error saving payroll to DB", err);
            Swal.fire("Warning", "Failed to save summary to DB", "warning");
        }

        for (const emp of employees) {
            try {
                generatePayslipPDF(emp);
            } catch (e) {
                console.error("Error generating PDF:", e);
            }
            await new Promise((r) => setTimeout(r, 400));
        }

        NotificationStore.push(`Generated payslips for ${employees.length} employees`);
    };

    return (
        <div className="payroll-container">
            <h2 className="payroll-title">💼 Monthly Payroll Overview</h2>

            <div className="payroll-summary">
                <div className="summary-card"><h4>Total Employees</h4><p>{summary.totalEmployees}</p></div>
                <div className="summary-card"><h4>Total Departments</h4><p>{summary.totalDepartments}</p></div>
                <div className="summary-card"><h4>Total Payroll</h4><p>₹ {summary.totalPayroll.toLocaleString()}</p></div>
            </div>

            <div className="payroll-table-section">
                <h3>Employee Payroll Breakdown</h3>

                <table className="payroll-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Basic</th>
                            <th>Bonus</th>
                            <th>Deduction</th>
                            <th>Net Pay</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {employees.map((emp, i) => {
                            const { bonus, deductions, netPay } = calcNetPay(Number(emp.salary));

                            return (
                                <tr key={i}>
                                    <td>{emp.username || emp.name}</td>
                                    <td>{emp.position?.toUpperCase() || "—"}</td>
                                    <td>{Number(emp.salary).toLocaleString()}</td>
                                    <td>{bonus.toLocaleString()}</td>
                                    <td>{deductions.toLocaleString()}</td>
                                    <td>{netPay.toLocaleString()}</td>

                                    <td>
                                        <button className="download-btn" onClick={() => generatePayslipPDF(emp)}>
                                            ⬇️ Download
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>

                </table>
            </div>

            <div className="generate-btn-container">
                <button className="generate-btn" onClick={generateAll}>
                    🧾 Generate Monthly Payroll
                </button>
            </div>

            <div className="payroll-chart-section">
                <h3>Department-wise Chart</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="employees" radius={[8, 8, 0, 0]} fill="#10b981" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MonthlyPayroll;
