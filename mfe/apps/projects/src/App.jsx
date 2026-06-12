import React, { useState } from "react";
import "./legacy/hrm.css";
import "./proj.css";
import { Icon } from "./legacy.jsx";
import ProjectPage from "./pages/ProjectPage.jsx";
import InvoicePage from "./pages/InvoicePage.jsx";
import ProjectReportPage from "./pages/ProjectReportPage.jsx";

const PAGES = [
  { id: "pipeline",   label: "Pipeline",   icon: "folder-kanban" },
  { id: "invoices",   label: "Invoices",   icon: "file-check-2" },
  { id: "projreport", label: "P&L Report", icon: "bar-chart-3" },
];

export default function App() {
  const [route, setRoute] = useState("pipeline");
  let page;
  switch (route) {
    case "invoices":   page = <InvoicePage />; break;
    case "projreport": page = <ProjectReportPage />; break;
    default:           page = <ProjectPage />;
  }
  return (
    <div className="proj-shell">
      <div className="proj-subnav">
        {PAGES.map((p) => (
          <button key={p.id} className={"proj-subnav-item" + (route === p.id ? " proj-subnav-item--active" : "")} onClick={() => setRoute(p.id)}>
            <Icon name={p.icon} size={15} /><span>{p.label}</span>
          </button>
        ))}
      </div>
      <div className="proj-content">{page}</div>
    </div>
  );
}
