"use strict";

const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

jest.mock("../../src/config/prisma", () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
}));

const app = require("../../src/app");
const prisma = require("../../src/config/prisma");

describe("Auth API (integration)", () => {
  describe("POST /api/auth/register", () => {
    it("creates a user and returns public fields (happy path)", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "register@example.com",
        password: "$2b$12$hashed",
        role: "VIEWER",
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "register@example.com",
        password: "validpass1",
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        id: 1,
        name: "Test User",
        email: "register@example.com",
        role: "VIEWER",
      });
      expect(res.body.data).not.toHaveProperty("password");
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns a JWT and user on valid credentials", async () => {
      const passwordHash = await bcrypt.hash("correcthorse1", 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 2,
        name: "Login User",
        email: "login@example.com",
        password: passwordHash,
        role: "VIEWER",
        isActive: true,
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "login@example.com",
        password: "correcthorse1",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toEqual(expect.any(String));
      expect(res.body.data.user).toMatchObject({
        email: "login@example.com",
        role: "VIEWER",
      });
      expect(res.body.data.user).not.toHaveProperty("password");

      const decoded = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
      expect(decoded.sub).toBe("2");
    });
  });

  describe("GET /api/auth/me (protected)", () => {
    it("returns 401 without a token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.error.message).toMatch(/authentication required/i);
    });

    it("returns the current user with a valid Bearer token", async () => {
      const token = jwt.sign({ sub: "42" }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      prisma.user.findUnique.mockResolvedValue({
        id: 42,
        email: "protected@example.com",
        name: "Protected",
        role: "ANALYST",
        isActive: true,
        password: "stored-hash",
      });

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: 42,
        email: "protected@example.com",
        role: "ANALYST",
      });
      expect(res.body.data).not.toHaveProperty("password");
    });
  });
});
