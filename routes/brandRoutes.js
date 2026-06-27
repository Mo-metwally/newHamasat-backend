const express = require('express');
const brandController = require('../controllers/brandController');
const {
  uploadBrandImage,
  resizeBrandImage,
} = require('../services/imagesService');
const authService = require('../services/authService');

const router = express.Router();

// Product Routes
router
  .route('/')
  .get(brandController.getAllBrands)
  .post(
    authService.protect,
    authService.allowedTo("superAdmin"),
    uploadBrandImage,
    resizeBrandImage,
    brandController.createBrand
  );
router
  .route('/:id')
  .get(brandController.getBrand)
  .put(
    authService.protect,
    authService.allowedTo("superAdmin"),
    uploadBrandImage,
    resizeBrandImage,
    brandController.updateBrand
  )
  .delete(authService.protect, authService.allowedTo("superAdmin"), brandController.deleteBrand);

module.exports = router;
