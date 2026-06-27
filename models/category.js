'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const setImageURLs = require('../utils/imageUrlHelper');
const { setSlug, generateName } = require('../utils/generateSlug');
const { validateUUID } = require('../utils/validations');

module.exports = (sequelize, DataTypes) => {
  class Category extends Model {
    static associate(models) {
      Category.hasMany(models.Product, {
        foreignKey: 'categoryId',
        as: 'products',
      });
      Category.hasMany(models.SubCategory, {
        foreignKey: 'categoryId',
        as: 'subCategories',
      });
    }
  }

  Category.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        allowNull: false,
        primaryKey: true,
        validate: {
          isValidUUID(value) {
            validateUUID(value, 'Category ID');
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
    },
    {
      sequelize,
      modelName: 'Category',
      hooks: {
        beforeCreate: (category) => {
          setSlug(category, 'name_en', 'name_ar'); // Generate slug
          generateName(category);
          const options = { folder: 'categories', imageFields: ['image'] };
          setImageURLs(category, options);
        },
        beforeUpdate: (category) => {
          setSlug(category, 'name_en', 'name_ar'); // Update slug if necessary
          generateName(category);
          const options = { folder: 'categories', imageFields: ['image'] };
          setImageURLs(category, options);
        },
        afterFind: (categories) => {
          const options = { folder: 'categories', imageFields: ['image'] };
          if (Array.isArray(categories)) {
            categories.forEach((category) => setImageURLs(category, options));
          } else if (categories) {
            setImageURLs(categories, options);
          }
        },
      },
    }
  );

  return Category;
};
