const db = require('./models');

async function fixProducts() {
  try {
    const email = process.env.DEFAULT_SUPERADMIN_EMAIL || 'superadmin@hamasat.com';
    const superAdmin = await db.User.findOne({ where: { email } });
    if (superAdmin) {
      const [updated] = await db.Product.update(
        { vendorId: superAdmin.id },
        { where: { vendorId: null } }
      );
      console.log(`Successfully assigned ${updated} products to superAdmin (${email}).`);
    } else {
      console.log('superAdmin not found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

fixProducts();
