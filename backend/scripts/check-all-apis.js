/**
 * Exercises every HTTP route and prints PASS/FAIL with status codes.
 * Uses its own server on a random port (no need for npm start).
 */
require("./lib/env");
const app = require("../src/app");
const { withTestServer } = require("./lib/testServer");
const { runAllApiChecks } = require("./check-all-apis/run");

async function main() {
  let failed = 0;
  await withTestServer(app, async (port) => {
    failed = await runAllApiChecks(port);
  });
  console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
  process.exit(failed ? 1 : 0);
}

main();
