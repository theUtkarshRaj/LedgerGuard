import { AUTH_TOKEN_KEY } from "../authStorage";

/**
 * Configurable API origin (no trailing slash).
 *
 * - **Vite:** `VITE_API_BASE_URL` in `.env` (empty = same-origin `/api` + dev proxy).
 * - **CRA (other projects):** would use `process.env.REACT_APP_API_BASE_URL`.
 */
function readBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL;
  if (raw == null || raw === "") return "";
  return String(raw).replace(/\/$/, "");
}

if (import.meta.env.PROD && readBaseUrl() === "") {
  console.error(
    "[LedgerGuard] VITE_API_BASE_URL is unset. The UI will call /api on this host and get 404. In Vercel: Project → Settings → Environment Variables → add VITE_API_BASE_URL=https://ledgerguard.onrender.com (no trailing slash), then redeploy."
  );
}

export function apiPath(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = readBaseUrl();
  return base ? `${base}${p}` : p;
}

function errorMessageFromResponse(data, res) {
  const detailsMsg = Array.isArray(data?.error?.details)
    ? data.error.details
        .map((d) => (d.path ? `${d.path}: ${d.message}` : d.message))
        .join("; ")
    : null;
  return (
    detailsMsg ||
    data?.error?.message ||
    data?.message ||
    res.statusText ||
    `HTTP ${res.status}`
  );
}

/**
 * Authenticated JSON request. Throws `Error` when `!res.ok`.
 */
export async function apiRequest(path, options = {}) {
  const { method = "GET", body, headers: extra = {}, signal } = options;
  const headers = { ...extra };
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(apiPath(path), {
    method,
    headers,
    signal,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new Event("auth-failed"));
    }
    const msg = errorMessageFromResponse(data, res);
    const err = new Error(msg || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export function toSearchParams(obj) {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (value === "") continue;
    p.set(key, String(value));
  }
  return p;
}
