'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the Carts table
    await queryInterface.createTable('Carts', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      sessionId: {
        type: Sequelize.STRING,
      },
      expiresAt: {
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Create the trigger function
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION delete_expired_cart()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Check if the cart's expiresAt is in the past
          IF OLD."expiresAt" IS NOT NULL AND OLD."expiresAt" < NOW() THEN
              -- Delete associated CartProducts
              DELETE FROM "CartProducts" WHERE "cartId" = OLD.id;

              -- Delete the expired Cart
              DELETE FROM "Carts" WHERE id = OLD.id;
          END IF;

          RETURN NULL; -- No need to return any row
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create the trigger
    await queryInterface.sequelize.query(`
      CREATE TRIGGER delete_expired_cart
      AFTER UPDATE ON "Carts"
      FOR EACH ROW
      EXECUTE FUNCTION delete_expired_cart();
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop the trigger
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS delete_expired_cart ON "Carts";
    `);

    // Drop the trigger function
    await queryInterface.sequelize.query(`
      DROP FUNCTION IF EXISTS delete_expired_cart();
    `);

    // Drop the Carts table
    await queryInterface.dropTable('Carts');
  },
};
