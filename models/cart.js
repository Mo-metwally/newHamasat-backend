'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { validateUUID } = require('../utils/validations');

module.exports = (sequelize, DataTypes) => {
  class Cart extends Model {
    static associate(models) {
      Cart.belongsToMany(models.Product, {
        through: models.CartProducts,
        foreignKey: 'cartId',
        as: 'products',
        onDelete: 'CASCADE',
      });
    }
  }

  Cart.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        allowNull: false,
        primaryKey: true,
        validate: {
          isValidUUID(value) {
            validateUUID(value, 'Cart ID');
          },
        },
      },
      sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: 'Session ID cannot be empty' },
        },
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: () => moment().add(1, 'day').toDate(), // ✅ fallback default
      },
    },
    {
      sequelize,
      modelName: 'Cart',
      indexes: [
        { fields: ['expiresAt'] },
        { fields: ['sessionId'], unique: true },
      ],
      hooks: {
        beforeCreate: (cart) => {
          if (!cart.expiresAt) {
            cart.expiresAt = moment().add(1, 'day').toDate();
          }
        },
      },
    }
  );

  return Cart;
};
