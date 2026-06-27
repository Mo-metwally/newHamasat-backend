const moment = require('moment');
const { sequelize } = require('../models');
const { Transaction } = require('sequelize');

async function cleanupExpiredCart(sessionId, transaction = null) {
  try {
    const Cart = sequelize.models.Cart;
    const CartProducts = sequelize.models.CartProducts;

    let cart = await Cart.findOne({
      where: { sessionId },
      lock: transaction ? Transaction.LOCK.UPDATE : undefined,
      transaction,
    });

    if (cart && moment(cart.expiresAt).isBefore(moment())) {
      const tx = transaction || (await sequelize.transaction());
      try {
        await CartProducts.destroy({
          where: { cartId: cart.id },
          transaction: tx,
        });
        await cart.destroy({ transaction: tx });

        if (!transaction) await tx.commit();
        return null;
      } catch (error) {
        if (!transaction) await tx.rollback();
        throw error;
      }
    }

    if (cart) {
      const newExpiry = moment().add(1, 'day').toDate();
      await cart.update({ expiresAt: newExpiry }, { transaction });
    }

    return cart;
  } catch (error) {
    console.error('Error cleaning up expired cart:', error);
    throw error;
  }
}

module.exports = { cleanupExpiredCart };
