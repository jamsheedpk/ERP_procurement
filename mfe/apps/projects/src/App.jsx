import React, { useEffect, useState } from "react";
import { api } from "@meridian/api";
import { KPI, Spinner, Icon } from "@meridian/ui";

// Stub remote. Migrate the project pipeline, quotations, invoices & P&L here.
export default function App() {
  const [count, setCount] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    api.get("/projects").then((d) => setCount(Array.isArray(d) ? d.length : 0)).catch(() => setErr(true));
  }, []);
  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Icon name="folder-kanban" size={20} color="var(--brand-burgundy)" />
        <h1 style={{ margin: 0, fontSize: 22 }}>Projects</h1>
      </div>
      <p style={{ color: "var(--fg-3)", fontSize: 13, marginTop: 0 }}>
        Projects micro-frontend (stub). Pipeline, quotations, invoices &amp; P&amp;L migrate here.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, maxWidth: 720 }}>
        <KPI label="Projects" value={err ? "—" : count == null ? "…" : count} sub="from shared API" icon="folder-kanban" />
      </div>
      {count == null && !err && <Spinner label="Querying shared API…" />}
    </div>
  );
}
