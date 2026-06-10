import React, { useState } from "react";
import "./legacy/hrm.css";
import "./proj.css";
import { Icon } from "./legacy.jsx";
import ProjectPage from "./pages/ProjectPage.jsx";
import QuotationPage from "./pages/QuotationPage.jsx";
import InvoicePage from "./pages/InvoicePage.jsx";
import ProjectReportPage from "./pages/ProjectReportPage.jsx";

const PAGES = [
  { id: "pipeline",   label: "Pipeline",   icon: "folder-kanban" },
  { id: "quotations", label: "Quotations", icon: "file-text" },
  { id: "invoices",   label: "Invoices",   icon: "file-check-2" },
  { id: "projreport", label: "P&L Report", icon: "bar-chart-3" },
];

export default function App() {
  const [route, setRoute] = useState("pipeline");
  // onNav lets Quotation→Invoice cross-navigation work (monolith passes route ids).
  const onNav = (id) => setRoute(id === "invoices" ? "invoices" : id);
  let page;
  switch (route) {
    case "quotations": page = <QuotationPage onNav={onNav} />; break;
    case "invoices":   page = <InvoicePage onNav={onNav} />; break;
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
