import React, { useEffect, useState } from "react";
import { api } from "@meridian/api";
import { Card, KPI, Spinner, Icon } from "@meridian/ui";

// Stub remote — proves the federation + shared-API wiring. Migrate the monolith's
// People/Payroll/Leave/Attendance pages here, one component at a time.
export default function App() {
  const [count, setCount] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    api.get("/employees").then((d) => setCount(Array.isArray(d) ? d.length : 0)).catch(() => setErr(true));
  }, []);
  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Icon name="users" size={20} color="var(--brand-burgundy)" />
        <h1 style={{ margin: 0, fontSize: 22 }}>People &amp; Culture</h1>
      </div>
      <p style={{ color: "var(--fg-3)", fontSize: 13, marginTop: 0 }}>
        HR micro-frontend (stub). Employees, leave, payroll &amp; attendance migrate here.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, maxWidth: 720 }}>
        <KPI label="Employees" value={err ? "—" : count == null ? "…" : count} sub="from shared API" icon="users" />
      </div>
      {count == null && !err && <Spinner label="Querying shared API…" />}
    </div>
  );
}
