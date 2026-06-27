'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Storages', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
      },
      totalProducts: {
        type: Sequelize.INTEGER,
      },
      totalStockProducts: {
        type: Sequelize.INTEGER
      },
      totalIsNewProducts: {
        type: Sequelize.INTEGER
      },
      totalIsSaleProducts: {
        type: Sequelize.INTEGER
      },
      totalOrdersPending: {
        type: Sequelize.INTEGER
      },
      totalOrdersProcessed: {
        type: Sequelize.INTEGER
      },
      totalOrdersShipped: {
        type: Sequelize.INTEGER
      },
      totalOrdersDelivered: {
        type: Sequelize.INTEGER
      },
      totalOrdersCanceled: {
        type: Sequelize.INTEGER
      },
      totalOrdersReturned: {
        type: Sequelize.INTEGER
      },
      totalOrdersRevenue: {
        type: Sequelize.DECIMAL(10, 2)
      },
      totalProductsPrice: {
        type: Sequelize.DECIMAL(10, 2)
      },
      totalProductsBasePrice: {
        type: Sequelize.DECIMAL(10, 2)
      },
      totalSalePriceProducts: {
        type: Sequelize.DECIMAL(10, 2)
      },
      totalSoldProducts: {
        type: Sequelize.INTEGER
      },
      totalRemainingProducts: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Storages');
  }
};