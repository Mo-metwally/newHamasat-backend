'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const email = process.env.DEFAULT_SUPERADMIN_EMAIL || 'superadmin@hamasat.com';
    const password = process.env.DEFAULT_SUPERADMIN_PASSWORD || 'Superadmin@123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    const superAdminId = uuidv4();

    // Insert superAdmin user
    try {
      await queryInterface.bulkInsert('Users', [{
        id: superAdminId,
        name: 'Super Admin',
        email: email,
        password: hashedPassword,
        role: 'superAdmin',
        createdAt: new Date(),
        updatedAt: new Date(),
      }]);

      // Assign all existing products to the newly created superAdmin
      await queryInterface.sequelize.query(
        `UPDATE "Products" SET "vendorId" = '${superAdminId}' WHERE "vendorId" IS NULL;`
      );
    } catch (err) {
      console.log('Error creating default superAdmin or assigning products. The email might already exist.', err.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const email = process.env.DEFAULT_SUPERADMIN_EMAIL || 'superadmin@hamasat.com';
    await queryInterface.bulkDelete('Users', { email: email });
  }
};
