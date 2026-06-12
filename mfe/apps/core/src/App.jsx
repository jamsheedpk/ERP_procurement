import React, { useState } from "react";
import "./legacy/hrm.css"; // monolith styling (pulls colors_and_type.css via @import)
import "./core.css";
import { Icon } from "./legacy.jsx";
import { useCoreData } from "./data.js";

import DashboardPage from "./pages/DashboardPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import PermissionsPage from "./pages/PermissionsPage.jsx";

const PAGES = [
  { id: "dashboard",   label: "Dashboard",   icon: "layout-dashboard" },
  { id: "reports",     label: "Reports",     icon: "bar-chart-3" },
  { id: "permissions", label: "Permissions", icon: "shield-check" },
];

// The Dashboard calls onNav with monolith route names; map them onto the shell's
// hash routes so the exec overview's deep links still land in the right remote.
const REMOTE_FOR = {
  projects: "#/projects",
  finance: "#/finance", procurement: "#/procurement",
  leave: "#/hr", people: "#/hr", payroll: "#/hr", recruit: "#/hr", org: "#/hr",
};
function navTo(route) {
  const hash = REMOTE_FOR[route];
  if (hash && typeof window !== "undefined") window.location.hash = hash;
}

export default function App() {
  const [route, setRoute] = useState("dashboard");
  const { data, error } = useCoreData();

  let page;
  switch (route) {
    case "dashboard":   page = <DashboardPage onNav={navTo} />; break;
    case "reports":
      if (error) { page = <div className="core-state"><Icon name="alert-circle" size={28} color="var(--danger-500)" /><div>{error}</div></div>; break; }
      if (!data) { page = <div className="core-state"><div className="core-spin" /><div>Loading report data…</div></div>; break; }
      page = <ReportsPage data={data} />; break;
    case "permissions": page = <PermissionsPage />; break;
    default:            page = <DashboardPage onNav={navTo} />;
  }

  return (
    <div className="core-shell">
      <div className="core-subnav">
        {PAGES.map((p) => (
          <button key={p.id} className={"core-subnav-item" + (route === p.id ? " core-subnav-item--active" : "")} onClick={() => setRoute(p.id)}>
            <Icon name={p.icon} size={15} /><span>{p.label}</span>
          </button>
        ))}
      </div>
      <div className="core-content">{page}</div>
    </div>
  );
}
