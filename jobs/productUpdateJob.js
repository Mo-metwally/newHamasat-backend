const { Products } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const updateExpiredProducts = async () => {
  try {
    const currentDate = moment().toDate();

    // Update expired sale products
    const saleUpdateCount = await Products.update(
      { isSale: false, saleExpireDate: null },
      { where: { saleExpireDate: { [Op.lt]: currentDate } } }
    );

    console.log(`${saleUpdateCount[0]} sale products marked as expired.`);

    // Update expired new products
    const newUpdateCount = await Products.update(
      { isNew: false, newExpireDate: null },
      { where: { newExpireDate: { [Op.lt]: currentDate } } }
    );

    console.log(`${newUpdateCount[0]} new products marked as expired.`);
  } catch (error) {
    console.error('Error updating expired products:', error.message);
    console.error(error.stack);
  }
};

module.exports = updateExpiredProducts;
