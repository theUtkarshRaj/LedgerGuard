"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const AppError = require("../src/utils/AppError");
const { setPrismaMock, teardownPrismaServiceMocks } = require("./mockPrismaModule");

const sampleCreateInput = {
  userId: 1,
  amount: "10.00",
  type: "INCOME",
  category: "Test",
  date: new Date("2026-01-01"),
};

test("record.service createRecord rejects missing owner user", async (t) => {
  t.after(teardownPrismaServiceMocks);
  setPrismaMock({
    user: { findUnique: async () => null },
    record: {
      create: async () => {
        throw new Error("create should not run");
      },
    },
  });
  const recordService = require("../src/services/record.service");
  await assert.rejects(
    () => recordService.createRecord({ ...sampleCreateInput, userId: 999 }),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /does not exist/i);
      return true;
    }
  );
});

test("record.service createRecord rejects inactive owner", async (t) => {
  t.after(teardownPrismaServiceMocks);
  setPrismaMock({
    user: { findUnique: async () => ({ id: 1, isActive: false }) },
    record: {
      create: async () => {
        throw new Error("create should not run");
      },
    },
  });
  const recordService = require("../src/services/record.service");
  await assert.rejects(
    () => recordService.createRecord(sampleCreateInput),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /inactive/i);
      return true;
    }
  );
});

test("record.service updateRecord rejects reassigning to inactive user", async (t) => {
  t.after(teardownPrismaServiceMocks);
  setPrismaMock({
    record: {
      findFirst: async () => ({ id: 1 }),
      update: async () => {
        throw new Error("update should not run");
      },
    },
    user: { findUnique: async () => ({ id: 2, isActive: false }) },
  });
  const recordService = require("../src/services/record.service");
  await assert.rejects(
    () => recordService.updateRecord(1, { userId: 2 }),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /inactive/i);
      return true;
    }
  );
});

test("user.service createUserByAdmin rejects duplicate email", async (t) => {
  t.after(teardownPrismaServiceMocks);
  setPrismaMock({
    user: {
      findUnique: async () => ({ id: 1, email: "taken@demo.local" }),
      create: async () => {
        throw new Error("create should not run");
      },
    },
  });
  const userService = require("../src/services/user.service");
  await assert.rejects(
    () =>
      userService.createUserByAdmin({
        name: "Dup",
        email: "taken@demo.local",
        password: "LongEnoughPass1",
        role: "VIEWER",
        isActive: true,
      }),
    (err) => {
      assert.ok(err instanceof AppError);
      assert.equal(err.statusCode, 409);
      assert.match(err.message, /already registered/i);
      return true;
    }
  );
});
