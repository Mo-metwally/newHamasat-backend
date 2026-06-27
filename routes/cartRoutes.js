const express = require('express');
const CartController = require('../controllers/cartController');
const router = express.Router();

// Get or create a cart for a guest
router.get('/cart', CartController.getOrCreateCart);

// Add a product to the guest's cart
router.post('/cart/add-product', CartController.addProductToCart);

// Remove a product from the guest's cart
router.delete('/cart/remove-product', CartController.removeProductFromCart);

// Clear all products from the guest's cart
router.delete('/cart/clear-cart', CartController.clearCart);

// Create an order from the guest's cart
router.post('/create-order', CartController.createOrderFromCart);

router.patch("/cart/increase-quantity", CartController.increaseProductQuantity);

router.patch("/cart/decrease-quantity", CartController.decreaseProductQuantity);

module.exports = router;
