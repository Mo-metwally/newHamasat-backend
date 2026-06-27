'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Products', 'vendorId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    } catch (error) {
      console.warn("Column vendorId might already exist: ", error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Products', 'vendorId');
  }
};
