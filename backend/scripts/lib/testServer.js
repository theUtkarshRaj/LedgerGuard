const http = require("http");

/**
 * Binds `app` on a random port, runs `fn(port)`, then closes the server.
 * @param {import("http").RequestListener} app
 * @param {(port: number) => Promise<void>} fn
 */
async function withTestServer(app, fn) {
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.listen(0, (err) => (err ? reject(err) : resolve()));
  });
  const port = server.address().port;
  try {
    await fn(port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

module.exports = { withTestServer };
