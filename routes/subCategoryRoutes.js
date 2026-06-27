const express = require('express');
const subCategoryController = require('../controllers/subCategoryController');
const {
  uploadSubCategoryImage,
  resizeSubCategoryImage,
} = require('../services/imagesService');

const authService = require('../services/authService');
const router = express.Router();

// Product Routes
router
  .route('/')
  .get(subCategoryController.getAllSubCategories)
  .post(
    authService.protect,
    authService.allowedTo("superAdmin", "admin", "vendor"),
    uploadSubCategoryImage,
    resizeSubCategoryImage,
    subCategoryController.createSubCategory
  );
router
  .route('/:id')
  .get(subCategoryController.getSubCategory)
  .put(
    authService.protect,
    authService.allowedTo("superAdmin", "admin", "vendor"),
    uploadSubCategoryImage,
    resizeSubCategoryImage,
    subCategoryController.updateSubCategory
  )
  .delete(authService.protect, authService.allowedTo("superAdmin", "admin", "vendor"), subCategoryController.deleteSubCategory);

module.exports = router;
