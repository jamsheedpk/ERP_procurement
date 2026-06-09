/* global React, Icon, Button, IconButton */
const { useState: useStateRP, useMemo: useMemoRP, useEffect: useEffectRP } = React;

const REPORT_CATS = [
  {
    id: "headcount", label: "Headcount", icon: "users", color: "#2563B0",
    reports: [
      { name: "Headcount Summary",   desc: "Total headcount by dept, grade, status" },
      { name: "New Hires Report",    desc: "All joiners in selected period" },
      { name: "Attrition Report",    desc: "Leavers, tenure, reasons for exit" },
      { name: "Diversity Report",    desc: "Gender, nationality, age group breakdown" },
    ],
  },
  {
    id: "leave", label: "Leave", icon: "calendar-off", color: "#B61B54",
    reports: [
      { name: "Leave Balance Report",   desc: "Remaining balances by employee & type" },
      { name: "Leave Utilization",      desc: "Leave taken vs. entitlement analysis" },
      { name: "Pending Approvals",      desc: "All outstanding leave requests" },
      { name: "Absenteeism Report",     desc: "Unplanned absence trends" },
    ],
  },
  {
    id: "payroll", label: "Payroll", icon: "wallet", color: "#1F8A52",
    reports: [
      { name: "Payroll Summary",        desc: "Gross, deductions, net by pay period" },
      { name: "Salary Cost by Dept",    desc: "Total compensation by department" },
      { name: "WPS File",               desc: "Wage Protection System submission file" },
      { name: "Gratuity Accrual",       desc: "End-of-service accruals per employee" },
    ],
  },
  {
    id: "attendance", label: "Attendance", icon: "clock", color: "#D78A14",
    reports: [
      { name: "Daily Attendance",       desc: "Present/absent/late per day" },
      { name: "Overtime Report",        desc: "OT hours logged by employee" },
      { name: "Late Arrivals",          desc: "Punctuality tracking for the period" },
      { name: "WFH Log",                desc: "Remote working frequency by employee" },
    ],
  },
  {
    id: "performance", label: "Performance", icon: "bar-chart-2", color: "#6F1947",
    reports: [
      { name: "Review Completion",      desc: "% of reviews submitted per cycle" },
      { name: "Rating Distribution",    desc: "Bell curve and outlier analysis" },
      { name: "Goal Achievement",       desc: "OKR / goal progress summary" },
      { name: "Top Performers",         desc: "High-rating employees list" },
    ],
  },
  {
    id: "compliance", label: "Compliance", icon: "shield-check", color: "#534AB7",
    reports: [
      { name: "Visa & Document Expiry", desc: "Upcoming renewals and expired docs" },
      { name: "Training Compliance",    desc: "Mandatory course completion rates" },
      { name: "Probation Review Log",   desc: "Employees in / due for probation review" },
      { name: "Audit Trail",            desc: "All system changes with timestamps" },
    ],
  },
];

const RECENT_KEY = "hrm_recent_reports";
const RECENT_MAX = 10;

function loadRecentReports() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function saveRecentReports(list) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch {}
}

function relativeDate(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "Just now";
  if (mins  < 60)  return mins + " min ago";
  if (hours < 24)  return hours + " hr ago";
  if (days  === 1) return "Yesterday";
  return new Date(isoStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Build table data for each report ─────────────────────────────────────────
function getReportData(reportName, catId, data) {
  const { employees = [], leaveRequests = [], payrollRun = {} } = data || {};
  const today = new Date();
  const fmt   = d => d ? new Date(d).toLocaleDateString("en-GB") : "—";
  const aed   = n => n ? "AED " + Number(n).toLocaleString() : "—";
  const daysSince = d => { try { return Math.floor((today - new Date(d)) / 86400000); } catch { return "—"; } };

  switch (catId) {
    case "headcount": {
      if (reportName === "New Hires Report") {
        const newHires = employees.filter(e => e.joinDate && daysSince(e.joinDate) <= 90);
        return {
          summary: [
            { label: "New Hires (90d)", value: newHires.length, color: "#2563B0" },
            { label: "Departments",     value: [...new Set(newHires.map(e => e.dept))].length },
          ],
          columns: ["Emp ID","Name","Department","Role","Grade","Join Date","Days Since Joining"],
          rows: (newHires.length ? newHires : employees.slice(0, 5)).map(e => [
            e.empId, e.name, e.dept || "—", e.title || e.role || "—",
            e.grade || "—", fmt(e.joinDate), daysSince(e.joinDate),
          ]),
        };
      }
      if (reportName === "Diversity Report") {
        const depts = [...new Set(employees.map(e => e.dept))].filter(Boolean);
        return {
          summary: [
            { label: "Total Employees", value: employees.length, color: "#2563B0" },
            { label: "Departments",     value: depts.length },
          ],
          columns: ["Department","Total","Grade L1","Grade L2","Grade L3","Grade L4","Grade L5"],
          rows: depts.map(dept => {
            const emps = employees.filter(e => e.dept === dept);
            return [
              dept, emps.length,
              emps.filter(e => e.grade === "L1").length,
              emps.filter(e => e.grade === "L2").length,
              emps.filter(e => e.grade === "L3").length,
              emps.filter(e => e.grade === "L4").length,
              emps.filter(e => e.grade === "L5").length,
            ];
          }),
        };
      }
      if (reportName === "Attrition Report") {
        return {
          summary: [{ label: "Attrition Rate", value: "4.2%", color: "#C0263A" }, { label: "Leavers (YTD)", value: 3 }],
          columns: ["Emp ID","Name","Department","Role","Last Working Day","Tenure (months)","Exit Reason"],
          rows: employees.slice(0, 3).map((e, i) => [
            e.empId, e.name, e.dept || "—", e.title || e.role || "—",
            fmt(new Date(today.getTime() - (i+1)*30*86400000)),
            Math.floor(Math.random() * 36 + 6),
            ["Resignation","Contract End","Termination"][i % 3],
          ]),
        };
      }
      // Headcount Summary (default)
      const depts = [...new Set(employees.map(e => e.dept))].filter(Boolean);
      return {
        summary: [
          { label: "Total Headcount", value: employees.length, color: "#2563B0" },
          { label: "Active",          value: employees.filter(e => e.status !== "inactive").length, color: "#1F8A52" },
          { label: "Departments",     value: depts.length },
        ],
        columns: ["Emp ID","Name","Department","Role","Grade","Status","Join Date"],
        rows: employees.map(e => [
          e.empId, e.name, e.dept || "—", e.title || e.role || "—",
          e.grade || "—", e.status || "Active", fmt(e.joinDate),
        ]),
      };
    }

    case "leave": {
      if (reportName === "Pending Approvals") {
        const pending = leaveRequests.filter(l => l.status === "Pending" || l.status === "pending");
        return {
          summary: [{ label: "Pending Approvals", value: pending.length, color: "#D78A14" }],
          columns: ["Employee","Department","Leave Type","From","To","Days","Applied On","Approver"],
          rows: (pending.length ? pending : leaveRequests).map(l => [
            l.name || l.empName || "—", l.dept || "—", l.leaveType || "Annual",
            fmt(l.start || l.startDate), fmt(l.end || l.endDate),
            l.days || "—", fmt(l.appliedOn || l.createdAt), l.approver || l.approverName || "—",
          ]),
        };
      }
      if (reportName === "Leave Utilization") {
        const byType = {};
        leaveRequests.forEach(l => {
          const t = l.leaveType || "Annual";
          byType[t] = (byType[t] || 0) + (Number(l.days) || 1);
        });
        return {
          summary: [
            { label: "Total Days Taken", value: Object.values(byType).reduce((a, b) => a + b, 0), color: "#B61B54" },
            { label: "Leave Types", value: Object.keys(byType).length },
          ],
          columns: ["Leave Type","Days Taken","Requests","Avg Days","% of Total"],
          rows: Object.entries(byType).map(([type, days]) => {
            const reqs  = leaveRequests.filter(l => (l.leaveType || "Annual") === type).length;
            const total = Object.values(byType).reduce((a, b) => a + b, 0) || 1;
            return [type, days, reqs, (days / reqs).toFixed(1), Math.round(days / total * 100) + "%"];
          }),
        };
      }
      if (reportName === "Absenteeism Report") {
        return {
          summary: [{ label: "Unplanned Absences", value: leaveRequests.filter(l => l.leaveType === "Sick" || l.leaveType === "Emergency").length, color: "#C0263A" }],
          columns: ["Employee","Department","Absence Type","Date","Days","Status"],
          rows: leaveRequests.filter(l => l.leaveType === "Sick" || l.leaveType === "Emergency" || !l.leaveType)
            .slice(0, 15).map(l => [
              l.name || l.empName || "—", l.dept || "—",
              l.leaveType || "Unplanned", fmt(l.start || l.startDate),
              l.days || 1, l.status || "Approved",
            ]),
        };
      }
      // Leave Balance
      return {
        summary: [
          { label: "Employees", value: employees.length, color: "#B61B54" },
          { label: "Total Requests", value: leaveRequests.length },
        ],
        columns: ["Employee","Department","Annual Entitlement","Days Taken","Balance Remaining","Sick Leave","Haj Leave"],
        rows: employees.map(e => {
          const taken = leaveRequests.filter(l => (l.empId || l.employeeId) === e.empId && (l.leaveType === "Annual" || !l.leaveType)).reduce((s, l) => s + (Number(l.days) || 0), 0);
          return [e.name, e.dept || "—", 22, taken, Math.max(22 - taken, 0), 10, 4];
        }),
      };
    }

    case "payroll": {
      if (reportName === "Salary Cost by Dept") {
        const depts = [...new Set(employees.map(e => e.dept))].filter(Boolean);
        return {
          summary: [
            { label: "Total Gross", value: aed(employees.reduce((s, e) => s + (e.salary || 0), 0)), color: "#1F8A52" },
            { label: "Departments", value: depts.length },
          ],
          columns: ["Department","Headcount","Total Gross (AED)","Avg Salary (AED)","Total Deductions","Total Net"],
          rows: depts.map(dept => {
            const emps   = employees.filter(e => e.dept === dept);
            const gross  = emps.reduce((s, e) => s + (e.salary || 0), 0);
            const ded    = Math.round(gross * 0.05);
            return [dept, emps.length, gross.toLocaleString(), gross ? Math.round(gross / emps.length).toLocaleString() : "—", ded.toLocaleString(), (gross - ded).toLocaleString()];
          }),
        };
      }
      if (reportName === "WPS File") {
        return {
          summary: [{ label: "Employees", value: employees.length, color: "#1F8A52" }, { label: "Run Date", value: payrollRun.runDate || "—" }],
          columns: ["Emp ID","Name","Bank Name","IBAN","Basic Salary","Allowances","Deductions","Net Pay"],
          rows: employees.map(e => {
            const basic = e.salary || e.basicSalary || 0;
            const allow = Math.round(basic * 0.25);
            const ded   = Math.round(basic * 0.05);
            return [e.empId, e.name, "Emirates NBD", "AE" + e.empId?.replace(/\D/g,"").padStart(19,"0").slice(0,19),
              basic.toLocaleString(), allow.toLocaleString(), ded.toLocaleString(), (basic + allow - ded).toLocaleString()];
          }),
        };
      }
      if (reportName === "Gratuity Accrual") {
        return {
          summary: [{ label: "Total Accrual", value: aed(employees.reduce((s, e) => s + Math.round((e.salary || 0) * 0.0833), 0)), color: "#1F8A52" }],
          columns: ["Emp ID","Name","Department","Basic Salary","Service Years","Monthly Accrual","Total Accrual"],
          rows: employees.map(e => {
            const yrs    = e.joinDate ? ((today - new Date(e.joinDate)) / (365.25 * 86400000)).toFixed(1) : "—";
            const basic  = e.salary || e.basicSalary || 0;
            const accrual = Math.round(basic * 0.0833);
            return [e.empId, e.name, e.dept || "—", basic.toLocaleString(), yrs, accrual.toLocaleString(), (accrual * 12).toLocaleString()];
          }),
        };
      }
      // Payroll Summary — calculate from employees if payrollRun fields are absent
      const empGross = employees.reduce((s, e) => {
        const basic = e.salary || e.basicSalary || 0;
        return s + basic + Math.round(basic * 0.25);
      }, 0);
      const empDed = Math.round(empGross * 0.05);
      const empNet = empGross - empDed;
      return {
        summary: [
          { label: "Gross Pay",   value: aed(payrollRun.gross  || empGross), color: "#1F8A52" },
          { label: "Deductions",  value: aed(payrollRun.deductions || empDed), color: "#C0263A" },
          { label: "Net Pay",     value: aed(payrollRun.net    || empNet),   color: "#2563B0" },
          { label: "Employees",   value: payrollRun.headcount  || employees.length },
        ],
        columns: ["Emp ID","Name","Department","Basic Salary","Allowances","Gross","Deductions","Net Pay"],
        rows: employees.map(e => {
          const basic = e.salary || e.basicSalary || 0;
          const allow = Math.round(basic * 0.25);
          const gross = basic + allow;
          const ded   = Math.round(gross * 0.05);
          return [e.empId, e.name, e.dept || "—",
            basic.toLocaleString(), allow.toLocaleString(), gross.toLocaleString(),
            ded.toLocaleString(), (gross - ded).toLocaleString()];
        }),
      };
    }

    case "attendance": {
      const STATUSES = ["Present","Present","Present","WFH","Late","Present","Present","Absent"];
      if (reportName === "Overtime Report") {
        return {
          summary: [{ label: "Total OT Hours", value: employees.length * 2, color: "#D78A14" }],
          columns: ["Emp ID","Name","Department","Regular Hours","OT Hours","OT Rate","OT Amount (AED)"],
          rows: employees.map((e, i) => {
            const ot = [0,0,2,4,0,1,0,3][i % 8];
            const rate = Math.round((e.salary || 5000) / 208);
            return [e.empId, e.name, e.dept || "—", 192, ot, `AED ${rate}/hr`, (ot * rate * 1.25).toLocaleString()];
          }),
        };
      }
      if (reportName === "Late Arrivals") {
        const lateEmps = employees.filter((_, i) => i % 4 === 2);
        return {
          summary: [{ label: "Late Arrivals", value: lateEmps.length, color: "#C0263A" }, { label: "Avg Delay", value: "18 min" }],
          columns: ["Emp ID","Name","Department","Scheduled","Actual","Delay (min)","Occurrences"],
          rows: lateEmps.map((e, i) => [e.empId, e.name, e.dept || "—", "09:00", ["09:12","09:22","09:35","09:18"][i%4], [12,22,35,18][i%4], [2,3,1,4][i%4]]),
        };
      }
      if (reportName === "WFH Log") {
        return {
          summary: [{ label: "WFH Days Total", value: employees.length * 3, color: "#534AB7" }],
          columns: ["Emp ID","Name","Department","WFH Days","Office Days","WFH %","Policy Limit"],
          rows: employees.map((e, i) => {
            const wfh = [3,2,4,1,3,2,0,3][i % 8];
            return [e.empId, e.name, e.dept || "—", wfh, 22 - wfh, Math.round(wfh / 22 * 100) + "%", "40%"];
          }),
        };
      }
      // Daily Attendance
      return {
        summary: [
          { label: "Present",  value: employees.filter((_, i) => STATUSES[i % 8] === "Present").length, color: "#1F8A52" },
          { label: "WFH",      value: employees.filter((_, i) => STATUSES[i % 8] === "WFH").length,     color: "#534AB7" },
          { label: "Absent",   value: employees.filter((_, i) => STATUSES[i % 8] === "Absent").length,  color: "#C0263A" },
          { label: "Late",     value: employees.filter((_, i) => STATUSES[i % 8] === "Late").length,    color: "#D78A14" },
        ],
        columns: ["Emp ID","Name","Department","Date","Status","Check-In","Check-Out","Hours"],
        rows: employees.map((e, i) => {
          const st = STATUSES[i % 8];
          return [e.empId, e.name, e.dept || "—", today.toLocaleDateString("en-GB"),
            st, st === "Absent" ? "—" : st === "Late" ? "09:22" : "09:01",
            st === "Absent" ? "—" : "18:00", st === "Absent" ? 0 : 9];
        }),
      };
    }

    case "performance": {
      const RATINGS = [3,4,5,4,3,5,4,2,4,3,5,4,3,4,5,3,4];
      const STATUS  = ["Submitted","Submitted","Pending","Submitted","Pending","Submitted","Submitted","Pending"];
      if (reportName === "Rating Distribution") {
        const dist = {1:0,2:0,3:0,4:0,5:0};
        employees.forEach((_, i) => dist[RATINGS[i % RATINGS.length]]++);
        return {
          summary: [
            { label: "Avg Rating", value: (employees.reduce((s,_,i)=>s+RATINGS[i%RATINGS.length],0)/Math.max(employees.length,1)).toFixed(1), color: "#6F1947" },
            { label: "Reviews Done", value: employees.filter((_,i)=>STATUS[i%8]==="Submitted").length },
          ],
          columns: ["Rating","Label","Count","Percentage","Bar"],
          rows: Object.entries(dist).reverse().map(([r, cnt]) => {
            const labels = {5:"Outstanding",4:"Exceeds",3:"Meets",2:"Below",1:"Unsatisfactory"};
            return [r + " ★", labels[r], cnt, Math.round(cnt / Math.max(employees.length,1) * 100) + "%", "█".repeat(cnt)];
          }),
        };
      }
      if (reportName === "Goal Achievement") {
        return {
          summary: [{ label: "Avg Goal Met", value: "72%", color: "#6F1947" }],
          columns: ["Emp ID","Name","Department","Goals Set","Goals Met","% Achieved","Status"],
          rows: employees.map((e, i) => {
            const total = [4,5,3,4,4,5,3,4][i%8];
            const met   = [3,4,3,2,4,5,2,3][i%8];
            return [e.empId, e.name, e.dept||"—", total, met, Math.round(met/total*100)+"%",
              met===total?"✓ Complete":"In Progress"];
          }),
        };
      }
      if (reportName === "Top Performers") {
        const top = employees.map((e, i) => ({ ...e, rating: RATINGS[i % RATINGS.length] }))
          .filter(e => e.rating >= 4).sort((a, b) => b.rating - a.rating);
        return {
          summary: [{ label: "Top Performers", value: top.length, color: "#6F1947" }],
          columns: ["Rank","Emp ID","Name","Department","Role","Rating","Review Status"],
          rows: top.map((e, i) => [i+1, e.empId, e.name, e.dept||"—", e.title||e.role||"—", e.rating+" ★","Submitted"]),
        };
      }
      // Review Completion
      return {
        summary: [
          { label: "Submitted",  value: employees.filter((_,i)=>STATUS[i%8]==="Submitted").length, color: "#1F8A52" },
          { label: "Pending",    value: employees.filter((_,i)=>STATUS[i%8]==="Pending").length,   color: "#D78A14" },
          { label: "Completion", value: Math.round(employees.filter((_,i)=>STATUS[i%8]==="Submitted").length/Math.max(employees.length,1)*100)+"%", color: "#6F1947" },
        ],
        columns: ["Emp ID","Name","Department","Manager","Review Cycle","Rating","Status","Submitted On"],
        rows: employees.map((e, i) => [
          e.empId, e.name, e.dept||"—", e.manager||"Fatima Al-Mansoori",
          "H1 2026", RATINGS[i%RATINGS.length]+" ★", STATUS[i%8],
          STATUS[i%8]==="Submitted" ? fmt(new Date(today-Math.random()*30*86400000)) : "—",
        ]),
      };
    }

    case "compliance": {
      const addDays = (d, n) => { const x = new Date(); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10); };
      if (reportName === "Training Compliance") {
        return {
          summary: [{ label: "Completion Rate", value: "78%", color: "#534AB7" }],
          columns: ["Emp ID","Name","Department","Mandatory Courses","Completed","Pending","% Done","Status"],
          rows: employees.map((e, i) => {
            const total = 5, done = [5,4,3,5,4,5,3,4][i%8];
            return [e.empId, e.name, e.dept||"—", total, done, total-done,
              Math.round(done/total*100)+"%", done===total?"✓ Compliant":"⚠ Pending"];
          }),
        };
      }
      if (reportName === "Probation Review Log") {
        const prob = employees.filter((e, i) => i % 4 === 1 || (e.joinDate && daysSince(e.joinDate) < 180));
        return {
          summary: [{ label: "On Probation", value: prob.length, color: "#D78A14" }],
          columns: ["Emp ID","Name","Department","Join Date","Probation End","Days Left","Review Status"],
          rows: prob.map(e => {
            const joinedAt = new Date(e.joinDate || today);
            const endDate  = new Date(joinedAt); endDate.setDate(endDate.getDate() + 180);
            const left     = Math.max(0, Math.floor((endDate - today) / 86400000));
            return [e.empId, e.name, e.dept||"—", fmt(e.joinDate), fmt(endDate), left, left>0?"Ongoing":"✓ Completed"];
          }),
        };
      }
      if (reportName === "Audit Trail") {
        const actions = ["Employee created","Leave approved","Salary updated","Role changed","Document uploaded","Shift assigned","Password reset","Leave rejected"];
        return {
          summary: [{ label: "Events (30d)", value: 48, color: "#534AB7" }],
          columns: ["Timestamp","User","Action","Module","Target","IP Address"],
          rows: Array.from({length: 12}, (_, i) => [
            fmt(new Date(today - i * 2.5 * 86400000)) + " " + ["09:14","11:32","14:05","16:22","08:47","13:10"][i%6],
            ["Fatima Al-Mansoori","Daniyal Khan","Aarav Sharma"][i%3],
            actions[i%8], ["Employees","Leave","Payroll","Shifts"][i%4],
            employees[i%employees.length]?.name || "—", "192.168.1." + (10 + i),
          ]),
        };
      }
      // Visa & Document Expiry
      return {
        summary: [
          { label: "Expiring 30d",  value: employees.filter((_,i)=>i%5===0).length, color: "#C0263A" },
          { label: "Expiring 90d",  value: employees.filter((_,i)=>i%3===0).length, color: "#D78A14" },
          { label: "Valid",         value: employees.filter((_,i)=>i%5!==0&&i%3!==0).length, color: "#1F8A52" },
        ],
        columns: ["Emp ID","Name","Department","Visa Expiry","EID Expiry","Passport Expiry","Days Until Visa Expiry","Status"],
        rows: employees.map((e, i) => {
          const visDays = [25,180,45,365,12,90,200,30][i%8];
          const visExp  = addDays(today, visDays);
          const status  = visDays < 30 ? "🔴 Urgent" : visDays < 90 ? "🟡 Soon" : "🟢 Valid";
          return [e.empId, e.name, e.dept||"—", fmt(visExp), fmt(addDays(today, visDays+60)), fmt(addDays(today, visDays+365)), visDays+" days", status];
        }),
      };
    }

    default:
      return { summary: [], columns: ["No Data"], rows: [["No data available for this report"]] };
  }
}

// ── CSV / XLSX download ───────────────────────────────────────────────────────
function buildCSV(reportName, catId, data) {
  const { columns, rows, summary } = getReportData(reportName, catId, data);
  const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const row = cols => cols.map(esc).join(",");
  const now = new Date().toLocaleDateString("en-GB");
  let lines = [
    row(["Report", reportName]),
    row(["Generated", now]),
    row(["Company", "Meridian Logistics DMCC"]),
  ];
  if (summary.length) lines.push(row(summary.map(s => s.label + ": " + s.value)));
  lines.push("", row(columns));
  rows.forEach(r => lines.push(row(r)));
  return "﻿" + lines.join("\n");
}

function downloadXLSX(reportName, catId, data) {
  const csv  = buildCSV(reportName, catId, data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = reportName.replace(/[^a-zA-Z0-9]+/g, "_") + ".xlsx";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Report Detail Page (full in-page view with pagination) ───────────────────
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function ReportDetailPage({ report, data, onBack, onDownload }) {
  const { columns, rows, summary } = useMemoRP(
    () => getReportData(report.name, report.cat.id, data),
    [report, data]
  );
  const cat = report.cat;
  const now = new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });

  const [page,     setPage]     = useStateRP(1);
  const [pageSize, setPageSize] = useStateRP(10);

  const totalPages  = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage    = Math.min(page, totalPages);
  const start       = (safePage - 1) * pageSize;
  const pageRows    = rows.slice(start, start + pageSize);

  // Reset to page 1 when report changes
  useMemoRP(() => { setPage(1); }, [report]);

  const goTo = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

  // Build page number buttons — show max 7 slots with ellipsis
  const pageButtons = useMemoRP(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const delta = 2;
    const range = [];
    const left  = Math.max(2, safePage - delta);
    const right = Math.min(totalPages - 1, safePage + delta);
    range.push(1);
    if (left > 2)          range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    range.push(totalPages);
    return range;
  }, [totalPages, safePage]);

  const thStyle = { padding: "11px 18px", textAlign: "left", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-3)", borderBottom: "2px solid var(--border-subtle)", whiteSpace: "nowrap" };

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--fg-2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          <Icon name="arrow-left" size={14} color="var(--fg-2)" /> All Reports
        </button>
        <Icon name="chevron-right" size={13} color="var(--fg-4)" />
        <span style={{ fontSize: 13, color: "var(--fg-3)" }}>{cat.label}</span>
        <Icon name="chevron-right" size={13} color="var(--fg-4)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>{report.name}</span>
      </div>

      {/* Page header */}
      <div className="page-head" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: cat.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name={cat.icon} size={26} color={cat.color} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 className="page-title" style={{ margin: 0 }}>{report.name}</h1>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10, background: cat.color + "18", color: cat.color }}>{cat.label}</span>
            </div>
            <div className="page-sub">{report.desc} · Generated {now} · Meridian Logistics DMCC</div>
          </div>
        </div>
        <button onClick={() => onDownload(report)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", borderRadius: 10, border: `1.5px solid ${cat.color}50`, background: cat.color + "12", color: cat.color, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          <Icon name="download" size={15} color={cat.color} /> Download .xlsx
        </button>
      </div>

      {/* Summary KPI strip */}
      {summary.length > 0 && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
          {summary.map((s, i) => (
            <div key={i} className="card" style={{ padding: "14px 20px", minWidth: 120 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color || "var(--fg-1)", marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: "var(--fg-3)", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Data table */}
      <div className="card" style={{ overflow: "hidden" }}>
        {rows.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "var(--fg-3)" }}>
            <Icon name="inbox" size={36} />
            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600 }}>No data available for this report</div>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--ink-50)" }}>
                    <th style={thStyle}>#</th>
                    {columns.map((col, i) => <th key={i} style={thStyle}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, ri) => {
                    const globalRi = start + ri;
                    return (
                      <tr key={globalRi}
                        style={{ borderBottom: "1px solid var(--border-subtle)", background: ri % 2 === 0 ? "transparent" : "var(--ink-50)" }}
                        onMouseEnter={e => e.currentTarget.style.background = cat.color + "08"}
                        onMouseLeave={e => e.currentTarget.style.background = ri % 2 === 0 ? "transparent" : "var(--ink-50)"}>
                        <td style={{ padding: "11px 18px", color: "var(--fg-4)", fontSize: 11.5, fontFamily: "var(--font-mono)" }}>{globalRi + 1}</td>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding: "11px 18px", color: ci === 0 ? "var(--fg-3)" : ci === 1 ? "var(--fg-1)" : "var(--fg-2)", fontWeight: ci === 1 ? 600 : 400, whiteSpace: "nowrap", fontFamily: ci === 0 ? "var(--font-mono)" : "var(--font-sans)", fontSize: 13 }}>
                            {String(cell ?? "—")}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border-subtle)", background: "var(--ink-50)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>

              {/* Left: record count + rows-per-page selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--fg-4)" }}>
                  {start + 1}–{Math.min(start + pageSize, rows.length)} of {rows.length} records
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--fg-3)" }}>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    style={{ fontSize: 12, padding: "3px 6px", borderRadius: 6, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--fg-1)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                    {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              {/* Right: page navigation */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {/* First + Prev */}
                <button onClick={() => goTo(1)} disabled={safePage === 1}
                  style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", cursor: safePage === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: safePage === 1 ? 0.4 : 1 }}>
                  <Icon name="chevrons-left" size={13} color="var(--fg-2)" />
                </button>
                <button onClick={() => goTo(safePage - 1)} disabled={safePage === 1}
                  style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", cursor: safePage === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: safePage === 1 ? 0.4 : 1 }}>
                  <Icon name="chevron-left" size={13} color="var(--fg-2)" />
                </button>

                {/* Page number buttons */}
                {pageButtons.map((btn, i) =>
                  btn === "..." ? (
                    <span key={"e" + i} style={{ width: 30, textAlign: "center", fontSize: 12, color: "var(--fg-4)" }}>…</span>
                  ) : (
                    <button key={btn} onClick={() => goTo(btn)}
                      style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${btn === safePage ? cat.color : "var(--border-subtle)"}`, background: btn === safePage ? cat.color : "var(--bg-surface)", color: btn === safePage ? "#fff" : "var(--fg-2)", fontSize: 12.5, fontWeight: btn === safePage ? 700 : 400, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                      {btn}
                    </button>
                  )
                )}

                {/* Next + Last */}
                <button onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages}
                  style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", cursor: safePage === totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: safePage === totalPages ? 0.4 : 1 }}>
                  <Icon name="chevron-right" size={13} color="var(--fg-2)" />
                </button>
                <button onClick={() => goTo(totalPages)} disabled={safePage === totalPages}
                  style={{ width: 30, height: 30, borderRadius: 7, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", cursor: safePage === totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: safePage === totalPages ? 0.4 : 1 }}>
                  <Icon name="chevrons-right" size={13} color="var(--fg-2)" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Trend bar ─────────────────────────────────────────────────────────────────
function TrendBar({ values, color }) {
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 48 }}>
      {values.map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: "3px 3px 0 0", background: i === values.length - 1 ? color : color + "55", height: (v / max * 100) + "%" }} />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function ReportsPage({ data }) {
  const { employees = [], leaveRequests = [], payrollRun = {}, headcountTrend = [] } = data || {};
  const [filterCat,     setFilterCat]     = useStateRP("all");
  const [search,        setSearch]        = useStateRP("");
  const [downloading,   setDownloading]   = useStateRP(null);
  const [openReport,    setOpenReport]    = useStateRP(null);
  const [recentReports, setRecentReports] = useStateRP(() => loadRecentReports());
  const [rpPage,        setRpPage]        = useStateRP(1);
  const [rpPageSize,    setRpPageSize]    = useStateRP(10);

  const hcValues = useMemoRP(() => {
    if (headcountTrend && headcountTrend.length > 0)
      return headcountTrend.slice(-8).map(t => t.count || t.headcount || 0);
    const base = employees.length || 200;
    return [base-18, base-14, base-10, base-8, base-5, base-3, base-1, base];
  }, [headcountTrend, employees]);

  const leaveByType = useMemoRP(() => {
    const map = {};
    leaveRequests.forEach(l => { map[l.leaveType || "Annual"] = (map[l.leaveType || "Annual"] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [leaveRequests]);
  const totalLeave = leaveByType.reduce((s, [, c]) => s + c, 0) || 1;
  const COLORS = ["#2563B0","#B61B54","#1F8A52","#D78A14","#534AB7"];

  const allReports = useMemoRP(() =>
    REPORT_CATS.flatMap(cat => cat.reports.map(r => ({ ...r, cat }))), []);

  const filteredReports = useMemoRP(() => {
    let list = allReports;
    if (filterCat !== "all") list = list.filter(r => r.cat.id === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q));
    }
    return list;
  }, [allReports, filterCat, search]);

  useEffectRP(() => { setRpPage(1); }, [filterCat, search, rpPageSize]);
  const rpTotalPages  = Math.max(1, Math.ceil(filteredReports.length / rpPageSize));
  const rpSafePage    = Math.min(rpPage, rpTotalPages);
  const rpStart       = (rpSafePage - 1) * rpPageSize;
  const rpPageRows    = filteredReports.slice(rpStart, rpStart + rpPageSize);
  const rpNavBtn      = (dis) => ({ width:30, height:30, borderRadius:7, border:"1px solid var(--border-subtle)", background:"var(--bg-surface)", cursor:dis?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:dis?0.4:1 });
  const rpPageButtons = useMemoRP(() => {
    if (rpTotalPages <= 7) return Array.from({ length: rpTotalPages }, (_, i) => i + 1);
    const left  = Math.max(2, rpSafePage - 2);
    const right = Math.min(rpTotalPages - 1, rpSafePage + 2);
    const r = [1];
    if (left > 2) r.push("...");
    for (let i = left; i <= right; i++) r.push(i);
    if (right < rpTotalPages - 1) r.push("...");
    if (rpTotalPages > 1) r.push(rpTotalPages);
    return r;
  }, [rpTotalPages, rpSafePage]);

  const handleDownload = (report) => {
    const key = report.cat.id + "_" + report.name;
    setDownloading(key);
    setTimeout(() => {
      downloadXLSX(report.name, report.cat.id, data);
      setDownloading(null);

      // Record to recent list (deduplicate by name, newest first, cap at RECENT_MAX)
      const { rows } = getReportData(report.name, report.cat.id, data);
      const sizeKB   = Math.max(4, Math.round(rows.length * (report.cat.id === "payroll" ? 6 : 3)));
      const entry    = { name: report.name, catId: report.cat.id, downloadedAt: new Date().toISOString(), rows: rows.length, sizeKB };
      const updated  = [entry, ...loadRecentReports().filter(r => r.name !== report.name)].slice(0, RECENT_MAX);
      saveRecentReports(updated);
      setRecentReports(updated);
    }, 400);
  };

  const catFilterBtn = (id, label, icon, color, count) => {
    const active = filterCat === id;
    return (
      <button key={id} onClick={() => setFilterCat(active && id !== "all" ? "all" : id)} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
        borderRadius: 20, border: `1.5px solid ${active ? color : "var(--border-subtle)"}`,
        background: active ? color + "12" : "var(--bg-surface)",
        color: active ? color : "var(--fg-2)",
        fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
        transition: "all 0.15s",
      }}>
        {icon && <Icon name={icon} size={13} color={active ? color : "var(--fg-3)"} />}
        {label}
        <span style={{ fontSize: 10.5, background: active ? color + "20" : "var(--ink-100)", padding: "1px 6px", borderRadius: 8, color: active ? color : "var(--fg-3)" }}>{count}</span>
      </button>
    );
  };

  // If a report is selected, render the full detail page
  if (openReport) {
    return (
      <ReportDetailPage
        report={openReport}
        data={data}
        onBack={() => setOpenReport(null)}
        onDownload={(r) => { handleDownload(r); setOpenReport(null); }}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Growth</div>
          <h1 className="page-title">Reports & Analytics</h1>
          <div className="page-sub">Generate and download HR reports · {allReports.length} reports available</div>
        </div>
        <Button variant="primary" icon="plus">Schedule Report</Button>
      </div>

      {/* Summary strip */}
      <div className="grid-3" style={{ marginBottom: 28 }}>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 4 }}>Headcount Trend</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>{employees.length}</div>
          <TrendBar values={hcValues} color="#2563B0" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--fg-3)" }}>
            <span>8 months</span>
            <span style={{ color: "#1F8A52", fontWeight: 700 }}>↑ {Math.abs(hcValues[hcValues.length-1] - hcValues[0])}</span>
          </div>
        </div>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 12 }}>Leave by Type</div>
          {leaveByType.length > 0 ? leaveByType.map(([type, count], i) => (
            <div key={type} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span style={{ fontWeight: 600, color: "var(--fg-1)" }}>{type}</span>
                <span style={{ color: "var(--fg-3)" }}>{count}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: "var(--ink-100)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: Math.round(count / totalLeave * 100) + "%", background: COLORS[i % COLORS.length], borderRadius: 3 }} />
              </div>
            </div>
          )) : <div style={{ color: "var(--fg-3)", fontSize: 12 }}>No leave data</div>}
        </div>
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 12 }}>Payroll Summary</div>
          {[
            { label: "Gross Pay",  value: payrollRun.gross      ? "AED " + Number(payrollRun.gross).toLocaleString()      : "—", color: "#1F8A52" },
            { label: "Deductions", value: payrollRun.deductions ? "AED " + Number(payrollRun.deductions).toLocaleString() : "—", color: "#C0263A" },
            { label: "Net Pay",    value: payrollRun.net        ? "AED " + Number(payrollRun.net).toLocaleString()        : "—", color: "#2563B0" },
            { label: "Employees",  value: payrollRun.headcount || employees.length },
          ].map(r => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: "var(--fg-3)" }}>{r.label}</span>
              <span style={{ fontWeight: 700, color: r.color || "var(--fg-1)" }}>{r.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 4, fontSize: 11, color: "var(--fg-3)" }}>Run date: {payrollRun.runDate || "—"}</div>
        </div>
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

        {/* All Reports list */}
        <div>
          {/* Category filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {catFilterBtn("all", "All", null, "#2563B0", allReports.length)}
            {REPORT_CATS.map(cat => catFilterBtn(cat.id, cat.label, cat.icon, cat.color, cat.reports.length))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 14 }}>
            <Icon name="search" size={14} color="var(--fg-4)" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input className="form-input" style={{ paddingLeft: 34, fontSize: 13 }}
              placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Report rows */}
          <div className="card" style={{ overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "36px 1fr auto", gap: 12, padding: "10px 18px", background: "var(--ink-50)", borderBottom: "1px solid var(--border-subtle)" }}>
              <div />
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-3)" }}>Report Name</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--fg-3)" }}>Download</div>
            </div>

            {filteredReports.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--fg-3)" }}>
                <Icon name="file-search" size={28} />
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>No reports match</div>
              </div>
            ) : rpPageRows.map((report, i) => {
              const isLast    = i === rpPageRows.length - 1;
              const dlKey     = report.cat.id + "_" + report.name;
              const isLoading = downloading === dlKey;
              return (
                <div key={dlKey} style={{
                  display: "grid", gridTemplateColumns: "36px 1fr auto",
                  gap: 12, padding: "12px 18px", alignItems: "center",
                  borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
                  transition: "background 0.1s", cursor: "default",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--ink-50)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                  <div style={{ width: 36, height: 36, borderRadius: 9, background: report.cat.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={report.cat.icon} size={15} color={report.cat.color} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                      {/* Clickable report name */}
                      <span
                        onClick={() => setOpenReport(report)}
                        style={{ fontSize: 13, fontWeight: 600, color: report.cat.color, cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>
                        {report.name}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 8, background: report.cat.color + "15", color: report.cat.color, whiteSpace: "nowrap" }}>{report.cat.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{report.desc}</div>
                  </div>

                  <button
                    onClick={() => handleDownload(report)}
                    disabled={isLoading}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 14px", borderRadius: 8,
                      border: `1px solid ${report.cat.color}50`,
                      background: isLoading ? report.cat.color + "20" : report.cat.color + "10",
                      color: report.cat.color, fontSize: 12, fontWeight: 700,
                      cursor: isLoading ? "wait" : "pointer",
                      fontFamily: "var(--font-sans)", whiteSpace: "nowrap", minWidth: 96,
                      transition: "all 0.15s",
                    }}>
                    {isLoading
                      ? <><div style={{ width: 12, height: 12, border: `2px solid ${report.cat.color}40`, borderTopColor: report.cat.color, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Generating…</>
                      : <><Icon name="download" size={13} color={report.cat.color} /> .xlsx</>
                    }
                  </button>
                </div>
              );
            })}
            {filteredReports.length > 0 && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 18px", borderTop:"1px solid var(--border-subtle)", background:"var(--ink-50)", flexWrap:"wrap", gap:8 }}>
                <span style={{ fontSize:12, color:"var(--fg-3)" }}>
                  {rpStart+1}–{Math.min(rpStart+rpPageSize, filteredReports.length)} of {filteredReports.length} reports
                </span>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <select value={rpPageSize} onChange={e => setRpPageSize(Number(e.target.value))}
                    style={{ fontSize:12, border:"1px solid var(--border-subtle)", borderRadius:6, padding:"2px 6px", background:"var(--bg-surface)", color:"var(--fg-1)", fontFamily:"var(--font-sans)" }}>
                    {[5,10,15,20].map(n => <option key={n} value={n}>{n} / page</option>)}
                  </select>
                  <button onClick={() => setRpPage(p => Math.max(1, p-1))} disabled={rpSafePage===1} style={rpNavBtn(rpSafePage===1)}>‹</button>
                  {rpPageButtons.map((b, i) => b === "..." ? (
                    <span key={"e"+i} style={{ fontSize:12, color:"var(--fg-3)", padding:"0 2px" }}>…</span>
                  ) : (
                    <button key={b} onClick={() => setRpPage(b)} style={{ ...rpNavBtn(false), background: b===rpSafePage ? "#2563B0" : "var(--bg-surface)", color: b===rpSafePage ? "#fff" : "var(--fg-1)", fontWeight: b===rpSafePage ? 700 : 400, border: b===rpSafePage ? "1.5px solid #2563B0" : "1px solid var(--border-subtle)", fontSize:12 }}>{b}</button>
                  ))}
                  <button onClick={() => setRpPage(p => Math.min(rpTotalPages, p+1))} disabled={rpSafePage===rpTotalPages} style={rpNavBtn(rpSafePage===rpTotalPages)}>›</button>
                </div>
              </div>
            )}
          </div>

          <div style={{ fontSize: 11.5, color: "var(--fg-4)", marginTop: 8 }}>
            {filteredReports.length} of {allReports.length} reports · Click a report name to preview · Downloads are Excel-compatible
          </div>
        </div>

        {/* Right column */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)" }}>Recent Reports</div>
            {recentReports.length > 0 && (
              <button onClick={() => { saveRecentReports([]); setRecentReports([]); }}
                style={{ fontSize: 11, color: "var(--fg-4)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", padding: 0 }}>
                Clear
              </button>
            )}
          </div>
          <div className="card" style={{ overflow: "hidden", marginBottom: 20 }}>
            {recentReports.length === 0 ? (
              <div style={{ padding: "28px 14px", textAlign: "center" }}>
                <Icon name="clock" size={22} color="var(--fg-4)" />
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--fg-4)", fontWeight: 500 }}>No downloads yet</div>
                <div style={{ fontSize: 11, color: "var(--fg-4)", marginTop: 3 }}>Downloaded reports appear here</div>
              </div>
            ) : recentReports.slice(0, 5).map((r, i, arr) => {
              const cat = REPORT_CATS.find(c => c.id === r.catId) || REPORT_CATS[0];
              const rep = allReports.find(x => x.name === r.name && x.cat.id === r.catId);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: cat.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name={cat.icon} size={15} color={cat.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      onClick={() => rep && setOpenReport(rep)}
                      style={{ fontSize: 12, fontWeight: 600, color: rep ? cat.color : "var(--fg-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", cursor: rep ? "pointer" : "default", textDecoration: rep ? "underline" : "none", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>{relativeDate(r.downloadedAt)} · {r.sizeKB} KB · {r.rows} rows</div>
                  </div>
                  <button
                    onClick={() => rep && handleDownload(rep)}
                    disabled={!rep}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 6, border: "1px solid var(--border-subtle)", background: "var(--ink-50)", color: "var(--fg-2)", fontSize: 11, fontWeight: 600, cursor: rep ? "pointer" : "default", fontFamily: "var(--font-sans)", whiteSpace: "nowrap" }}>
                    <Icon name="download" size={11} color="var(--fg-3)" /> .xlsx
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fg-3)", marginBottom: 12 }}>Scheduled</div>
          <div className="card" style={{ padding: "14px 16px" }}>
            {[
              { name: "Monthly Payroll",    freq: "1st of month", next: "01 Jun 2026", color: "#1F8A52" },
              { name: "Weekly Attendance",  freq: "Every Monday", next: "27 May 2026", color: "#D78A14" },
              { name: "Visa Expiry Digest", freq: "Every Sunday", next: "26 May 2026", color: "#534AB7" },
            ].map((s, i, arr) => (
              <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.name}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-3)", paddingLeft: 14 }}>{s.freq}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>Next: {s.next}</div>
                  <IconButton icon="edit-2" title="Edit schedule" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

Object.assign(window, { ReportsPage });
