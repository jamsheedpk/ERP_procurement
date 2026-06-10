import React, { useState } from "react";
import "./legacy/hrm.css";
import "./fin.css";
import { Icon } from "./legacy.jsx";
import ExpensePage from "./pages/ExpensePage.jsx";
import CashBookPage from "./pages/CashBookPage.jsx";
import DayBookPage from "./pages/DayBookPage.jsx";
import PartyPage from "./pages/PartyPage.jsx";

const PAGES = [
  { id: "expense",  label: "Expenses",  icon: "receipt" },
  { id: "cashbook", label: "Cash Book", icon: "book-open" },
  { id: "daybook",  label: "Day Book",  icon: "notebook" },
  { id: "parties",  label: "Parties",   icon: "building-2" },
];

export default function App() {
  const [route, setRoute] = useState("expense");
  let page;
  switch (route) {
    case "cashbook": page = <CashBookPage />; break;
    case "daybook":  page = <DayBookPage />; break;
    case "parties":  page = <PartyPage />; break;
    default:         page = <ExpensePage />;
  }
  return (
    <div className="fin-shell">
      <div className="fin-subnav">
        {PAGES.map((p) => (
          <button key={p.id} className={"fin-subnav-item" + (route === p.id ? " fin-subnav-item--active" : "")} onClick={() => setRoute(p.id)}>
            <Icon name={p.icon} size={15} /><span>{p.label}</span>
          </button>
        ))}
      </div>
      <div className="fin-content">{page}</div>
    </div>
  );
}
