const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

function toDecimal(value) {
  return new Prisma.Decimal(typeof value === "number" ? value.toFixed(2) : value);
}

function buildListWhere(query) {
  const where = { isDeleted: false };
  if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = query.from;
    if (query.to) where.date.lte = query.to;
  }
  if (query.category) where.category = query.category;
  if (query.type) where.type = query.type;
  if (query.q) {
    where.OR = [
      { note: { contains: query.q, mode: "insensitive" } },
      { category: { contains: query.q, mode: "insensitive" } },
    ];
  }
  return where;
}

const recordSelect = {
  id: true,
  userId: true,
  amount: true,
  type: true,
  category: true,
  date: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true } },
};

async function listRecords(query) {
  const { page, limit } = query;
  const where = buildListWhere(query);
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.record.findMany({
      where,
      select: recordSelect,
      orderBy: [{ date: "desc" }, { id: "desc" }],
      skip,
      take: limit,
    }),
    prisma.record.count({ where }),
  ]);
  const serialized = items.map((r) => ({
    ...r,
    amount: r.amount.toString(),
  }));
  return {
    items: serialized,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function createRecord(input) {
  const owner = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!owner) throw new AppError("Owner user does not exist", 400);
  if (!owner.isActive) throw new AppError("Cannot attach records to an inactive user", 400);

  const record = await prisma.record.create({
    data: {
      userId: input.userId,
      amount: toDecimal(input.amount),
      type: input.type,
      category: input.category,
      date: input.date,
      note: input.note || null,
    },
    select: recordSelect,
  });
  return { ...record, amount: record.amount.toString() };
}

async function updateRecord(id, patch) {
  const existing = await prisma.record.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });
  if (!existing) throw new AppError("Record not found", 404);

  const data = {};
  if (patch.amount !== undefined) data.amount = toDecimal(patch.amount);
  if (patch.type !== undefined) data.type = patch.type;
  if (patch.category !== undefined) data.category = patch.category;
  if (patch.date !== undefined) data.date = patch.date;
  if (patch.note !== undefined) data.note = patch.note === "" ? null : patch.note;
  if (patch.userId !== undefined) {
    const owner = await prisma.user.findUnique({ where: { id: patch.userId } });
    if (!owner) throw new AppError("Owner user does not exist", 400);
    if (!owner.isActive) throw new AppError("Cannot attach records to an inactive user", 400);
    data.userId = patch.userId;
  }

  const record = await prisma.record.update({
    where: { id },
    data,
    select: recordSelect,
  });
  return { ...record, amount: record.amount.toString() };
}

async function softDeleteRecord(id) {
  const existing = await prisma.record.findFirst({
    where: { id, isDeleted: false },
    select: { id: true },
  });
  if (!existing) throw new AppError("Record not found", 404);

  await prisma.record.update({
    where: { id },
    data: { isDeleted: true },
    select: { id: true },
  });
}

module.exports = { listRecords, createRecord, updateRecord, softDeleteRecord };
