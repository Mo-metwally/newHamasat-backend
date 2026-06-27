const { Order, Product, OrderProducts } = require("../models");
const ApiError = require("../utils/apiError");
const asyncHandler = require("express-async-handler");
const { sendEmail } = require("../utils/sendEmail");
const { updateStatusEmailTemplate } = require("../templates/updateStatusEmail");
const { adminSendEmailTemplate } = require("../templates/adminSendEmail");
const { invoiceEmailTemplate } = require("../templates/invoiceEmail");

const STATUS_MESSAGES = {
  pending: "تم استلام طلبك بنجاح. سيتم التواصل معك في أقرب وقت لتأكيد الطلب.",
  processed: "طلبك قيد التنفيذ حاليًا. يقوم فريقنا بتجهيز المنتجات بعناية للتأكد من وصولها إليك في أفضل حال.",
  shipped: "تم شحن طلبك. سيتم التواصل معك من قبل مكتب التوصيل في أقرب وقت.",
  delivered: "تم توصيل طلبك بنجاح. نتمنى أن ينال رضاك، ولا تتردد في التواصل معنا إذا كان لديك أي ملاحظات أو استفسارات.",
  canceled: ".نعتذر، لقد تم إلغاء طلبك. برجاء التواصل معنا في حالة وجود مشكلة",
  returned:
    ".نود إعلامك بأنه قد تم استلام طلبك المرتجع. نأسف على ذلك ونعدك بأن هذه المشكلة لن تتكرر مرة أخرى",
};

const generateOrderStatusMessage = (status) =>
  STATUS_MESSAGES[status.toLowerCase()] ||
  ".طلبك قيد المراجعة، نحن حريصون على تلبية طلبك بأقرب وقت";

const rollbackSoldAndStockForProducts = async (orderId) => {
  const orderProducts = await OrderProducts.findAll({ where: { orderId } });

  for (const orderProduct of orderProducts) {
    const product = await Product.findByPk(orderProduct.productId);

    if (product) {
      product.remaining = (product.remaining || 0) + orderProduct.quantity;

      product.sold = Math.max((product.sold || 0) - orderProduct.quantity, 0);

      await product.save();
    }
  }
};

const updateOrderStatusAndNotify = asyncHandler(
  async (req, res, next, status) => {
    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) {
      return next(new ApiError("Order not found", 404));
    }

    const previousStatus = order.status;

    order.status = status;

    const message = generateOrderStatusMessage(status);
    order.message = message;

    await order.save();

    if (["canceled", "returned"].includes(status.toLowerCase())) {
      await rollbackSoldAndStockForProducts(order.id, previousStatus);
    }

    const emailContent = updateStatusEmailTemplate(order.username, message);
    await sendEmail(order.email, "تحديث حالة الطلب - همسات هوم", emailContent);

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status} and email notification sent.`,
      data: { order },
    });
  }
);

// Controller for updating to 'pending' status and notifying
exports.updateOrderStatusToPendingNotify = asyncHandler((req, res, next) => {
  return updateOrderStatusAndNotify(req, res, next, "pending");
});

// Controller for updating to 'processed' status and notifying
exports.updateOrderStatusToProcessedNotify = asyncHandler((req, res, next) => {
  return updateOrderStatusAndNotify(req, res, next, "processed");
});

// Controller for updating to 'shipped' status and notifying
exports.updateOrderStatusToShippedNotify = asyncHandler((req, res, next) => {
  return updateOrderStatusAndNotify(req, res, next, "shipped");
});

// Controller for updating to 'delivered' status and notifying
exports.updateOrderStatusToDeliveredNotify = asyncHandler((req, res, next) => {
  return updateOrderStatusAndNotify(req, res, next, "delivered");
});

// Controller for updating to 'canceled' status
exports.updateOrderStatusToCanceledNotify = asyncHandler((req, res, next) => {
  return updateOrderStatusAndNotify(req, res, next, "canceled");
});

// Controller for updating to 'returned' status
exports.updateOrderStatusToReturnedNotify = asyncHandler((req, res, next) => {
  return updateOrderStatusAndNotify(req, res, next, "returned");
});

// Function to send admin email
exports.sendAdminEmail = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { body } = req.body;

  // Find the order by ID
  const order = await Order.findByPk(id);

  if (!order) {
    return next(new ApiError("Order not found", 404));
  }

  // Update the adminMessage with the provided body
  order.adminMessage = body;

  await order.save(); // Make sure to await saving the order

  // Generate the email content using the template
  const emailContent = adminSendEmailTemplate(order.username, body);

  try {
    // Send email to the order email
    await sendEmail(order.email, "تحديث حالة الطلب - همسات هوم", emailContent);

    res.status(200).json({
      success: true,
      message: "Admin email sent successfully.",
    });
  } catch (error) {
    next(new ApiError("Failed to send email", 500));
  }
});

// Helper function to update admin notes
const updateAdminNote = asyncHandler(async (req, res, next, noteType) => {
  const { id } = req.params;
  const noteValue = req.body[noteType];

  try {
    const order = await Order.findByPk(id);

    if (!order) {
      return next(new ApiError("Order not found", 404));
    }

    // Update the specified admin note
    order[noteType] = noteValue || order[noteType];
    await order.save();

    res.status(200).json({
      success: true,
      message: `${noteType} updated successfully.`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add or update admin note one for an order
// @route   PUT /api/v1/orders/:id/admin-note-one
// @access  Admin (or adjust based on access control)
exports.addAdminNoteOne = asyncHandler((req, res, next) => {
  return updateAdminNote(req, res, next, "adminNoteOne");
});

// @desc    Add or update admin note two for an order
// @route   PUT /api/v1/orders/:id/admin-note-two
// @access  Admin (or adjust based on access control)
exports.addAdminNoteTwo = asyncHandler((req, res, next) => {
  return updateAdminNote(req, res, next, "adminNoteTwo");
});

// @desc    Send invoice email
// @route   POST /api/v1/orders/:id/invoice-email
// @access  Admin (or automated after payment)
exports.sendInvoiceEmail = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findByPk(id);

  if (!order) {
    return next(new ApiError("Order not found", 404));
  }

  // Example invoice URL (can be PDF generation route, frontend route, etc.)
  const invoiceUrl = `https://norhomecare.com/invoice/${order.id}`;

  // Generate email content
  const emailContent = invoiceEmailTemplate(order.username, invoiceUrl);

  try {
    await sendEmail(order.email, "فاتورتك جاهزة", emailContent);

    res.status(200).json({
      success: true,
      message: "Invoice email sent successfully.",
      invoiceUrl,
    });
  } catch (error) {
    next(new ApiError("Failed to send invoice email", 500));
  }
});
