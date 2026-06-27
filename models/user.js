'use strict';
const { Model } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { hashPassword } = require('../utils/encryption');
const {
  validateUUID,
  validateRequiredString,
  validateRole,
} = require('../utils/validations');
const { emailPattern, passwordPattern } = require('../utils/regEx');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // associations
    }

    toJSON() {
      const attributes = { ...this.get() };
      delete attributes.password;
      return attributes;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        allowNull: false,
        primaryKey: true,
        validate: {
          isValidUUID(value) {
            validateUUID(value, 'User ID');
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail(value) {
            if (!emailPattern.test(value)) {
              throw new Error('Invalid email');
            }
          },
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isValidName(value) {
            validateRequiredString(value, 'User name');
          },
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      businessField: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      productDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sec_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gMapLink: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fbLink: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tiktokLink: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      instLink: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vendorDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      whyUs: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('superAdmin', 'admin', 'manager', 'customer', 'vendor'),
        allowNull: false,
        validate: {
          isValidRole(value) {
            validateRole(
              value,
              ['superAdmin', 'admin', 'manager', 'customer', 'vendor'],
              'User role'
            );
          },
        },
      },
      passwordResetOTP: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      hooks: {
        beforeCreate: async (user) => {
          if (!passwordPattern.test(user.password)) {
            throw new Error('Invalid password');
          }
          user.password = await hashPassword(user.password);
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            if (!passwordPattern.test(user.password)) {
              throw new Error('Invalid password');
            }
            user.password = await hashPassword(user.password);
          }
        },
      },
    }
  );

  return User;
};
