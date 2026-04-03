const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");

function dateRangeWhere(from, to) {
  const w = {};
  if (from || to) {
    w.date = {};
    if (from) w.date.gte = from;
    if (to) w.date.lte = to;
  }
  return w;
}

async function summary(range) {
  const base = { isDeleted: false, ...dateRangeWhere(range.from, range.to) };
  const [income, expense] = await Promise.all([
    prisma.record.aggregate({
      where: { ...base, type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.record.aggregate({
      where: { ...base, type: "EXPENSE" },
      _sum: { amount: true },
    }),
  ]);
  const totalIncome = income._sum.amount ?? new Prisma.Decimal(0);
  const totalExpense = expense._sum.amount ?? new Prisma.Decimal(0);
  const net = totalIncome.minus(totalExpense);
  return {
    totalIncome: totalIncome.toString(),
    totalExpense: totalExpense.toString(),
    netBalance: net.toString(),
    range: { from: range.from ?? null, to: range.to ?? null },
  };
}

async function categoryBreakdown(range) {
  const base = { isDeleted: false, ...dateRangeWhere(range.from, range.to) };
  const rows = await prisma.record.groupBy({
    by: ["category", "type"],
    where: base,
    _sum: { amount: true },
    orderBy: { category: "asc" },
  });

  const byCategory = new Map();
  for (const row of rows) {
    const cur = byCategory.get(row.category) || {
      category: row.category,
      income: new Prisma.Decimal(0),
      expense: new Prisma.Decimal(0),
    };
    const sum = row._sum.amount ?? new Prisma.Decimal(0);
    if (row.type === "INCOME") cur.income = cur.income.plus(sum);
    else cur.expense = cur.expense.plus(sum);
    byCategory.set(row.category, cur);
  }

  return [...byCategory.values()].map((c) => ({
    category: c.category,
    income: c.income.toString(),
    expense: c.expense.toString(),
    net: c.income.minus(c.expense).toString(),
  }));
}

async function recentActivity(range, limit, includeOwner) {
  const base = { isDeleted: false, ...dateRangeWhere(range.from, range.to) };
  const select = {
    id: true,
    amount: true,
    type: true,
    category: true,
    date: true,
    note: true,
  };
  if (includeOwner) {
    select.user = { select: { id: true, name: true } };
  }
  const rows = await prisma.record.findMany({
    where: base,
    select,
    orderBy: [{ date: "desc" }, { id: "desc" }],
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    amount: r.amount.toString(),
    type: r.type,
    category: r.category,
    date: r.date,
    note: r.note,
    recordedBy: includeOwner && r.user ? r.user.name : undefined,
  }));
}

async function trends(range, granularity) {
  const parts = [Prisma.sql`"isDeleted" = false`];
  if (range.from) parts.push(Prisma.sql`"date" >= ${range.from}`);
  if (range.to) parts.push(Prisma.sql`"date" <= ${range.to}`);
  const whereSql = Prisma.join(parts, Prisma.sql` AND `);

  // Using raw SQL because Prisma groupBy does not support date_trunc.
  const rows =
    granularity === "week"
      ? await prisma.$queryRaw`
          SELECT
            to_char(date_trunc('week', "date"), 'YYYY-MM-DD') AS period,
            "type"::text AS "type",
            SUM("amount") AS total
          FROM "Record"
          WHERE ${whereSql}
          GROUP BY 1, 2
          ORDER BY 1 ASC
        `
      : await prisma.$queryRaw`
          SELECT
            to_char(date_trunc('month', "date"), 'YYYY-MM') AS period,
            "type"::text AS "type",
            SUM("amount") AS total
          FROM "Record"
          WHERE ${whereSql}
          GROUP BY 1, 2
          ORDER BY 1 ASC
        `;

  return rows.map((r) => {
    let total = "0.00";
    if (r.total != null) {
      try {
        total = new Prisma.Decimal(String(r.total)).toFixed(2);
      } catch {
        total = "0.00";
      }
    }
    return { period: r.period, type: r.type, total };
  });
}

async function overview(range, recentLimit, includeOwner) {
  const [summaryData, categories, recent] = await Promise.all([
    summary(range),
    categoryBreakdown(range),
    recentActivity(range, recentLimit, includeOwner),
  ]);
  return { summary: summaryData, categories, recent };
}

module.exports = {
  summary,
  categoryBreakdown,
  recentActivity,
  trends,
  overview,
};
