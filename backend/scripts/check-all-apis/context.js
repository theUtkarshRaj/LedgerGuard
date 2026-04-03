const { json } = require("../lib/httpClient");
const { createReporter } = require("../lib/reporter");

/**
 * @param {number} port
 */
function createApiCheckContext(port) {
  const rep = createReporter();
  let extraFailures = 0;
  return {
    port,
    json: (path, opts) => json(port, path, opts),
    async login(email, password) {
      const r = await json(port, "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (r.status !== 200) {
        throw new Error(`login failed ${email}: ${r.status} ${r.raw}`);
      }
      return r.json.data.token;
    },
    pass: rep.pass.bind(rep),
    fail: rep.fail.bind(rep),
    get failCount() {
      return rep.failCount + extraFailures;
    },
    noteUncaughtFailure() {
      extraFailures++;
    },
  };
}

module.exports = { createApiCheckContext };
