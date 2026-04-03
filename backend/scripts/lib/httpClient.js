const http = require("http");

/**
 * Raw HTTP request to the test server.
 * @param {number} port
 * @param {string} path - e.g. `/api/auth/login`
 * @param {{ method?: string, headers?: Record<string,string>, body?: string }} [opts]
 */
function httpRequest(port, path, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(path, `http://127.0.0.1:${port}`);
    const req = http.request(
      u,
      { method: opts.method || "GET", headers: opts.headers || {} },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

/**
 * JSON response helper (throws if body is not valid JSON when non-empty).
 */
async function json(port, path, opts = {}) {
  const r = await httpRequest(port, path, opts);
  let parsed = null;
  if (r.body) {
    try {
      parsed = JSON.parse(r.body);
    } catch {
      parsed = null;
    }
  }
  return { status: r.status, json: parsed, raw: r.body };
}

module.exports = { httpRequest, json };
