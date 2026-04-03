/**
 * PASS/FAIL lines for CLI check scripts.
 */
function logRow(name, ok, detail = "") {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark}\t${name}${detail ? `\t${detail}` : ""}`);
}

function createReporter() {
  let failed = 0;
  return {
    pass(name, detail = "") {
      logRow(name, true, detail);
    },
    fail(name, msg) {
      failed++;
      logRow(name, false, msg);
    },
    get failCount() {
      return failed;
    },
  };
}

module.exports = { logRow, createReporter };
