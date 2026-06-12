import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@meridian/api";

const SEEN_KEY = "meridian_notif_seen";
const POLL_MS = 60000;

const loadSeen = () => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) || []); } catch { return new Set(); }
};
const saveSeen = (set) => {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...set])); } catch { /* private mode */ }
};

const fmtAED = (n) => "AED " + (Number(n) || 0).toLocaleString();

/**
 * Derives the admin's work queue from live data: pending leave requests and
 * expense claims, overdue/past-due invoices, and procurement requests sitting
 * at an approval stage. Each item deep-links to its module.
 */
async function fetchNotifications() {
  const [leaves, expenses, invoices, procs] = await Promise.allSettled([
    api.get("/leave-requests"),
    api.get("/expenses"),
    api.get("/invoices"),
    api.get("/procurement"),
  ]).then((rs) => rs.map((r) => (r.status === "fulfilled" && Array.isArray(r.value) ? r.value : [])));

  const items = [];

  leaves.filter((l) => l.status === "pending").forEach((l) => items.push({
    id: `lv-${l.leaveId}`,
    icon: "calendar-off", color: "var(--warning-700, #D78A14)",
    title: `Leave request · ${l.emp}`,
    sub: `${l.typeLbl || l.type} · ${l.from} → ${l.to} (${l.days || 1}d)`,
    to: "/hr",
  }));

  expenses.filter((e) => e.status === "pending").forEach((e) => items.push({
    id: `ex-${e.expenseId}`,
    icon: "receipt", color: "var(--info-700, #2563B0)",
    title: `Expense awaiting review · ${e.empName}`,
    sub: `${e.desc} · ${fmtAED(e.amount)}`,
    to: "/finance",
  }));

  const today = new Date().toISOString().slice(0, 10);
  invoices.filter((inv) =>
    inv.status === "overdue" ||
    (["unpaid", "partial"].includes(inv.status) && inv.balanceDue > 0 && inv.dueDate && inv.dueDate < today)
  ).forEach((inv) => items.push({
    id: `in-${inv.invoiceId}`,
    icon: "alert-circle", color: "var(--danger-700, #C0263A)",
    title: `Invoice past due · ${inv.invoiceId}`,
    sub: `${inv.clientName || inv.partyName || ""} · ${fmtAED(inv.balanceDue)} outstanding`,
    to: "/finance",
  }));

  procs.filter((p) => p.status === "in_progress" && /approval/.test(p.currentStage || "")).forEach((p) => items.push({
    id: `pr-${p.procId}-${p.currentStage}`,
    icon: "git-merge", color: "var(--brand-burgundy, #6F1947)",
    title: `Procurement awaiting approval · ${p.title || p.procId}`,
    sub: `${p.projectName || p.procId} · stage: ${String(p.currentStage).replace(/_/g, " ")}`,
    to: "/procurement",
  }));

  return items;
}

export function useNotifications() {
  const [items, setItems] = useState([]);
  const [seen, setSeen] = useState(loadSeen);
  const timer = useRef(null);

  const refresh = useCallback(() => {
    fetchNotifications().then(setItems).catch(() => { /* keep last list on transient errors */ });
  }, []);

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer.current);
  }, [refresh]);

  const markAllSeen = useCallback(() => {
    setSeen((prev) => {
      const next = new Set(prev);
      items.forEach((it) => next.add(it.id));
      saveSeen(next);
      return next;
    });
  }, [items]);

  const unseenCount = items.reduce((n, it) => n + (seen.has(it.id) ? 0 : 1), 0);
  return { items, seen, unseenCount, markAllSeen, refresh };
}
