const { SubCategory } = require('../models');
const {
  createOne,
  deleteOne,
  getAll,
  updateOne,
  getOne,
} = require('../utils/handlersFactory');

const subCategoryImageConfig = [
  { field: 'image', isMultiple: false, basePath: 'uploads/subcategories' },
];

exports.createSubCategory = createOne(SubCategory, 'name');

exports.deleteSubCategory = deleteOne(SubCategory, subCategoryImageConfig);

exports.getAllSubCategories = getAll(SubCategory);

exports.getSubCategory = getOne(SubCategory);

exports.updateSubCategory = updateOne(SubCategory, 'name', subCategoryImageConfig);
