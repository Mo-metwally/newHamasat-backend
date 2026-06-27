'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { validateUUID } = require('../utils/validations');

module.exports = (sequelize, DataTypes) => {
  class OrderProducts extends Model {
    static associate(models) {
      // belongsTo relations can be added here if needed
    }
  }

  OrderProducts.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        allowNull: false,
        primaryKey: true,
        validate: {
          isValidUUID(value) {
            validateUUID(value, 'Order Product ID');
          },
        },
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      orderId: DataTypes.UUID,
      productId: DataTypes.UUID,
      color: DataTypes.STRING,
      size: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'OrderProducts',
    }
  );
  return OrderProducts;
};
