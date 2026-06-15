import React, { useState } from "react";
import "./legacy/hrm.css"; // monolith styling (pulls colors_and_type.css via @import)
import "./hr.css";
import { Icon, Button } from "./legacy.jsx";
import { getToken, USER_KEY, TOKEN_KEY } from "@meridian/api";
import { useHrData } from "./data.js";

import PeoplePage, { EmployeeDrawer } from "./pages/PeoplePage.jsx";
import LeavePage from "./pages/LeavePage.jsx";
import RecruitmentPage from "./pages/RecruitmentPage.jsx";
import PayrollPage from "./pages/PayrollPage.jsx";
import SalaryPage from "./pages/SalaryPage.jsx";
import AttendancePage from "./pages/AttendancePage.jsx";
import OrgChartPage from "./pages/OrgChartPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ShiftsPage from "./pages/ShiftsPage.jsx";
import BenefitsPage from "./pages/BenefitsPage.jsx";
import PerformancePage from "./pages/PerformancePage.jsx";
import TrainingPage from "./pages/TrainingPage.jsx";
import DocumentsPage from "./pages/DocumentsPage.jsx";
import EmployeePortal from "./pages/EmployeePortal.jsx";

// Employee self-service portal — reads the signed-in user the shell stored in
// localStorage. Standalone (no session) it shows a sign-in notice instead of crashing.
function PortalRoute({ embedded }) {
  const token = getToken();
  let authUser = null;
  try { authUser = JSON.parse(localStorage.getItem(USER_KEY)); } catch { authUser = null; }
  if (!authUser || !token) {
    return <div className="hr-state"><Icon name="lock" size={28} /><div>Sign in from the shell to view your employee portal.</div></div>;
  }
  const onLogout = () => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
    window.location.reload();
  };
  return <EmployeePortal authUser={authUser} token={token} onLogout={onLogout} embedded={embedded} />;
}

const PAGES = [
  { id: "people",   label: "Employees",   icon: "users" },
  { id: "org",      label: "Org Chart",   icon: "git-merge" },
  { id: "onboard",  label: "Onboarding",  icon: "door-open" },
  { id: "recruit",  label: "Recruitment", icon: "user-plus" },
  { id: "docs",     label: "Documents",   icon: "file-text" },
  { id: "leave",    label: "Leave",       icon: "calendar-off" },
  { id: "attend",   label: "Attendance",  icon: "clock" },
  { id: "shifts",   label: "Shifts",      icon: "calendar-cog" },
  { id: "payroll",  label: "Payroll",     icon: "wallet" },
  { id: "salary",   label: "Salary",      icon: "banknote" },
  { id: "benefits", label: "Benefits",    icon: "gift" },
  { id: "perf",     label: "Performance", icon: "bar-chart-2" },
  { id: "learn",    label: "Training",    icon: "graduation-cap" },
  { id: "portal",   label: "My Portal",   icon: "user-circle" },
];

function AdminApp() {
  const [route, setRoute] = useState("people");
  const [openEmployee, setOpenEmployee] = useState(null);
  const { data, error, handleAdd, handleUpdate, handleLeaveStatus, upsertEmployee, removeEmployee } = useHrData();

  if (error) return <div className="hr-state"><Icon name="alert-circle" size={28} color="var(--danger-500)" /><div>{error}</div></div>;
  if (!data) return <div className="hr-state"><div className="hr-spin" /><div>Loading HR data…</div></div>;

  let page;
  switch (route) {
    case "people":   page = <PeoplePage data={data} onOpenEmployee={setOpenEmployee} onAdd={handleAdd} />; break;
    case "org":      page = <OrgChartPage data={data} />; break;
    case "onboard":  page = <OnboardingPage data={data} />; break;
    case "recruit":  page = <RecruitmentPage data={data} onAdd={handleAdd} onUpdate={handleUpdate} />; break;
    case "docs":     page = <DocumentsPage />; break;
    case "leave":    page = <LeavePage data={data} onApprove={(l) => handleLeaveStatus(l, "approved")} onDecline={(l) => handleLeaveStatus(l, "declined")} onAdd={handleAdd} />; break;
    case "attend":   page = <AttendancePage data={data} />; break;
    case "shifts":   page = <ShiftsPage data={data} />; break;
    case "payroll":  page = <PayrollPage data={data} onUpdate={handleUpdate} />; break;
    case "salary":   page = <SalaryPage data={data} />; break;
    case "benefits": page = <BenefitsPage data={data} />; break;
    case "perf":     page = <PerformancePage data={data} />; break;
    case "learn":    page = <TrainingPage data={data} />; break;
    case "portal":   page = <PortalRoute embedded />; break;
    default:         page = <PeoplePage data={data} onOpenEmployee={setOpenEmployee} onAdd={handleAdd} />;
  }

  return (
    <div className="hr-shell">
      <div className="hr-subnav">
        {PAGES.map((p) => (
          <button key={p.id} className={"hr-subnav-item" + (route === p.id ? " hr-subnav-item--active" : "")} onClick={() => setRoute(p.id)}>
            <Icon name={p.icon} size={15} /><span>{p.label}</span>
          </button>
        ))}
      </div>
      <div className="hr-content">{page}</div>

      {openEmployee && (
        <EmployeeDrawer
          employee={openEmployee}
          departments={data.departments}
          onClose={() => setOpenEmployee(null)}
          onUpdate={(u) => { setOpenEmployee(u); upsertEmployee(u); }}
          onDelete={(empId) => { setOpenEmployee(null); removeEmployee(empId); }}
        />
      )}
    </div>
  );
}

// Employees never see the admin HR pages — just their own self-service portal.
function EmployeeApp() {
  return <PortalRoute />;
}

export default function App() {
  let authUser = null;
  try { authUser = JSON.parse(localStorage.getItem(USER_KEY)); } catch { authUser = null; }
  return authUser?.userRole === "employee" ? <EmployeeApp /> : <AdminApp />;
}
