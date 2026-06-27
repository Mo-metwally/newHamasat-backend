const express = require("express");
const userController = require("../controllers/userController");
const authService = require("../services/authService");

const router = express.Router();

// Public routes
router.get("/vendor/:id", userController.getVendorProfile);

router.use(authService.protect);

router.put("/updateMe", userController.updateMe);

// Allow only superAdmin for now as requested
router.use(authService.allowedTo("superAdmin"));

router.get("/", userController.getAllUsers);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
