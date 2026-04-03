const { test } = require("node:test");
const assert = require("node:assert/strict");
const errorHandler = require("../src/middleware/error.middleware");
const AppError = require("../src/utils/AppError");
const { registerSchema } = require("../src/validators/auth.validator");

function mockRes() {
  const res = {
    headersSent: false,
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

test("maps ZodError to 400 with details", () => {
  let err;
  try {
    registerSchema.parse({ name: "A", email: "a@b.co", password: "short" });
  } catch (e) {
    err = e;
  }
  const res = mockRes();
  errorHandler(err, {}, res, () => assert.fail("should not call next"));
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error.message, "Validation failed");
  assert.ok(Array.isArray(res.body.error.details));
  assert.equal(res.body.error.details[0].path, "name");
});

test("maps AppError to its status code", () => {
  const res = mockRes();
  errorHandler(new AppError("Nope", 404), {}, res, () => assert.fail("next"));
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error.message, "Nope");
});

test("maps Prisma P2002 to 409", () => {
  const res = mockRes();
  const err = new Error("unique");
  err.code = "P2002";
  errorHandler(err, {}, res, () => assert.fail("next"));
  assert.equal(res.statusCode, 409);
  assert.match(res.body.error.message, /already exists/i);
});

test("maps Prisma P2025 to 404", () => {
  const res = mockRes();
  const err = new Error("not found");
  err.code = "P2025";
  errorHandler(err, {}, res, () => assert.fail("next"));
  assert.equal(res.statusCode, 404);
});

test("passes to next when headers already sent", () => {
  let passed = null;
  const res = mockRes();
  res.headersSent = true;
  errorHandler(new Error("x"), {}, res, (e) => {
    passed = e;
  });
  assert.equal(passed?.message, "x");
});
