/**
 * Orchestrates route checks in order; each suite may mutate shared `state`.
 */
const runPublic = require("./suites/public");
const runAuth = require("./suites/auth");
const runUsers = require("./suites/users");
const runRecords = require("./suites/records");
const runDashboard = require("./suites/dashboard");
const runValidation = require("./suites/validation");
const { createApiCheckContext } = require("./context");

const suites = [
  runPublic,
  runAuth,
  runUsers,
  runRecords,
  runDashboard,
  runValidation,
];

/**
 * @param {number} port
 * @returns {Promise<number>} failure count
 */
async function runAllApiChecks(port) {
  const ctx = createApiCheckContext(port);
  const state = {};

  try {
    for (const suite of suites) {
      await suite(ctx, state);
    }
  } catch (e) {
    console.error(e);
    ctx.noteUncaughtFailure();
  }

  return ctx.failCount;
}

module.exports = { runAllApiChecks };
