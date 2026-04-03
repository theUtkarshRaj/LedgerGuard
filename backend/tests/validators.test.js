const { test } = require("node:test");
const assert = require("node:assert/strict");
const { registerSchema } = require("../src/validators/auth.validator");
const { createRecordSchema } = require("../src/validators/record.validator");

test("registerSchema rejects invalid input", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        name: "A",
        email: "a@b.co",
        password: "short",
      }),
    (err) => err.name === "ZodError"
  );
});

test("createRecordSchema accepts decimal string amounts", () => {
  const parsed = createRecordSchema.parse({
    userId: 1,
    amount: "99.50",
    type: "EXPENSE",
    category: "Travel",
    date: "2026-01-15",
    note: "Taxi",
  });
  assert.equal(parsed.amount, "99.50");
});

test("createRecordSchema allows omitting userId (controller supplies owner)", () => {
  const parsed = createRecordSchema.parse({
    amount: "10.00",
    type: "INCOME",
    category: "Salary",
    date: "2026-01-01",
  });
  assert.equal(parsed.userId, undefined);
});

test("createRecordSchema rejects negative amounts", () => {
  assert.throws(
    () =>
      createRecordSchema.parse({
        userId: 1,
        amount: -10,
        type: "INCOME",
        category: "X",
        date: "2026-01-01",
      }),
    /Too small/i
  );
});

const { listUsersQuerySchema } = require("../src/validators/user.validator");

test("listUsersQuerySchema coerces isActive query strings", () => {
  const a = listUsersQuerySchema.parse({ isActive: "true" });
  assert.equal(a.isActive, true);
  const b = listUsersQuerySchema.parse({ isActive: "false" });
  assert.equal(b.isActive, false);
});
