/**
 * Fail fast on missing required configuration (no silent defaults).
 */
function validateEnv() {
  const required = ["DATABASE_URL", "JWT_SECRET"];
  for (const name of required) {
    const v = process.env[name];
    if (v == null || String(v).trim() === "") {
      console.error(`FATAL: missing required environment variable: ${name}`);
      process.exit(1);
    }
  }

  if (process.env.NODE_ENV === "production") {
    const clientUrl = process.env.CLIENT_URL?.trim();
    if (!clientUrl) {
      console.error(
        "FATAL: CLIENT_URL is required in production for CORS (no open origins)"
      );
      process.exit(1);
    }
  }
}

module.exports = validateEnv;
