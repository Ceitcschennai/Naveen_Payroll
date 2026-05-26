import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "../../styles/reportsAnalytics.css";

const ReportsAnalytics = () => {
    const [employees, setEmployees] = useState([]);
    const [summary, setSummary] = useState({
        totalEmployees: 0,
        totalDepartments: 0,
        totalPayroll: 0,
        totalCTC: 0,
    });

    const fetchAnalytics = async () => {
        try {
            const res = await axios.get("http://localhost:5000/employees");

            if (!res.data || !Array.isArray(res.data.employees)) {
                Swal.fire("Error", "Invalid data returned from server", "error");
                return;
            }

            const data = res.data.employees;

            let totalEmployees = data.length;

            let deptNames = data
                .map((e) => (e.position || "").trim().toLowerCase())
                .filter((d) => d && d !== "n/a");

            let uniqueDepartments = new Set(deptNames);
            let totalPayroll = 0;
            let totalCTC = 0;

            // 🔥 Normalize + Fix All Missing Data
            const normalized = data.map((e) => {
                const basic = Number(e.salary || 0);

                const hra = Number(e.hra || 0);
                const medical = Number(e.medical || 0);
                const transport = Number(e.transport || 0);
                const food = Number(e.food || 0);

                const other = Number(e.other || 0);
                const hrAllowance = Number(e.hrAllowance || 0);

                const daysWorked = Number(e.daysWorked || 0);
                const lop = Number(e.lop || 0);

                const workingDays = Number(e.workingDays || 26); // default 26

                const perDaySalary = workingDays > 0 ? basic / workingDays : 0;
                const lopDeduction = +(perDaySalary * lop).toFixed(2);

                const bonus = +(basic * 0.1).toFixed(2);
                const threePercentDeduction = +(basic * 0.03).toFixed(2);

                const tds = Number(e.tds || basic * 0.1);
                const taxExemptions = Number(e.taxExemptions || 0);

                const grossMonthly =
                    basic +
                    bonus +
                    hra +
                    medical +
                    transport +
                    food +
                    other +
                    hrAllowance;

                const netPay = +(
                    grossMonthly - tds - taxExemptions - threePercentDeduction - lopDeduction
                ).toFixed(2);

                const ctcYearly = +(netPay * 12).toFixed(2);

                totalPayroll += netPay;
                totalCTC += ctcYearly;

                return {
                    ...e,
                    basic,
                    bonus,
                    hra,
                    medical,
                    transport,
                    food,
                    other,
                    hrAllowance,
                    daysWorked,
                    lop,
                    perDaySalary,
                    lopDeduction,
                    tds,
                    taxExemptions,
                    grossMonthly,
                    threePercentDeduction,
                    netPay,
                    ctcYearly,
                };
            });

            setEmployees(normalized);

            setSummary({
                totalEmployees,
                totalDepartments: uniqueDepartments.size,
                totalPayroll,
                totalCTC,
            });
        } catch (err) {
            console.error("Fetch error:", err);
            Swal.fire("Error", "Failed to load report", "error");
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const generatePDF = (emp) => {
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
        doc.text(`Employee Name: ${emp.username || emp.name || "--"}`, 15, 55);
        doc.text(`Department: ${emp.position?.toUpperCase() || "GENERAL"}`, 15, 62);
        doc.text(`Month & Year: ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`, 115, 55);
        doc.text(`Working Days: ${emp.workingDays || 26}   |   Days Worked: ${emp.daysWorked}`, 115, 62);
        
        const fmtBasic = emp.basic.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fmtBonus = emp.bonus.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fmtHRA = emp.hra?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";
        const fmtMedical = emp.medical?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";
        const fmtTransport = emp.transport?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";
        const fmtFood = emp.food?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";

        const fmtLOP = emp.lopDeduction?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";
        const fmtTDS = emp.tds?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";
        const fmtDed3 = emp.threePercentDeduction?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";
        
        const fmtNet = emp.netPay.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fmtCTC = emp.ctcYearly?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00";

        const totalEarn = (emp.grossMonthly || (emp.basic + emp.bonus + (emp.hra||0) + (emp.medical||0) + (emp.transport||0) + (emp.food||0)));
        const totalDeds = (emp.lopDeduction + emp.tds + emp.threePercentDeduction);

        doc.autoTable({
          startY: 75,
          head: [["Earnings", "Amount (INR)", "Deductions", "Amount (INR)"]],
          body: [
            ["Basic Salary", fmtBasic, "LOP Deduction", fmtLOP],
            ["Bonus (10%)", fmtBonus, "TDS", fmtTDS],
            ["HRA", fmtHRA, "Tax / PF (3%)", fmtDed3],
            ["Medical Allowance", fmtMedical, "", ""],
            ["Transport Allowance", fmtTransport, "", ""],
            ["Food Allowance", fmtFood, "", ""],
          ],
          foot: [
            ["Gross Earnings", totalEarn.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), "Total Deductions", totalDeds.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })]
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
        doc.setFontSize(11);
        doc.text(`YEARLY CTC  :  INR ${fmtCTC}`, 125, netY + 3);
        
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
    };

    return (
        <div className="reports-container">
            <h2 className="page-title">Payroll Report Analytics</h2>

            <div className="summary-grid">
                <div className="summary-card">
                    <h4>Total Employees</h4>
                    <p>{summary.totalEmployees}</p>
                </div>

                <div className="summary-card">
                    <h4>Total Departments</h4>
                    <p>{summary.totalDepartments}</p>
                </div>

                <div className="summary-card">
                    <h4>Total Payroll</h4>
                    <p>₹ {summary.totalPayroll.toLocaleString("en-IN")}</p>
                </div>

                <div className="summary-card">
                    <h4>Total CTC (Yearly)</h4>
                    <p>₹ {summary.totalCTC.toLocaleString("en-IN")}</p>
                </div>
            </div>

            <div className="table-section">
                <h3>Employee Payroll Details</h3>

                <table className="analytics-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Dept</th>
                            <th>Basic</th>
                            <th>Bonus</th>
                            <th>HRA</th>
                            <th>Medical</th>
                            <th>Transport</th>
                            <th>Food</th>

                            <th>Days Worked</th>
                            <th>LOP</th>
                            <th>LOP Deduction</th>

                            <th>TDS</th>
                            <th>Deduction (3%)</th>
                            <th>Net Pay</th>
                            <th>CTC (Y)</th>
                            <th>PDF</th>
                        </tr>
                    </thead>

                    <tbody>
                        {employees.length > 0 ? (
                            employees.map((emp, i) => (
                                <tr key={i}>
                                    <td>{emp.username || emp.name}</td>
                                    <td>{emp.position?.toUpperCase()}</td>

                                    <td>₹ {emp.basic.toLocaleString("en-IN")}</td>
                                    <td>₹ {emp.bonus.toLocaleString("en-IN")}</td>
                                    <td>₹ {emp.hra.toLocaleString("en-IN")}</td>
                                    <td>₹ {emp.medical.toLocaleString("en-IN")}</td>
                                    <td>₹ {emp.transport.toLocaleString("en-IN")}</td>
                                    <td>₹ {emp.food.toLocaleString("en-IN")}</td>

                                    <td>{emp.daysWorked}</td>
                                    <td>{emp.lop}</td>
                                    <td>₹ {emp.lopDeduction.toLocaleString("en-IN")}</td>

                                    <td>₹ {emp.tds.toLocaleString("en-IN")}</td>
                                    <td>₹ {emp.threePercentDeduction.toLocaleString("en-IN")}</td>
                                    <td>₹ {emp.netPay.toLocaleString("en-IN")}</td>
                                    <td>₹ {emp.ctcYearly.toLocaleString("en-IN")}</td>

                                    <td>
                                        <button className="pdf-btn" onClick={() => generatePDF(emp)}>
                                            ⬇️ PDF
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="16" style={{ textAlign: "center" }}>
                                    No employee data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportsAnalytics;
