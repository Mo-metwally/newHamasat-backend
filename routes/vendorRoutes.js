const express = require("express");
const vendorController = require("../controllers/vendorController");
const authService = require("../services/authService");

const router = express.Router();

router.use(authService.protect);
router.use(authService.allowedTo("superAdmin")); // Only superAdmin can manage vendors

router
  .route("/")
  .get(vendorController.getAllVendors);

router
  .route("/:id")
  .put(vendorController.updateVendor)
  .delete(vendorController.deleteVendor);

module.exports = router;
