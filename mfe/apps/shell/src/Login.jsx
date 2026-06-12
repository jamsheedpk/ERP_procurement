import React, { useState } from "react";
import { api, TOKEN_KEY, USER_KEY } from "@meridian/api";
import { Button, Icon } from "@meridian/ui";

export function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@meridian.ae");
  const [password, setPassword] = useState("admin123");
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
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-mark">M</div>
        <div className="login-title">Welcome back</div>
        <div className="login-sub">Sign in to the Meridian workspace</div>
        <label className="login-label">Email</label>
        <input className="login-input" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@meridian.ae" />
        <label className="login-label">Password</label>
        <input className="login-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        {err && <div className="login-err"><Icon name="alert-circle" size={13} /> {err}</div>}
        <Button variant="primary" type="submit" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <div className="login-hint">Demo · admin@meridian.ae / admin123</div>
      </form>
    </div>
  );
}
