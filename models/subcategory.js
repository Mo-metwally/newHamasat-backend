'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const setImageURLs = require('../utils/imageUrlHelper');
const { validateUUID, checkIfExists } = require('../utils/validations');
const { setSlug, generateName } = require('../utils/generateSlug');

module.exports = (sequelize, DataTypes) => {
  class SubCategory extends Model {
    static associate(models) {
      SubCategory.belongsTo(models.Category, {
        foreignKey: 'categoryId',
        as: 'category',
      });
      SubCategory.belongsTo(models.User, {
        foreignKey: 'vendorId',
        as: 'vendor',
      });
      SubCategory.hasMany(models.Product, {
        foreignKey: 'subcategoryId',
        as: 'products',
      });
    }
  }

  SubCategory.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        allowNull: false,
        primaryKey: true,
        validate: {
          isValidUUID(value) {
            validateUUID(value, 'SubCategory ID');
          },
        },
      },
      name_en: DataTypes.STRING,
      name_ar: DataTypes.STRING,
      slug: {
        type: DataTypes.STRING,
        unique: true,
      },
      image: DataTypes.STRING,
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          isValidUUID(value) {
            validateUUID(value, 'Category ID');
          },
        },
      },
      vendorId: {
        type: DataTypes.UUID,
        allowNull: true,
        validate: {
          isValidUUID(value) {
            if (value) validateUUID(value, 'Vendor ID');
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'SubCategory',
      hooks: {
        beforeCreate: async (subcategory) => {
          setSlug(subcategory, 'name_en', 'name_ar'); // Generate slug
          generateName(subcategory);
          const options = { folder: 'subcategories', imageFields: ['image'] };
          setImageURLs(subcategory, options);
          await validateAssociations(subcategory);
        },
        beforeUpdate: async (subcategory) => {
          setSlug(subcategory, 'name_en', 'name_ar'); // Update slug if necessary
          generateName(subcategory);
          const options = { folder: 'subcategories', imageFields: ['image'] };
          setImageURLs(subcategory, options);
          await validateAssociations(subcategory);
        },
        afterFind: (subcategories) => {
          const options = { folder: 'subcategories', imageFields: ['image'] };
          if (Array.isArray(subcategories)) {
            subcategories.forEach((subcategory) =>
              setImageURLs(subcategory, options)
            );
          } else if (subcategories) {
            setImageURLs(subcategories, options);
          }
        },
      },
    }
  );

  // Utility functions
  const validateAssociations = async (subcategory) => {
    const { Category } = sequelize.models;
    await checkIfExists(Category, subcategory.categoryId, 'Category');
  };

  return SubCategory;
};
