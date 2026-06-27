const express = require("express");
const {
  sendAdminEmail,
  updateOrderStatusToCanceledNotify,
  updateOrderStatusToDeliveredNotify,
  updateOrderStatusToPendingNotify,
  updateOrderStatusToProcessedNotify,
  updateOrderStatusToShippedNotify,
  updateOrderStatusToReturnedNotify,
  addAdminNoteOne,
  addAdminNoteTwo,
  sendInvoiceEmail,
} = require("../controllers/adminController");
const authService = require("../services/authService");

const router = express.Router();

router.use(authService.protect);
router.use(authService.allowedTo("superAdmin", "admin", "manager"));

router.post("/order/:id/send-email", sendAdminEmail);
router.patch(
  "/update-order/:id/status/canceled",
  updateOrderStatusToCanceledNotify
);
router.patch(
  "/update-order/:id/status/returned",
  updateOrderStatusToReturnedNotify
);
router.patch(
  "/update-order/:id/status/pending",
  updateOrderStatusToPendingNotify
);
router.patch(
  "/update-order/:id/status/processed",
  updateOrderStatusToProcessedNotify
);
router.patch(
  "/update-order/:id/status/shipped",
  updateOrderStatusToShippedNotify
);
router.patch(
  "/update-order/:id/status/delivered",
  updateOrderStatusToDeliveredNotify
);
router.put("/order/:id/admin-note-one", addAdminNoteOne);
router.put("/order/:id/admin-note-two", addAdminNoteTwo);
router.post("order/:id/invoice-email", sendInvoiceEmail);

module.exports = router;
