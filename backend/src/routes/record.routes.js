const express = require("express");
const router = express.Router();
const recordController = require("../controllers/record.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/", restrictTo("ADMIN", "ANALYST"), recordController.list);
router.post("/", restrictTo("ADMIN"), recordController.create);
router.patch("/:id", restrictTo("ADMIN"), recordController.update);
router.delete("/:id", restrictTo("ADMIN"), recordController.remove);

module.exports = router;
