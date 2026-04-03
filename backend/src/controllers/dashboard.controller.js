const asyncHandler = require("../utils/asyncHandler");
const {
  dashboardQuerySchema,
  recentQuerySchema,
  trendsQuerySchema,
} = require("../validators/dashboard.validator");
const dashboardService = require("../services/dashboard.service");

exports.dashboardMain = asyncHandler(async (req, res) => {
  const query = recentQuerySchema.parse(req.query);
  const { limit, ...range } = query;
  const includeOwner = req.user.role !== "VIEWER";
  
  // Combine all dashboard data plus the currently authenticated user
  const data = await dashboardService.overview(range, limit, includeOwner);
  res.json({ data: { ...data, user: req.user } });
});

exports.overview = asyncHandler(async (req, res) => {
  const query = recentQuerySchema.parse(req.query);
  const { limit, ...range } = query;
  const includeOwner = req.user.role !== "VIEWER";
  const data = await dashboardService.overview(range, limit, includeOwner);
  res.json({ data });
});

exports.summary = asyncHandler(async (req, res) => {
  const range = dashboardQuerySchema.parse(req.query);
  const data = await dashboardService.summary(range);
  res.json({ data });
});

exports.categories = asyncHandler(async (req, res) => {
  const range = dashboardQuerySchema.parse(req.query);
  const data = await dashboardService.categoryBreakdown(range);
  res.json({ data });
});

exports.recent = asyncHandler(async (req, res) => {
  const query = recentQuerySchema.parse(req.query);
  const { limit, ...range } = query;
  const includeOwner = req.user.role !== "VIEWER";
  const data = await dashboardService.recentActivity(range, limit, includeOwner);
  res.json({ data });
});

exports.trends = asyncHandler(async (req, res) => {
  const query = trendsQuerySchema.parse(req.query);
  const { granularity, ...range } = query;
  const data = await dashboardService.trends(range, granularity);
  res.json({ data });
});
