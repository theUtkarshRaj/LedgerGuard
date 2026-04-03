const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/", dashboardController.dashboardMain);
router.get("/overview", dashboardController.overview);
router.get("/summary", dashboardController.summary);
router.get("/categories", dashboardController.categories);
router.get("/recent", dashboardController.recent);
router.get("/trends", dashboardController.trends);

module.exports = router;
