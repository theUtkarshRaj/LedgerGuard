const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const {
  createRecordSchema,
  updateRecordSchema,
  listRecordsQuerySchema,
} = require("../validators/record.validator");
const recordService = require("../services/record.service");

function parseId(param) {
  const id = Number(param);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError("Invalid record id", 400);
  }
  return id;
}

exports.list = asyncHandler(async (req, res) => {
  const query = listRecordsQuerySchema.parse(req.query);
  const result = await recordService.listRecords(query);
  res.json({ data: result.items, meta: result.meta });
});

exports.create = asyncHandler(async (req, res) => {
  const body = createRecordSchema.parse(req.body);

  let ownerId;
  if (req.user.role === "ADMIN") {
    if (
      body.userId !== undefined &&
      body.userId !== null &&
      (!Number.isInteger(body.userId) || body.userId < 1)
    ) {
      throw new AppError("userId must be a positive integer when provided", 400);
    }
    ownerId =
      body.userId !== undefined && body.userId !== null ? body.userId : req.user.id;
  } else {
    ownerId = req.user.id;
  }

  const record = await recordService.createRecord({ ...body, userId: ownerId });
  res.status(201).json({ data: record });
});

exports.update = asyncHandler(async (req, res) => {
  const body = updateRecordSchema.parse(req.body);
  const record = await recordService.updateRecord(parseId(req.params.id), body);
  res.json({ data: record });
});

exports.remove = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id);
  await recordService.softDeleteRecord(id);
  res.status(200).json({
    data: {
      id,
      message: "Record deleted successfully",
    },
  });
});
