const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

// except password return rest of the User data
function publicUser(user) {
  if (!user) return null;
  const { password: _p, ...rest } = user;
  return rest;
}

async function registerUser(input) {
  //check same email id exists ?
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) {
    throw new AppError("Email is already registered", 409);
  }

  //User is Unique , default role viewer, only admin can assign role
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: passwordHash,
      role: "VIEWER",
    },
  });

  //return data except password
  return publicUser(user);
}

// login required email and password
async function loginUser({ email, password }) {
  //fetch user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }
  //inactive user
  if (!user.isActive) {
    throw new AppError("Account is inactive", 403);
  }
  //password matching
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError("Invalid email or password", 401);
  }

  // jwt for token creation
  if (!JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured on the server", 500);
  }
  const token = jwt.sign(
    { sub: String(user.id) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
  return { token, user: publicUser(user) };
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  return publicUser(user);
}

module.exports = { registerUser, loginUser, getUserById, publicUser };
