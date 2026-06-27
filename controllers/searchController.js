const { Product, Category, SubCategory, User } = require('../models');
const { Op } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('express-async-handler');
const { catchError } = require('../middleware/catchErrorMiddleware');
const setImageURLs = require('../utils/imageUrlHelper');

exports.globalSearch = catchError(
  asyncHandler(async (req, res, next) => {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(200).json(new ApiResponse('Search results', {
        categories: [],
        vendors: [],
        products: []
      }));
    }

    const words = q.trim().split(/\s+/);
    
    // Helper to build AND condition for all words
    const buildSearchCondition = (fields) => {
      return {
        [Op.and]: words.map(word => ({
          [Op.or]: fields.map(field => ({
            [field]: { [Op.iLike]: `%${word}%` }
          }))
        }))
      };
    };

    // 1. Search Categories
    const categories = await Category.findAll({
      where: buildSearchCondition(['name_ar', 'name_en']),
      limit: 5,
      attributes: ['id', 'name_ar', 'name_en', 'image']
    });
    categories.forEach(cat => setImageURLs(cat, { folder: 'categories', imageFields: ['image'] }));

    // 2. Search SubCategories
    const subCategories = await SubCategory.findAll({
      where: buildSearchCondition(['name_ar', 'name_en']),
      limit: 5,
      attributes: ['id', 'name_ar', 'name_en', 'image', 'categoryId']
    });
    subCategories.forEach(sub => setImageURLs(sub, { folder: 'subcategories', imageFields: ['image'] }));

    // 3. Search Vendors (Users with role vendor or admin)
    const vendors = await User.findAll({
      where: {
        ...buildSearchCondition(['name']),
        role: { [Op.in]: ['vendor', 'admin'] } 
      },
      limit: 5,
      attributes: ['id', 'name']
    });

    // 4. Search Products (by name or description)
    const products = await Product.findAll({
      where: buildSearchCondition(['name_ar', 'name_en', 'description_ar', 'description_en']),
      limit: 10,
      attributes: ['id', 'name_ar', 'name_en', 'image', 'categoryId', 'subcategoryId', 'price', 'salePrice', 'discount', 'stock'],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name_ar', 'name_en'] }
      ]
    });
    // Products image URLs are usually handled by hooks, but just to be safe:
    products.forEach(p => setImageURLs(p, { folder: 'products', imageFields: ['image'] }));

    res.status(200).json(new ApiResponse('Search results fetched successfully', {
      categories,
      subCategories,
      vendors,
      products
    }));
  })
);
