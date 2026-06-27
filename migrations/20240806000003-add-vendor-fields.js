'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      try {
        await queryInterface.addColumn('Users', 'phone', { type: Sequelize.STRING, allowNull: true }, { transaction });
      } catch (e) { console.warn("Column phone might already exist."); }
      
      try {
        await queryInterface.addColumn('Users', 'businessField', { type: Sequelize.STRING, allowNull: true }, { transaction });
      } catch (e) { console.warn("Column businessField might already exist."); }
      
      try {
        await queryInterface.addColumn('Users', 'productDescription', { type: Sequelize.TEXT, allowNull: true }, { transaction });
      } catch (e) { console.warn("Column productDescription might already exist."); }
      
      try {
        await queryInterface.addColumn('Users', 'isActive', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true }, { transaction });
      } catch (e) { console.warn("Column isActive might already exist."); }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('Users', 'phone', { transaction });
      await queryInterface.removeColumn('Users', 'businessField', { transaction });
      await queryInterface.removeColumn('Users', 'productDescription', { transaction });
      await queryInterface.removeColumn('Users', 'isActive', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
