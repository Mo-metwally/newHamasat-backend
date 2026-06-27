const { Category } = require('../models');
const {
  createOne,
  deleteOne,
  getAll,
  updateOne,
  getOne,
} = require('../utils/handlersFactory');

const categoryImageConfig = [
  { field: 'image', isMultiple: false, basePath: 'uploads/categories' },
];

exports.createCategory = createOne(Category, 'name');

exports.deleteCategory = deleteOne(Category, categoryImageConfig);

exports.getAllCategories = getAll(Category);

exports.getCategory = getOne(Category);

exports.updateCategory = updateOne(Category, 'name', categoryImageConfig);
