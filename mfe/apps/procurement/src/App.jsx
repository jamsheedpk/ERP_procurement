import React, { useCallback, useEffect, useState } from "react";
import { api } from "@meridian/api";
import { Spinner, ErrorState } from "@meridian/ui";
import { ProcurementList } from "./ProcurementList.jsx";
import { ProcurementDetail } from "./ProcurementDetail.jsx";
import "./procurement.css";

// Exposed micro-frontend root. Self-contained list↔detail navigation via local
// state so it works identically whether mounted in the shell or run standalone.
export default function App() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setError(null); setItems(null);
    api.get("/procurement")
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  if (error) return <ErrorState title="Couldn't load procurement" message={error} onRetry={load} />;
  if (!items) return <Spinner label="Loading procurement…" />;

  const sel = items.find((p) => p.procId === selected) || null;
  return sel
    ? <ProcurementDetail proc={sel} onBack={() => setSelected(null)} />
    : <ProcurementList items={items} onOpen={setSelected} />;
}
