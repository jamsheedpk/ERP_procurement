/**
 * Shared API client for all micro-frontends.
 *
 * The Express backend (hrm_server.js) remains the single shared API — MFEs are a
 * frontend-only split, so every remote talks to the same `/api` surface. The base
 * URL is configurable per-app via VITE_API_BASE (defaults to the dev backend).
 *
 * Auth: the shell owns login and stores the JWT under `meridian_token`; this client
 * attaches it automatically so remotes never re-implement auth.
 */
export const API_BASE =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
  "http://localhost:5000/api";

export const TOKEN_KEY = "meridian_token";
export const USER_KEY = "meridian_user";

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

function authHeaders(extra) {
  const t = getToken();
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}), ...(extra || {}) };
}

async function handle(res) {
  let body = null;
  try { body = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body;
}

export const api = {
  base: API_BASE,
  get:   (path, opts)        => fetch(`${API_BASE}${path}`, { headers: authHeaders(), ...opts }).then(handle),
  post:  (path, data, opts)  => fetch(`${API_BASE}${path}`, { method: "POST",  headers: authHeaders(), body: JSON.stringify(data), ...opts }).then(handle),
  patch: (path, data, opts)  => fetch(`${API_BASE}${path}`, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(data), ...opts }).then(handle),
  del:   (path, opts)        => fetch(`${API_BASE}${path}`, { method: "DELETE", headers: authHeaders(), ...opts }).then(handle),
  // multipart upload (FormData) — does not set Content-Type so the browser adds the boundary
  upload: (path, formData, opts) => {
    const t = getToken();
    return fetch(`${API_BASE}${path}`, { method: "POST", headers: t ? { Authorization: `Bearer ${t}` } : {}, body: formData, ...opts }).then(handle);
  },
};

// Origin that serves uploaded files (strip the trailing /api).
export const FILE_BASE = API_BASE.replace(/\/api\/?$/, "");
