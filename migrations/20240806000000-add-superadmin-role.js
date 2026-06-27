'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add superAdmin to the ENUM
    // Note: PostgreSQL requires specific handling for adding to ENUMs.
    // If you are using PostgreSQL:
    try {
      await queryInterface.sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE 'superAdmin';`);
    } catch (error) {
      console.warn("Could not alter ENUM. It might already exist or the dialect might not support it.", error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Removing an ENUM value in Postgres is complex and usually not done in a simple down migration.
    // So we can leave it empty or log a warning.
    console.log("Removing 'superAdmin' from ENUM 'enum_Users_role' is not supported in down migration.");
  }
};
