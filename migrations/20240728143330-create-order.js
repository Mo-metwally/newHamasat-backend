'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      sessionId: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.ENUM('pending', 'processed', 'shipped', 'delivered', 'canceled', 'returned')
      },
      total: {
        type: Sequelize.DECIMAL(10, 2)
      },
      username: {
        type: Sequelize.STRING
      },
      adminMessage: {
        type: Sequelize.STRING
      },
      phoneNumber: {
        type: Sequelize.STRING
      },
      ISD: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      userNote: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.STRING
      },
      area: {
        type: Sequelize.STRING
      },
      street: {
        type: Sequelize.STRING
      },
      buildingNum: {
        type: Sequelize.STRING
      },
      flatNum: {
        type: Sequelize.STRING
      },
      adminNoteOne: {
        type: Sequelize.STRING
      },
      adminNoteTwo: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.STRING
      },
      orderCode: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('Orders');
  }
};