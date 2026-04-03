/* eslint-disable no-console */
require("dotenv").config();
const bcrypt = require("bcrypt");
const { Prisma } = require("@prisma/client");
const prisma = require("../src/config/prisma");

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe!123", 12);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.local" },
    update: { password: passwordHash, isActive: true, role: "ADMIN" },
    create: {
      name: "Utkarsh Admin",
      email: "admin@demo.local",
      password: passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@demo.local" },
    update: { password: passwordHash, isActive: true, role: "ANALYST" },
    create: {
      name: "Riya Analyst",
      email: "analyst@demo.local",
      password: passwordHash,
      role: "ANALYST",
      isActive: true,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@demo.local" },
    update: { password: passwordHash, isActive: true, role: "VIEWER" },
    create: {
      name: "Vik Viewer",
      email: "viewer@demo.local",
      password: passwordHash,
      role: "VIEWER",
      isActive: true,
    },
  });

  // Clear previous records
  await prisma.record.deleteMany();

  // Records
  const records = [
    // April 2026 - Income
    {
      userId: admin.id,
      amount: new Prisma.Decimal("5000.00"),
      type: "INCOME",
      category: "Salary",
      date: new Date("2026-04-03"),
      note: "Monthly salary",
    },
    {
      userId: analyst.id,
      amount: new Prisma.Decimal("1200.00"),
      type: "INCOME",
      category: "Consulting",
      date: new Date("2026-04-10"),
      note: "Client project",
    },

    // April 2026 - Expenses
    {
      userId: admin.id,
      amount: new Prisma.Decimal("1200.00"),
      type: "EXPENSE",
      category: "Rent",
      date: new Date("2026-04-01"),
    },
    {
      userId: admin.id,
      amount: new Prisma.Decimal("450.00"),
      type: "EXPENSE",
      category: "Food",
      date: new Date("2026-04-05"),
    },
    {
      userId: analyst.id,
      amount: new Prisma.Decimal("200.00"),
      type: "EXPENSE",
      category: "Travel",
      date: new Date("2026-04-09"),
    },
    {
      userId: analyst.id,
      amount: new Prisma.Decimal("150.00"),
      type: "EXPENSE",
      category: "Utilities",
      date: new Date("2026-04-12"),
    },
    {
      userId: admin.id,
      amount: new Prisma.Decimal("300.00"),
      type: "EXPENSE",
      category: "Shopping",
      date: new Date("2026-04-15"),
    },

    // March 2026 - Income
    {
      userId: admin.id,
      amount: new Prisma.Decimal("4800.00"),
      type: "INCOME",
      category: "Salary",
      date: new Date("2026-03-03"),
    },
    {
      userId: analyst.id,
      amount: new Prisma.Decimal("900.00"),
      type: "INCOME",
      category: "Freelance",
      date: new Date("2026-03-12"),
    },

    // March 2026 - Expenses
    {
      userId: admin.id,
      amount: new Prisma.Decimal("1100.00"),
      type: "EXPENSE",
      category: "Rent",
      date: new Date("2026-03-01"),
    },
    {
      userId: admin.id,
      amount: new Prisma.Decimal("400.00"),
      type: "EXPENSE",
      category: "Food",
      date: new Date("2026-03-06"),
    },
    {
      userId: analyst.id,
      amount: new Prisma.Decimal("180.00"),
      type: "EXPENSE",
      category: "Travel",
      date: new Date("2026-03-09"),
    },
  ];

  await prisma.record.createMany({ data: records });

  console.log("Seed complete.");
  console.log("Demo credentials (password for all users): ChangeMe!123");
  console.log("admin@demo.local   (ADMIN)");
  console.log("analyst@demo.local (ANALYST)");
  console.log("viewer@demo.local  (VIEWER)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });