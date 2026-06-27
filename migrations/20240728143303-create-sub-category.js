'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SubCategories', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name_en: {
        type: Sequelize.STRING
      },
      name_ar: {
        type: Sequelize.STRING
      },
      image: {
        type: Sequelize.STRING
      },
      slug: {
        type: Sequelize.STRING
      },
      categoryId: {
        type: Sequelize.UUID
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
    await queryInterface.dropTable('SubCategories');
  }
};