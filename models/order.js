'use strict';
const {
  Model
} = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { emailPattern } = require('../utils/regEx');
const { validateUUID } = require('../utils/validations');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.belongsToMany(models.Product, { through: models.OrderProducts, foreignKey: 'orderId', as: 'products' });
    }
  }
  Order.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      primaryKey: true,
      validate: {
        isValidUUID(value) {
          validateUUID(value, "Order ID");
        },
      },
    },
    total: DataTypes.DECIMAL(10, 2),
    orderCode: DataTypes.STRING,
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ISD: DataTypes.STRING,
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail(value) {
          if (!emailPattern.test(value)) {
            throw new Error('Invalid email');
          }
        }
      }
    },
    userNote: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    street: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    buildingNum: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    adminMessage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    flatNum: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    adminNoteOne: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    adminNoteTwo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('pending', 'processed', 'shipped', 'delivered', 'canceled', 'returned'),
      allowNull: false,
      defaultValue: 'pending',
    },
  }, {
    sequelize,
    modelName: 'Order',
  });

  return Order;
};
