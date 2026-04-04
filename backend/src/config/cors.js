const cors = require("cors");

/** Origins allowed when NODE_ENV is not production (no CLIENT_URL). */
const DEV_LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

/** Split `CLIENT_URL` on commas so production can allow Vercel prod + preview origins. */
function parseClientOrigins(raw) {
  if (raw == null || String(raw).trim() === "") return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Builds the set of browser origins allowed by CORS.
 * - Production: only origins from `CLIENT_URL` (must be set; validated at startup).
 * - Non-production: `CLIENT_URL` origins if set, plus local dev origins.
 */
function getAllowedOrigins() {
  const isProd = process.env.NODE_ENV === "production";
  const clientOrigins = parseClientOrigins(process.env.CLIENT_URL);
  const allowed = new Set();

  if (isProd) {
    for (const o of clientOrigins) allowed.add(o);
    return allowed;
  }

  for (const o of clientOrigins) allowed.add(o);
  for (const o of DEV_LOCAL_ORIGINS) allowed.add(o);
  return allowed;
}

function corsOptionsDelegate() {
  const allowed = getAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    optionsSuccessStatus: 204,
  };
}

const corsMiddleware = cors(corsOptionsDelegate());

module.exports = {
  corsMiddleware,
  getAllowedOrigins,
  parseClientOrigins,
  DEV_LOCAL_ORIGINS,
};
