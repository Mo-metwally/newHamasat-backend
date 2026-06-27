const express = require('express');
const OrderController = require('../controllers/orderController');

const authService = require('../services/authService');

const router = express.Router();

router.post('/order-now', OrderController.orderNow);
router.get('/order/:id', OrderController.getOrder);
router.get('/guest/orders', OrderController.getAllOrdersForGuest);
router.get(
  '/',
  authService.protect,
  authService.allowedTo("superAdmin", 'admin', 'manager'),
  OrderController.getAllOrders
);
router.get('/order/:orderId/invoice', OrderController.getOrderInvoice);
router.get('/order/code/:code', OrderController.inquireOrderByCode);

router.post(
  '/send-vendor-email',
  authService.protect,
  authService.allowedTo("superAdmin", "admin", "manager"),
  OrderController.sendVendorEmail
);

// Order modification routes
router.post(
  '/:orderId/products',
  authService.protect,
  authService.allowedTo("superAdmin", "admin", "manager"),
  OrderController.addProductToOrder
);

router.put(
  '/:orderId/products/:productId',
  authService.protect,
  authService.allowedTo("superAdmin", "admin", "manager"),
  OrderController.updateOrderProduct
);

router.delete(
  '/:orderId/products/:productId',
  authService.protect,
  authService.allowedTo("superAdmin", "admin", "manager"),
  OrderController.removeProductFromOrder
);

module.exports = router;
