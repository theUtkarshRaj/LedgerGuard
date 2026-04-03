const { z } = require("zod");

const typeEnum = z.enum(["INCOME", "EXPENSE"]);

/** Owner id: JSON number or string (avoids NaN from z.coerce on "" / bad input). */
const userIdField = z.union([
  z.number().int().positive(),
  z
    .string()
    .trim()
    .regex(/^\d+$/, "Must be the numeric id of an existing user (e.g. 1)")
    .transform((s) => parseInt(s, 10))
    .pipe(z.number().int().positive()),
]);

const money = z.union([
  z.number().positive(),
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive decimal with up to 2 places"),
]);

const createRecordSchema = z.object({
  userId: userIdField.optional(),
  amount: money,
  type: typeEnum,
  category: z.string().trim().min(1).max(80),
  date: z.coerce.date(),
  note: z.string().trim().max(2000).optional(),
});

const updateRecordSchema = z
  .object({
    amount: money.optional(),
    type: typeEnum.optional(),
    category: z.string().trim().min(1).max(80).optional(),
    date: z.coerce.date().optional(),
    note: z.union([z.string().trim().max(2000), z.literal("")]).optional(),
    userId: userIdField.optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "At least one field must be provided",
  });

const listRecordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(20).optional().default(20),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  category: z.string().trim().max(80).optional(),
  type: typeEnum.optional(),
  q: z.string().trim().max(200).optional(),
});

module.exports = {
  createRecordSchema,
  updateRecordSchema,
  listRecordsQuerySchema,
};
