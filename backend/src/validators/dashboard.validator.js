const { z } = require("zod");

const dashboardQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const recentQuerySchema = dashboardQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

const trendsQuerySchema = dashboardQuerySchema.extend({
  granularity: z.enum(["month", "week"]).optional().default("month"),
});

module.exports = {
  dashboardQuerySchema,
  recentQuerySchema,
  trendsQuerySchema,
};
