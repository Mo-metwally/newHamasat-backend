const { Product } = require("../models");
const {
  createOne,
  deleteOne,
  getAll,
  updateOne,
  getOne,
  findAll,
} = require("../utils/handlersFactory");
const asyncHandler = require("express-async-handler");
const ApiResponse = require("../utils/apiResponse");

const productImageConfig = [
  { field: "image", isMultiple: false, basePath: "uploads/products" },
  { field: "images", isMultiple: true, basePath: "uploads/products" },
];

exports.createProduct = createOne(Product, "name");

exports.deleteProduct = deleteOne(Product, productImageConfig);

exports.getAllProducts = getAll(Product);

exports.getFindAllProducts = findAll(Product);

exports.getProduct = getOne(Product);

exports.updateProduct = updateOne(Product, "name", productImageConfig);
