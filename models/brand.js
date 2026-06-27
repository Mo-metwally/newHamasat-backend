'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const setImageURLs = require('../utils/imageUrlHelper');
const { setSlug, generateName } = require('../utils/generateSlug');
const { validateUUID } = require('../utils/validations');

module.exports = (sequelize, DataTypes) => {
  class Brand extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Brand.hasMany(models.Product, { foreignKey: 'brandId', as: 'products' });
    }
  }
  Brand.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        allowNull: false,
        primaryKey: true,
        validate: {
          isValidUUID(value) {
            validateUUID(value, 'Brand ID');
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
      modelName: 'Brand',
      hooks: {
        beforeCreate: (brand) => {
          setSlug(brand, 'name_en', 'name_ar');
          generateName(brand);
          const options = { folder: 'brands', imageFields: ['image'] };
          setImageURLs(brand, options);
        },
        beforeUpdate: (brand) => {
          setSlug(brand, 'name_en', 'name_ar');
          generateName(brand);
          const options = { folder: 'brands', imageFields: ['image'] };
          setImageURLs(brand, options);
        },
        afterFind: (brands) => {
          const options = { folder: 'brands', imageFields: ['image'] };
          if (Array.isArray(brands)) {
            brands.forEach((brand) => setImageURLs(brand, options));
          } else if (brands) {
            setImageURLs(brands, options);
          }
        },
      },
    }
  );

  return Brand;
};
