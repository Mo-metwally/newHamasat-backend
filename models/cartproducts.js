'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { validateUUID } = require('../utils/validations');

module.exports = (sequelize, DataTypes) => {
  class CartProducts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CartProducts.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        allowNull: false,
        primaryKey: true,
        validate: {
          isValidUUID(value) {
            validateUUID(value, 'Cart Product ID');
          },
        },
      },
      cartId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      size: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'CartProducts',
    }
  );
  return CartProducts;
};
