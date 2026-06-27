"use strict";
const { Model } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const setImageURLs = require("../utils/imageUrlHelper");
const { checkIfExists, validateUUID } = require("../utils/validations");
const { setSlug, generateName } = require("../utils/generateSlug");

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Category, {
        foreignKey: "categoryId",
        as: "category",
        onDelete: "CASCADE",
      });
      Product.belongsTo(models.SubCategory, {
        foreignKey: "subcategoryId",
        as: "subCategory",
        onDelete: "CASCADE",
      });
      Product.belongsTo(models.Brand, {
        foreignKey: "brandId",
        as: "brand",
        onDelete: "CASCADE",
      });
      Product.belongsToMany(models.Cart, {
        through: models.CartProducts,
        foreignKey: "productId",
        as: "carts",
      });
      Product.belongsToMany(models.Order, {
        through: models.OrderProducts,
        foreignKey: "productId",
        as: "orders",
      });
      Product.belongsTo(models.Product, {
        foreignKey: "parentId",
        as: "parent",
      });
      Product.hasMany(models.Product, {
        foreignKey: "parentId",
        as: "children",
      });
      Product.belongsTo(models.User, {
        foreignKey: "vendorId",
        as: "vendor",
        onDelete: "SET NULL",
      });
    }
  }

  Product.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        allowNull: false,
        primaryKey: true,
        validate: { isValidUUID: (value) => validateUUID(value, "Product ID") },
      },
      name_en: DataTypes.STRING,
      name_ar: DataTypes.STRING,
      model_en: DataTypes.STRING,
      model_ar: DataTypes.STRING,
      slug: { type: DataTypes.STRING, unique: true },

      price: {
        // price of product for customer
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isNonNegative(value) {
            if (value < 0) throw new Error("Price cannot be negative");
          },
        },
      },
      basePrice: {
        // orginal price of product on vendor
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          isNonNegative(value) {
            if (value < 0) throw new Error("Base price cannot be negative");
          },
        },
      },
      salePrice: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        validate: {
          isNonNegative(value) {
            if (value < 0) throw new Error("Sale price cannot be negative");
          },
        },
      },
      discount: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },

      sold: { type: DataTypes.INTEGER, defaultValue: 0 },
      stock: { type: DataTypes.INTEGER, defaultValue: 0 },

      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Products",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      remaining: {
        type: DataTypes.VIRTUAL,
        get() {
          return Math.max((this.stock || 0) - (this.sold || 0), 0);
        },
      },

      keywords: DataTypes.ARRAY(DataTypes.STRING),
      color_en: DataTypes.ARRAY(DataTypes.STRING),
      color_ar: DataTypes.ARRAY(DataTypes.STRING),
      size_en: DataTypes.ARRAY(DataTypes.STRING),
      size_ar: DataTypes.ARRAY(DataTypes.STRING),
      description_en: DataTypes.TEXT,
      description_ar: DataTypes.TEXT,
      images: DataTypes.ARRAY(DataTypes.STRING),
      image: DataTypes.STRING,

      newExpireDate: { type: DataTypes.DATE, allowNull: true },
      saleExpireDate: { type: DataTypes.DATE, allowNull: true },

      categoryId: DataTypes.UUID,
      subcategoryId: DataTypes.UUID,
      brandId: DataTypes.UUID,
      vendorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "SET NULL",
      },

      // SALE STATUS
      isSale: {
        type: DataTypes.VIRTUAL,
        get() {
          const salePrice = parseFloat(this.salePrice || 0);
          if (!salePrice || salePrice <= 0) return false;
          if (!this.saleExpireDate) return true;
          return Date.now() <= new Date(this.saleExpireDate).getTime();
        },
      },

      // NEW STATUS
      isNew: {
        type: DataTypes.VIRTUAL,
        get() {
          return !!(
            this.newExpireDate &&
            Date.now() <= new Date(this.newExpireDate).getTime()
          );
        },
      },
    },
    {
      sequelize,
      modelName: "Product",
      indexes: [
        { fields: ["slug"] },
        { fields: ["categoryId"] },
        { fields: ["saleExpireDate"] },
        { fields: ["newExpireDate"] },
        { fields: ["parentId"] },
      ],
      hooks: {
        beforeCreate: prepareProduct,
        beforeUpdate: prepareProduct,

        beforeBulkCreate: async (products) => {
          await prepareProductsBatch(products);
        },
        beforeBulkUpdate: async (options) => {
          if (options.attributes) {
            await prepareProductsBatch([options.attributes]);
          }
        },

        afterFind: (result) => {
          if (!result) return;
          const now = Date.now();
          const options = {
            folder: "products",
            imageFields: ["image", "images"],
          };
          const products = Array.isArray(result) ? result : [result];

          products.forEach((p) => {
            const expire = p.saleExpireDate ? p.saleExpireDate.getTime() : null;
            if (expire && now > expire) {
              p.salePrice = 0;
              p.discount = 0;
            }
            setImageURLs(p, options);
          });
        },
      },
    }
  );

  async function prepareProduct(product) {
    setImageURLs(product, {
      folder: "products",
      imageFields: ["image", "images"],
    });
    setSlug(product, "name_en", "name_ar");
    generateName(product);
    calculateDiscount(product);
    await validateAssociations(product);
  }

  async function prepareProductsBatch(products) {
    const { Category, SubCategory, Brand } = sequelize.models;
    const categoryIds = new Set();
    const subcategoryIds = new Set();
    const brandIds = new Set();

    products.forEach((product) => {
      setImageURLs(product, {
        folder: "products",
        imageFields: ["image", "images"],
      });
      setSlug(product, "name_en", "name_ar");
      generateName(product);
      calculateDiscount(product);
      if (product.categoryId) categoryIds.add(product.categoryId);
      if (product.subcategoryId) subcategoryIds.add(product.subcategoryId);
      if (product.brandId) brandIds.add(product.brandId);
    });

    await Promise.all([
      ...[...categoryIds].map((id) => checkIfExists(Category, id, "Category")),
      ...[...subcategoryIds].map((id) =>
        checkIfExists(SubCategory, id, "SubCategory")
      ),
      ...[...brandIds].map((id) => checkIfExists(Brand, id, "Brand")),
    ]);
  }

  async function validateAssociations(product) {
    const { Category, SubCategory, Brand } = sequelize.models;
    await Promise.all([
      checkIfExists(Category, product.categoryId, "Category"),
      checkIfExists(SubCategory, product.subcategoryId, "SubCategory"),
      checkIfExists(Brand, product.brandId, "Brand"),
    ]);
  }

  function calculateDiscount(product) {
    const price = parseFloat(product.price || 0);
    const salePrice = parseFloat(product.salePrice || 0);

    if (salePrice > 0 && salePrice < price) {
      product.discount = parseFloat(
        (((price - salePrice) / price) * 100).toFixed(2)
      );
    } else {
      product.discount = 0;
    }
  }

  return Product;
};
