const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
} = require("../validators/user.validator");
const userService = require("../services/user.service");

function parseId(param) {
  const id = Number(param);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError("Invalid user id", 400);
  }
  return id;
}

exports.list = asyncHandler(async (req, res) => {
  const query = listUsersQuerySchema.parse(req.query);
  const result = await userService.listUsers(query);
  res.json({ data: result.items, meta: result.meta });
});

exports.create = asyncHandler(async (req, res) => {
  const body = createUserSchema.parse(req.body);
  const user = await userService.createUserByAdmin(body);
  res.status(201).json({ data: user });
});

exports.getOne = asyncHandler(async (req, res) => {
  const user = await userService.getUserByIdForAdmin(parseId(req.params.id));
  res.json({ data: user });
});

exports.update = asyncHandler(async (req, res) => {
  const body = updateUserSchema.parse(req.body);
  const user = await userService.updateUserByAdmin(parseId(req.params.id), body, {
    actorUserId: req.user.id,
  });
  res.json({ data: user });
});
