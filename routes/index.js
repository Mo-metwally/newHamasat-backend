const express = require('express');

// Import your route files
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const subCategoryRoutes = require('./subCategoryRoutes');
const orderRoutes = require('./orderRoutes');
const cartRoutes = require('./cartRoutes');
const brandRoutes = require('./brandRoutes');
const adminRoutes = require('./adminRoutes');
const storageRoutes = require('./storageRoutes');
const albumRoutes = require('./albumRoutes');
const vendorRoutes = require('./vendorRoutes');

const searchRoutes = require('./searchRoute');

function mountRoutes(app) {
  const apiRouter = express.Router();
  // Mount your routes
  apiRouter.use('/products', productRoutes);
  apiRouter.use('/categories', categoryRoutes);
  apiRouter.use('/subcategories', subCategoryRoutes);
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/orders', orderRoutes);
  apiRouter.use('/carts', cartRoutes);
  apiRouter.use('/brands', brandRoutes);
  apiRouter.use('/admin', adminRoutes);
  apiRouter.use('/storage', storageRoutes);
  apiRouter.use('/albums', albumRoutes);
  apiRouter.use('/admin/vendors', vendorRoutes);
  apiRouter.use('/users', require('./userRoutes'));
  apiRouter.use('/search', searchRoutes);
  // Add other routes

  // Mount the apiRouter to the /api/v1 prefix
  app.use('/api/v1', apiRouter);
}

module.exports = mountRoutes;
