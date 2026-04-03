const { ZodError } = require("zod");
const AppError = require("../utils/AppError");

function prismaCode(err) {
  return err && err.code;
}

module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return res.status(400).json({
      error: {
        message: "Validation failed",
        details,
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message },
    });
  }

  if (prismaCode(err) === "P2002") {
    return res.status(409).json({
      error: { message: "A record with that unique value already exists" },
    });
  }

  if (prismaCode(err) === "P2025") {
    return res.status(404).json({
      error: { message: "Resource not found" },
    });
  }

  console.error(err);
  return res.status(500).json({
    error: { message: "Unexpected server error" },
  });
};
