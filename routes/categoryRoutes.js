const express = require("express");
const categoryController = require("../controllers/categoryController");
const {
  uploadCategoryImage,
  resizeImageCategory,
} = require("../services/imagesService");
const authService = require("../services/authService");

const router = express.Router();

// Product Routes
router
  .route("/")
  .get(categoryController.getAllCategories)
  .post(
    authService.protect,
    authService.allowedTo("superAdmin"),
    uploadCategoryImage,
    resizeImageCategory,
    categoryController.createCategory
  );
router
  .route("/:id")
  .get(categoryController.getCategory)
  .put(
    authService.protect,
    authService.allowedTo("superAdmin"),
    uploadCategoryImage,
    resizeImageCategory,
    categoryController.updateCategory
  )
  .delete(
    authService.protect,
    authService.allowedTo("superAdmin"),
    categoryController.deleteCategory
  );

module.exports = router;
