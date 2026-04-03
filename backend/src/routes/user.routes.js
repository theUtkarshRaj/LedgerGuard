const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/", restrictTo("ADMIN"), userController.list);
router.post("/", restrictTo("ADMIN"), userController.create);
router.get("/:id", restrictTo("ADMIN"), userController.getOne);
router.patch("/:id", restrictTo("ADMIN"), userController.update);

module.exports = router;
