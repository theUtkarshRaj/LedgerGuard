const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

function userSelectPublic() {
  return {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  };
}

async function listUsers(query) {
  const { page, limit, role, isActive, q } = query;
  const where = {};
  if (role) where.role = role;
  if (typeof isActive === "boolean") where.isActive = isActive;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelectPublic(),
      orderBy: { id: "asc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function createUserByAdmin(input) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AppError("Email is already registered", 409);
  }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: passwordHash,
      role: input.role,
      isActive: input.isActive,
    },
    select: userSelectPublic(),
  });
  return user;
}

async function getUserByIdForAdmin(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: userSelectPublic(),
  });
  if (!user) throw new AppError("User not found", 404);
  return user;
}

async function updateUserByAdmin(id, patch, { actorUserId }) {
  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) throw new AppError("User not found", 404);

  if (
    actorUserId === id &&
    current.role === "ADMIN" &&
    patch.role !== undefined &&
    patch.role !== "ADMIN"
  ) {
    throw new AppError("Admins cannot remove their own admin role", 403);
  }

  const roleAfter = patch.role !== undefined ? patch.role : current.role;
  const activeAfter =
    patch.isActive !== undefined ? patch.isActive : current.isActive;
  const wasActiveAdmin = current.role === "ADMIN" && current.isActive;
  const willBeActiveAdmin = roleAfter === "ADMIN" && activeAfter;

  if (wasActiveAdmin && !willBeActiveAdmin) {
    const otherActiveAdmins = await prisma.user.count({
      where: {
        role: "ADMIN",
        isActive: true,
        id: { not: id },
      },
    });
    if (otherActiveAdmins < 1) {
      throw new AppError("Cannot remove the last active administrator", 403);
    }
  }

  const data = { ...patch };
  if (patch.password) {
    data.password = await bcrypt.hash(patch.password, 12);
  }
  if (patch.email) {
    const clash = await prisma.user.findFirst({
      where: { email: patch.email, NOT: { id } },
    });
    if (clash) throw new AppError("Email is already in use", 409);
  }
  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelectPublic(),
    });
    return user;
  } catch (e) {
    if (e.code === "P2025") throw new AppError("User not found", 404);
    throw e;
  }
}

module.exports = {
  listUsers,
  createUserByAdmin,
  getUserByIdForAdmin,
  updateUserByAdmin,
};
