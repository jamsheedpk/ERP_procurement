import React, { useState } from "react";
import "./legacy/hrm.css"; // ports the monolith styling (pulls colors_and_type.css via @import)
import "./prc.css";
import { Icon } from "./legacy.jsx";
import ProcurementPage from "./pages/ProcurementPage.jsx";
import MaterialLabourPage from "./pages/MaterialLabourPage.jsx";
import VendorQuotesPage from "./pages/VendorQuotesPage.jsx";
import PurchaseOrdersPage from "./pages/PurchaseOrdersPage.jsx";
import PaymentApplicationsPage from "./pages/PaymentApplicationsPage.jsx";

const PAGES = [
  { id: "lifecycle", label: "Lifecycle",         icon: "git-merge" },
  { id: "boq",       label: "Material & Labour", icon: "list-checks" },
  { id: "quotes",    label: "Quote Comparison",  icon: "scale" },
  { id: "lpo",       label: "Purchase Orders",   icon: "file-output" },
  { id: "payapp",    label: "Payment Apps",      icon: "file-plus" },
];

// Exposed micro-frontend root — the full procurement module: the 11-stage
// lifecycle board (vendor comparison, LPOs, payment applications, PDFs), plus
// the Material & Labour (BOQ) lists surfaced as their own module.
export default function App() {
  const [route, setRoute] = useState("lifecycle");
  return (
    <div className="prc-shell">
      <div className="prc-subnav">
        {PAGES.map((p) => (
          <button key={p.id} className={"prc-subnav-item" + (route === p.id ? " prc-subnav-item--active" : "")} onClick={() => setRoute(p.id)}>
            <Icon name={p.icon} size={15} /><span>{p.label}</span>
          </button>
        ))}
      </div>
      <div className="prc-content">
        {route === "boq" ? <MaterialLabourPage /> : route === "quotes" ? <VendorQuotesPage /> : route === "lpo" ? <PurchaseOrdersPage /> : route === "payapp" ? <PaymentApplicationsPage /> : <ProcurementPage />}
      </div>
    </div>
  );
}
