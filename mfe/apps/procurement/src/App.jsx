import React from "react";
import "./legacy/hrm.css"; // ports the monolith styling (pulls colors_and_type.css via @import)
import ProcurementPage from "./ProcurementPage.jsx";

// Exposed micro-frontend root — the full, feature-complete procurement module
// (lifecycle, Material & Labour list, vendor comparison + attachments + PDFs,
// LPO issue, payment applications) ported wholesale from the monolith.
export default function App() {
  return <ProcurementPage />;
}
