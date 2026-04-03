const asyncHandler = require("../utils/asyncHandler");
const { registerSchema, loginSchema } = require("../validators/auth.validator");
const authService = require("../services/auth.service");

exports.register = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const user = await authService.registerUser(body);
  res.status(201).json({ data: user });
});

exports.login = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const result = await authService.loginUser(body);
  res.json({ data: result });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  res.json({ data: user });
});
