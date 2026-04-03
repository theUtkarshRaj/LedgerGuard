const { test } = require("node:test");
const assert = require("node:assert/strict");
const { restrictTo } = require("../src/middleware/auth.middleware");
const AppError = require("../src/utils/AppError");

test("restrictTo allows matching role", () =>
  new Promise((resolve, reject) => {
    const mw = restrictTo("ADMIN", "ANALYST");
    mw({ user: { role: "ANALYST" } }, {}, (err) => {
      if (err) reject(err);
      else resolve();
    });
  }));

test("restrictTo rejects missing req.user", () =>
  new Promise((resolve) => {
    const mw = restrictTo("ADMIN");
    mw({}, {}, (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 401);
      resolve();
    });
  }));

test("restrictTo rejects wrong role with 403", () =>
  new Promise((resolve) => {
    const mw = restrictTo("ADMIN");
    mw({ user: { role: "VIEWER" } }, {}, (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 403);
      resolve();
    });
  }));
