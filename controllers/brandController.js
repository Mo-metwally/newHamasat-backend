const { Brand, Product } = require("../models");
const {
  createOne,
  deleteOne,
  getAll,
  updateOne,
  getOne,
} = require("../utils/handlersFactory");

const brandImageConfig = [
  { field: "image", isMultiple: false, basePath: "uploads/brands" },
];

exports.createBrand = createOne(Brand, "name");

exports.deleteBrand = deleteOne(Brand, brandImageConfig);

exports.getAllBrands = getAll(Brand);

exports.getBrand = getOne(Brand, [
  {
    model: Product,
    as: "products",
  },
]);

exports.updateBrand = updateOne(Brand, "name", brandImageConfig);
