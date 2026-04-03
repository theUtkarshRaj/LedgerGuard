const cors = require("cors");

/** Origins allowed when NODE_ENV is not production (no CLIENT_URL). */
const DEV_LOCAL_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

/**
 * Builds the set of browser origins allowed by CORS.
 * - Production: only `CLIENT_URL` (must be set; validated at startup).
 * - Non-production: `CLIENT_URL` if set, plus local dev origins.
 */
function getAllowedOrigins() {
  const isProd = process.env.NODE_ENV === "production";
  const clientUrl = process.env.CLIENT_URL?.trim();
  const allowed = new Set();

  if (isProd) {
    if (clientUrl) allowed.add(clientUrl);
    return allowed;
  }

  if (clientUrl) allowed.add(clientUrl);
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
  DEV_LOCAL_ORIGINS,
};
