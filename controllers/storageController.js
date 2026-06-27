const { Product, Order, Storage, sequelize } = require("../models");
const asyncHandler = require("express-async-handler");
const { Op } = require("sequelize");

const STORAGE_ID = "analysis-storage";

const safeParseFloat = (val) => {
  if (val === null || val === undefined) return 0;
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
};
const safeParseInt = (val) => {
  if (val === null || val === undefined) return 0;
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : 0;
};

const normalizeResults = (results) => ({
  totalProducts: safeParseInt(results.totalProducts),
  totalOrders: safeParseInt(results.totalOrders),
  totalProductsPrice: safeParseFloat(results.totalProductsPrice),
  totalProductsBasePrice: safeParseFloat(results.totalProductsBasePrice),
  totalSalePriceProducts: safeParseFloat(results.totalSalePriceProducts),
  totalStockProducts: safeParseInt(results.totalStockProducts),
  totalSoldProducts: safeParseInt(results.totalSoldProducts),
  totalIsNewProducts: safeParseInt(results.totalIsNewProducts),
  totalIsSaleProducts: safeParseInt(results.totalIsSaleProducts),
  totalOrdersPending: safeParseInt(results.totalOrdersPending),
  totalOrdersProcessed: safeParseInt(results.totalOrdersProcessed),
  totalOrdersShipped: safeParseInt(results.totalOrdersShipped),
  totalOrdersDelivered: safeParseInt(results.totalOrdersDelivered),
  totalOrdersCanceled: safeParseInt(results.totalOrdersCanceled),
  totalOrdersReturned: safeParseInt(results.totalOrdersReturned),
  totalOrdersRevenue: safeParseFloat(results.totalOrdersRevenue),
  totalProfit: safeParseFloat(results.totalProfit),
});

const calculateStorageMetrics = async (user, filters = {}) => {
  const { vendorId, startDate, endDate } = filters;
  const now = new Date();

  let productWhere = {};
  let orderInclude = [];
  let orderWhere = {};

  // Date filtering for Orders
  if (startDate || endDate) {
    orderWhere.createdAt = {};
    if (startDate) orderWhere.createdAt[Op.gte] = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      orderWhere.createdAt[Op.lte] = end;
    }
  }

  let targetVendorId = null;
  if (user && user.role === 'admin') {
    targetVendorId = user.id;
  } else if (user && user.role === 'superAdmin' && vendorId) {
    targetVendorId = vendorId;
  }

  if (targetVendorId) {
    productWhere.vendorId = targetVendorId;
    orderInclude = [{
      model: Product,
      as: 'products',
      where: { vendorId: targetVendorId },
      required: true,
      attributes: [] 
    }];
  }

  const vendorClause = targetVendorId ? `WHERE "vendorId" = '${targetVendorId}'` : '';
  const vendorClauseAnd = targetVendorId ? `AND p."vendorId" = '${targetVendorId}'` : '';

  let dateClause = '';
  if (startDate || endDate) {
    const conditions = [];
    if (startDate) conditions.push(`"Order"."createdAt" >= '${new Date(startDate).toISOString()}'`);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(`"Order"."createdAt" <= '${end.toISOString()}'`);
    }
    dateClause = `AND ${conditions.join(' AND ')}`;
  }

  const isDateFiltered = !!(startDate || endDate);

  const queries = {
    totalProducts: Product.count({ where: productWhere }),
    totalOrders: Order.count({ where: orderWhere, include: orderInclude, distinct: true }),

    totalProductsPrice: sequelize
      .query(
        `SELECT COALESCE(SUM("price" * "stock"), 0) AS total FROM "Products" ${vendorClause};`,
        { type: sequelize.QueryTypes.SELECT }
      )
      .then((res) => res[0].total),

    totalProductsBasePrice: sequelize
      .query(
        `SELECT COALESCE(SUM("basePrice" * "stock"), 0) AS total FROM "Products" ${vendorClause};`,
        { type: sequelize.QueryTypes.SELECT }
      )
      .then((res) => res[0].total),

    totalSalePriceProducts: sequelize
      .query(
        `SELECT COALESCE(SUM("salePrice" * "stock"), 0) AS total FROM "Products" ${vendorClause};`,
        { type: sequelize.QueryTypes.SELECT }
      )
      .then((res) => res[0].total),

    totalStockProducts: Product.sum("stock", { where: productWhere }),
    
    totalSoldProducts: isDateFiltered ? 
      sequelize.query(
        `SELECT COALESCE(SUM(op."quantity"), 0) AS total 
         FROM "OrderProducts" op 
         JOIN "Orders" "Order" ON op."orderId" = "Order"."id" 
         JOIN "Products" p ON op."productId" = p."id" 
         WHERE "Order"."status" NOT IN ('canceled', 'returned') ${dateClause} ${vendorClauseAnd};`,
        { type: sequelize.QueryTypes.SELECT }
      ).then(res => res[0].total)
      : Product.sum("sold", { where: productWhere }),

    totalProfit: isDateFiltered ? 
      sequelize.query(
        `SELECT COALESCE(SUM((op."unitPrice" - COALESCE(p."basePrice", 0)) * op."quantity"), 0) AS profit
         FROM "OrderProducts" op
         JOIN "Orders" "Order" ON op."orderId" = "Order"."id"
         JOIN "Products" p ON op."productId" = p."id"
         WHERE "Order"."status" NOT IN ('canceled', 'returned') ${dateClause} ${vendorClauseAnd};`,
        { type: sequelize.QueryTypes.SELECT }
      ).then(res => res[0].profit)
      : sequelize.query(
        `SELECT COALESCE(SUM( ((CASE WHEN "salePrice" > 0 THEN "salePrice" ELSE "price" END) - "basePrice") * "sold" ), 0) AS profit
         FROM "Products" ${vendorClause};`,
        { type: sequelize.QueryTypes.SELECT }
      ).then((res) => res[0].profit),

    totalOrdersPending: Order.count({ where: { ...orderWhere, status: "pending" }, include: orderInclude, distinct: true }),
    totalOrdersProcessed: Order.count({ where: { ...orderWhere, status: "processed" }, include: orderInclude, distinct: true }),
    totalOrdersShipped: Order.count({ where: { ...orderWhere, status: "shipped" }, include: orderInclude, distinct: true }),
    totalOrdersDelivered: Order.count({ where: { ...orderWhere, status: "delivered" }, include: orderInclude, distinct: true }),
    totalOrdersCanceled: Order.count({ where: { ...orderWhere, status: "canceled" }, include: orderInclude, distinct: true }),
    totalOrdersReturned: Order.count({ where: { ...orderWhere, status: "returned" }, include: orderInclude, distinct: true }),

    totalOrdersRevenue: sequelize
      .query(
        `SELECT COALESCE(SUM(op."total"), 0) AS total
         FROM "OrderProducts" op
         JOIN "Orders" "Order" ON op."orderId" = "Order"."id"
         JOIN "Products" p ON op."productId" = p."id"
         WHERE "Order"."status" NOT IN ('canceled', 'returned')
         ${dateClause}
         ${vendorClauseAnd};`,
        { type: sequelize.QueryTypes.SELECT }
      )
      .then((res) => res[0].total),

    totalIsNewProducts: Product.count({
      where: { ...productWhere, newExpireDate: { [Op.gt]: now } },
    }),
    totalIsSaleProducts: Product.count({
      where: {
        ...productWhere,
        salePrice: { [Op.gt]: 0 },
        [Op.or]: [
          { saleExpireDate: null },
          { saleExpireDate: { [Op.gt]: now } },
        ],
      },
    }),
  };

  const values = await Promise.all(Object.values(queries));
  const results = Object.fromEntries(
    Object.keys(queries).map((k, i) => [k, values[i]])
  );

  const normalized = normalizeResults(results);

  return {
    ...normalized,
    totalRemainingProducts: Math.max(
      normalized.totalStockProducts - normalized.totalSoldProducts,
      0
    ),
  };
};

/**
 * POST /api/v1/storage/analyze
 * Perform analysis and store/update Storage table
 */
exports.performAnalysis = asyncHandler(async (req, res) => {
  const { vendorId, startDate, endDate } = req.body || {};
  const isFiltered = !!(vendorId || startDate || endDate);

  const metrics = await calculateStorageMetrics(req.user, { vendorId, startDate, endDate });

  if (!isFiltered) {
    const storageId = req.user && req.user.role === 'admin' ? `${STORAGE_ID}-${req.user.id}` : STORAGE_ID;

    const [storage, created] = await Storage.findOrCreate({
      where: { id: storageId },
      defaults: { id: storageId, ...metrics },
    });

    if (!created) {
      await storage.update(metrics);
    }

    return res.status(200).json({
      success: true,
      message: "Analysis completed and storage updated successfully.",
      data: metrics,
    });
  }

  // If filtered, just return the data without saving to DB
  res.status(200).json({
    success: true,
    message: "Analysis completed with filters.",
    data: metrics,
  });
});

/**
 * GET /api/v1/storage
 * Retrieve analysis
 */
exports.getStorageAnalysis = asyncHandler(async (req, res) => {
  const storageId = req.user && req.user.role === 'admin' ? `${STORAGE_ID}-${req.user.id}` : STORAGE_ID;
  const storage = await Storage.findByPk(storageId);

  if (!storage) {
    return res.status(404).json({
      success: false,
      message: "No analysis data found.",
    });
  }

  res.status(200).json({
    success: true,
    data: storage,
  });
});
