const express = require("express");
const productController = require("../controllers/productController");
const {
  uploadProductImages,
  resizeProductImages,
} = require("../services/imagesService");
const authService = require("../services/authService");
const { cacheMiddlewar } = require("../middleware/cacheMiddleware");

const router = express.Router();

router.get(
  "/",
  authService.checkAuth,
  cacheMiddlewar(
    (req) => `product:list:${JSON.stringify(req.query)}:${req.user ? req.user.id : 'anon'}`,
    120,
    "products"
  ),
  productController.getAllProducts
);

router.get(
  "/get-all",
  authService.checkAuth,
  cacheMiddlewar(
    (req) => `product-all:list:${JSON.stringify(req.query)}:${req.user ? req.user.id : 'anon'}`,
    120,
    "products"
  ),
  productController.getFindAllProducts
);

router.get(
  "/:id",
  cacheMiddlewar((req) => `product:${req.params.id}`, 120, "products"),
  productController.getProduct
);

router.post(
  "/",
  authService.protect,
  authService.allowedTo("superAdmin", "admin", "manager"),
  uploadProductImages,
  resizeProductImages,
  productController.createProduct
);

router.put(
  "/:id",
  authService.protect,
  authService.allowedTo("superAdmin", "admin", "manager"),
  uploadProductImages,
  resizeProductImages,
  productController.updateProduct
);

router.delete(
  "/:id",
  authService.protect,
  authService.allowedTo("superAdmin", "admin"),
  productController.deleteProduct
);

module.exports = router;
