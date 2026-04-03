const { z } = require("zod");

const roleEnum = z.enum(["VIEWER", "ANALYST", "ADMIN"]);

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  role: roleEnum.default("VIEWER"),
  isActive: z.boolean().optional().default(true),
});

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(255).optional(),
    password: z.string().min(8).max(128).optional(),
    role: roleEnum.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "At least one field must be provided",
  });

const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(20).optional().default(20),
  role: roleEnum.optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  q: z.string().trim().max(200).optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
};
