'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RegistrationOTP extends Model {
    static associate(models) {
      // no associations needed
    }
  }

  RegistrationOTP.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // one active OTP flow per email at a time
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'RegistrationOTP',
      timestamps: true,
    }
  );

  return RegistrationOTP;
};
