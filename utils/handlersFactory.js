const asyncHandler = require("express-async-handler");
const ApiError = require("./apiError");
const ApiResponse = require("./apiResponse");
const ApiFeatures = require("./apiFeatures");
const { Op } = require("sequelize");
const checkUniqueField = require("../utils/uniqueCheck");
const unlinkFiles = require("./unlinkFiles");
const extractImagePaths = require("./extractImagePaths");
const { invalidateKey } = require("./cacheInvalidate");

async function getAncestors(modelId, Model, transaction) {
  const ancestors = [];
  let currentId = modelId;
  while (currentId) {
    const current = await Model.findByPk(currentId, {
      attributes: ["parentId"],
      transaction,
    });
    if (!current || !current.parentId) break;
    ancestors.push(current.parentId);
    currentId = current.parentId;
  }
  return ancestors;
}

exports.deleteOne = (Model, config) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const transaction = await Model.sequelize.transaction();

    try {
      const record = await Model.findByPk(id, { transaction });
      if (!record) {
        await transaction.rollback();
        return next(new ApiError(`No record found for this id ${id}`, 404));
      }

      let ancestors = [];
      if (Model.name === "Product" || Model.name === "SubCategory") {
        if (req.user && req.user.role === 'admin' && record.vendorId !== req.user.id) {
          await transaction.rollback();
          return next(new ApiError(`You are not allowed to delete this ${Model.name.toLowerCase()}`, 403));
        }
        if (Model.name === "Product") {
          ancestors = await getAncestors(id, Model, transaction);
        }
      }

      const imagePaths = extractImagePaths(record, config);
      await unlinkFiles(imagePaths);

      await Model.destroy({ where: { id }, transaction });

      if (Model.name === "Product") {
        await invalidateKey(`products:product:${id}`);
        for (const ancId of ancestors) {
          await invalidateKey(`products:product:${ancId}`);
        }
        await invalidateKey("products:product:list*");
        await invalidateKey("products:product-all:list*");
      }

      await transaction.commit();
      res
        .status(200)
        .json(new ApiResponse(`${Model.name} deleted successfully`));
    } catch (err) {
      await transaction.rollback();
      return next(err);
    }
  });

exports.updateOne = (Model, uniqueField, config) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const transaction = await Model.sequelize.transaction();

    try {
      await checkUniqueField(Model, uniqueField, req.body, id);

      const record = await Model.findByPk(id, { transaction });
      if (!record) {
        await transaction.rollback();
        return next(new ApiError(`No record found for this id ${id}`, 404));
      }

      let oldAncestors = [];
      if (Model.name === "Product" || Model.name === "SubCategory") {
        if (req.user && req.user.role === 'admin' && record.vendorId !== req.user.id) {
          await transaction.rollback();
          return next(new ApiError(`You are not allowed to update this ${Model.name.toLowerCase()}`, 403));
        }
        if (Model.name === "Product") {
          oldAncestors = await getAncestors(id, Model, transaction);
        }
      }

      const oldImagePaths = extractImagePaths(record, config);
      await record.update(req.body, { transaction });

      const newImagePaths = extractImagePaths(req.body, config);
      if (newImagePaths.length > 0) {
        await unlinkFiles(oldImagePaths);
      }

      if (Model.name === "Product") {
        const newAncestors = await getAncestors(id, Model, transaction);
        const ancestorsToInvalidate = [
          ...new Set([...oldAncestors, ...newAncestors]),
        ];
        await invalidateKey(`products:product:${id}`);
        for (const ancId of ancestorsToInvalidate) {
          await invalidateKey(`products:product:${ancId}`);
        }
        await invalidateKey("products:product:list*");
        await invalidateKey("products:product-all:list*");
      }

      await transaction.commit();
      res
        .status(200)
        .json(new ApiResponse(`${Model.name} updated successfully`, record));
    } catch (err) {
      await transaction.rollback();
      return next(err);
    }
  });

exports.createOne = (Model, uniqueField) =>
  asyncHandler(async (req, res, next) => {
    const transaction = await Model.sequelize.transaction();

    try {
      await checkUniqueField(Model, uniqueField, req.body);

      if ((Model.name === "Product" || Model.name === "SubCategory") && req.user) {
        if (req.user.role === 'admin') {
          req.body.vendorId = req.user.id;
        } else if (req.user.role === 'superAdmin' && !req.body.vendorId) {
          req.body.vendorId = req.user.id;
        }
      }

      const newRecord = await Model.create(req.body, { transaction });

      if (Model.name === "Product") {
        const ancestors = await getAncestors(newRecord.id, Model, transaction);
        for (const ancId of ancestors) {
          await invalidateKey(`products:product:${ancId}`);
        }
        await invalidateKey("products:product:list*");
        await invalidateKey("products:product-all:list*");
      }

      await transaction.commit();
      res
        .status(201)
        .json(new ApiResponse(`${Model.name} created successfully`, newRecord));
    } catch (err) {
      await transaction.rollback();
      return next(err);
    }
  });

exports.getOne = (Model, associatedModels = []) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const apiFeatures = new ApiFeatures(Model, req.query);

    const mainAttributes = apiFeatures.languageFields().queryOptions.attributes;
    const include = associatedModels.map((assoc) => ({
      ...assoc,
      attributes: new ApiFeatures(assoc.model, req.query).languageFields()
        .queryOptions.attributes,
    }));

    if (Model.name === "Product") {
      include.push({
        model: Model,
        as: "children",
        attributes: mainAttributes,
        include: [
          {
            model: Model,
            as: "children",
            attributes: mainAttributes,
          },
        ],
      });

      if (!req.query.adminView || req.query.adminView !== 'true') {
        include.push({
          model: Model.sequelize.models.User,
          as: 'vendor',
          attributes: ['id', 'name', 'email', 'phone', 'businessField', 'productDescription', 'isActive'],
          required: false
        });
      }
    }

    const queryOptions = {
      where: { id },
      attributes: mainAttributes,
      include,
    };

    if (Model.name === "Product" && (!req.query.adminView || req.query.adminView !== 'true')) {
      queryOptions.where = {
        id,
        [Op.or]: [
          { vendorId: null },
          { '$vendor.isActive$': true }
        ]
      };
    }

    const record = await Model.findOne(queryOptions);

    if (!record) {
      return next(new ApiError(`No record found for this id ${id}`, 404));
    }

    res
      .status(200)
      .json(new ApiResponse(`${Model.name} retrieved successfully`, record));
  });

exports.getAll = (Model) =>
  asyncHandler(async (req, res) => {
    const apiFeatures = new ApiFeatures(Model, req.query)
      .filter()
      .search()
      .sort()
      .limitFields()
      .languageFields();

    if (Model.name === "Product" || Model.name === "SubCategory") {
      apiFeatures.queryOptions.include = apiFeatures.queryOptions.include || [];
      apiFeatures.queryOptions.include.push({
        model: Model.sequelize.models.User,
        as: 'vendor',
        attributes: ['id', 'name'],
        required: false
      });
    }

    if (Model.name === "Product") {
      apiFeatures.queryOptions.where = apiFeatures.queryOptions.where || {};
      apiFeatures.queryOptions.where.parentId = null;

      if (req.user && req.user.role === "admin" && req.query.adminView === 'true') {
        apiFeatures.queryOptions.where.vendorId = req.user.id;
      } else if (!req.query.adminView || req.query.adminView !== 'true') {
        apiFeatures.queryOptions.where = {
          ...apiFeatures.queryOptions.where,
          [Op.or]: [
            { vendorId: null },
            { '$vendor.isActive$': true }
          ]
        };
      }
    }

    await apiFeatures.paginate();
    const records = await apiFeatures.query();

    res.status(200).json(
      new ApiResponse(`${Model.name}s retrieved successfully`, {
        results: records.length,
        pagination: apiFeatures.paginationResult,
        data: records,
      })
    );
  });

exports.findAll = (Model) =>
  asyncHandler(async (req, res) => {
    const apiFeatures = new ApiFeatures(Model, req.query)
      .filter()
      .search()
      .sort()
      .limitFields()
      .languageFields();

    if (Model.name === "Product" || Model.name === "SubCategory") {
      apiFeatures.queryOptions.include = apiFeatures.queryOptions.include || [];
      apiFeatures.queryOptions.include.push({
        model: Model.sequelize.models.User,
        as: 'vendor',
        attributes: ['id', 'name'],
        required: false
      });
    }

    if (Model.name === "Product") {
      apiFeatures.queryOptions.where = apiFeatures.queryOptions.where || {};

      if (req.user && req.user.role === "admin" && req.query.adminView === 'true') {
        apiFeatures.queryOptions.where.vendorId = req.user.id;
      } else if (!req.query.adminView || req.query.adminView !== 'true') {
        apiFeatures.queryOptions.where = {
          ...apiFeatures.queryOptions.where,
          [Op.or]: [
            { vendorId: null },
            { '$vendor.isActive$': true }
          ]
        };
      }
    }

    await apiFeatures.paginate();
    const records = await apiFeatures.query();

    res.status(200).json(
      new ApiResponse(`${Model.name}s retrieved successfully`, {
        results: records.length,
        pagination: apiFeatures.paginationResult,
        data: records,
      })
    );
  });
