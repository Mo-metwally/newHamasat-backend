"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Storage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Storage.init(
    {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      totalProducts: DataTypes.INTEGER,
      totalStockProducts: DataTypes.INTEGER,
      totalIsNewProducts: DataTypes.INTEGER,
      totalIsSaleProducts: DataTypes.INTEGER,
      totalOrdersPending: DataTypes.INTEGER,
      totalOrdersProcessed: DataTypes.INTEGER,
      totalOrdersShipped: DataTypes.INTEGER,
      totalOrdersDelivered: DataTypes.INTEGER,
      totalOrdersCanceled: DataTypes.INTEGER,
      totalOrdersReturned: DataTypes.INTEGER,
      totalProfit: DataTypes.DECIMAL(10, 2),
      totalOrdersRevenue: DataTypes.DECIMAL(10, 2),
      totalProductsPrice: DataTypes.DECIMAL(10, 2),
      totalProductsBasePrice: DataTypes.DECIMAL(10, 2),
      totalSalePriceProducts: DataTypes.DECIMAL(10, 2),
      totalSoldProducts: DataTypes.INTEGER,
      totalRemainingProducts: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Storage",
    }
  );
  return Storage;
};
