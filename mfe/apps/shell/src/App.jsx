import React, { Suspense, useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { applyTheme } from "@meridian/theme";
import { Spinner } from "@meridian/ui";
import { api, getToken, USER_KEY, TOKEN_KEY } from "@meridian/api";
import { Sidebar } from "./Sidebar.jsx";
import { Login } from "./Login.jsx";
import { RemoteBoundary } from "./RemoteBoundary.jsx";

// Federated remotes — each is an independently built & deployed micro-frontend.
// React.lazy + the host's federation config resolve `remote/App` at runtime.
const ProcurementApp = React.lazy(() => import("procurement/App"));
const HrApp          = React.lazy(() => import("hr/App"));
const FinanceApp     = React.lazy(() => import("finance/App"));
const ProjectsApp    = React.lazy(() => import("projects/App"));

function RemoteRoute({ name, children }) {
  const loc = useLocation();
  return (
    <RemoteBoundary name={name} routeKey={loc.pathname}>
      <Suspense fallback={<Spinner label={`Loading ${name}…`} />}>{children}</Suspense>
    </RemoteBoundary>
  );
}

function Layout({ user, onLogout }) {
  return (
    <div className="shell-root">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="shell-main">
        <Routes>
          <Route path="/" element={<Navigate to="/procurement" replace />} />
          <Route path="/procurement/*" element={<RemoteRoute name="Procurement"><ProcurementApp /></RemoteRoute>} />
          <Route path="/hr/*"          element={<RemoteRoute name="People & Culture"><HrApp /></RemoteRoute>} />
          <Route path="/finance/*"     element={<RemoteRoute name="Finance"><FinanceApp /></RemoteRoute>} />
          <Route path="/projects/*"    element={<RemoteRoute name="Projects"><ProjectsApp /></RemoteRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
  });
  const [checked, setChecked] = useState(false);

  useEffect(() => { applyTheme("#6F1947"); }, []);

  // Validate any stored token on boot.
  useEffect(() => {
    if (!getToken()) { setChecked(true); return; }
    api.get("/auth/me")
      .then((u) => { setUser(u); setChecked(true); })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null); setChecked(true); });
  }, []);

  const onLogout = () => {
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); setUser(null);
  };

  if (!checked) return <Spinner label="Starting…" />;
  if (!user) return <Login onLogin={setUser} />;

  return (
    <HashRouter>
      <Layout user={user} onLogout={onLogout} />
    </HashRouter>
  );
}
