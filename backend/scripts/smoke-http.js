require("./lib/env");
const { withTestServer } = require("./lib/testServer");
const { json } = require("./lib/httpClient");
const app = require("../src/app");

async function main() {
  await withTestServer(app, async (port) => {
    const login = await json(port, "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "viewer@demo.local",
        password: "ChangeMe!123",
      }),
    });
    console.log("login", login.status);
    const token = login.json?.data?.token;
    const summary = await json(port, "/api/dashboard/summary", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("summary", summary.status, (summary.raw || "").slice(0, 200));
    const trends = await json(port, "/api/dashboard/trends?granularity=month", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("trends", trends.status, (trends.raw || "").slice(0, 200));
    const blocked = await json(port, "/api/records", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("viewer records (expect 403)", blocked.status);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
