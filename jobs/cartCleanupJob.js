const { Sequelize, Carts, CartProducts } = require("../models");
const { Op } = require("sequelize");
const moment = require("moment");

const deleteExpiredCarts = async () => {
  const transaction = await Sequelize.transaction();

  try {
    const currentDate = moment().toDate();

    // Find expired cart IDs
    const expiredCarts = await Carts.findAll({
      where: { expiresAt: { [Op.lt]: currentDate } },
      attributes: ["id"],
      transaction,
    });

    const expiredCartIds = expiredCarts.map((cart) => cart.id);

    if (expiredCartIds.length > 0) {
      // Delete associated cart products
      const cartProductsDeleted = await CartProducts.destroy({
        where: { cartId: expiredCartIds },
        transaction,
      });

      console.log(`${cartProductsDeleted} cart products deleted.`);

      // Delete expired carts
      const cartsDeleted = await Carts.destroy({
        where: { id: expiredCartIds },
        transaction,
      });

      console.log(`${cartsDeleted} carts deleted.`);
    } else {
      console.log("No expired carts found to delete.");
    }

    // Commit the transaction
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting expired carts:", error.message);
    console.error(error.stack);
  }
};

module.exports = deleteExpiredCarts;
