const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const AppError = require("../utils/AppError");

const JWT_SECRET = process.env.JWT_SECRET;

// get token
function getBearerToken(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

async function protect(req, res, next) {
  try {
    if (!JWT_SECRET) {
      throw new AppError("JWT_SECRET is not configured on the server", 500);
    }
    const token = getBearerToken(req);
    if (!token) {
      throw new AppError("Authentication required", 401);
    }
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId < 1) {
      throw new AppError("Invalid or expired token", 401);
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, isActive: true },  
    });
    if (!user) {
      throw new AppError("User no longer exists", 401);
    }
    if (!user.isActive) {
      throw new AppError("Account is inactive", 403);
    }
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
}

module.exports = { protect, restrictTo };
