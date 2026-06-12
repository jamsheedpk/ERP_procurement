import React, { useState } from "react";
import { api, TOKEN_KEY, USER_KEY } from "@meridian/api";
import { Icon } from "@meridian/ui";

const DEMO = [
  { label: "Admin demo",    email: "admin@meridian.ae",   password: "admin123", icon: "shield-check" },
  { label: "Employee demo", email: "aarav.s@meridian.ae", password: "emp123",   icon: "user-circle" },
];

const FEATURES = [
  { icon: "users",         title: "People & Culture",      sub: "Employees, leave, payroll, performance" },
  { icon: "wallet",        title: "Finance & Projects",    sub: "Cash book, invoicing, pipeline P&L" },
  { icon: "git-merge",     title: "Procurement lifecycle", sub: "Enquiry to delivery across 11 stages" },
];

export function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.token || res.accessToken;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user || res));
      onLogin(res.user || res);
    } catch (e2) { setErr(e2.message || "Login failed"); }
    setBusy(false);
  };

  return (
    <div className="login-page">
      {/* ── Brand panel ── */}
      <aside className="login-brand">
        <div className="login-brand-top">
          <div className="login-brand-mark">M</div>
          <div>
            <div className="login-brand-name">Meridian ERP</div>
            <div className="login-brand-sub">Logistics DMCC</div>
          </div>
        </div>

        <div className="login-brand-body">
          <h2 className="login-brand-headline">One workspace for your entire logistics operation.</h2>
          <p className="login-brand-copy">HR, finance, projects and procurement — connected in a single, role-aware platform.</p>
          <ul className="login-features">
            {FEATURES.map((f) => (
              <li key={f.title}>
                <span className="login-feature-ico"><Icon name={f.icon} size={16} /></span>
                <span>
                  <span className="login-feature-title">{f.title}</span>
                  <span className="login-feature-sub">{f.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="login-brand-foot">© 2026 Meridian Logistics DMCC · Enterprise</div>
        <div className="login-brand-glow login-brand-glow--a" />
        <div className="login-brand-glow login-brand-glow--b" />
      </aside>

      {/* ── Form panel ── */}
      <main className="login-pane">
        <form className="login-form" onSubmit={submit}>
          <div className="login-eyebrow">Welcome back</div>
          <h1 className="login-heading">Sign in to your account</h1>
          <p className="login-lede">Enter your work credentials to continue.</p>

          <label className="login-label" htmlFor="login-email">Email address</label>
          <div className="login-field">
            <Icon name="mail" size={15} />
            <input id="login-email" type="email" autoFocus autoComplete="username"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@meridian.ae" />
          </div>

          <label className="login-label" htmlFor="login-password">Password</label>
          <div className="login-field">
            <Icon name="lock" size={15} />
            <input id="login-password" type={showPw ? "text" : "password"} autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" className="login-eye" title={showPw ? "Hide password" : "Show password"}
              onClick={() => setShowPw((s) => !s)}>
              <Icon name={showPw ? "eye-off" : "eye"} size={15} />
            </button>
          </div>

          {err && <div className="login-error"><Icon name="alert-circle" size={14} /> {err}</div>}

          <button className="login-submit" type="submit" disabled={busy || !email || !password}>
            {busy ? <span className="login-spin" /> : <Icon name="log-in" size={15} />}
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <div className="login-divider"><span>Demo accounts</span></div>
          <div className="login-demos">
            {DEMO.map((d) => (
              <button key={d.label} type="button" className="login-demo"
                onClick={() => { setEmail(d.email); setPassword(d.password); setErr(""); }}>
                <Icon name={d.icon} size={14} />
                <span>
                  <span className="login-demo-label">{d.label}</span>
                  <span className="login-demo-mail">{d.email}</span>
                </span>
              </button>
            ))}
          </div>
        </form>
      </main>
    </div>
  );
}
