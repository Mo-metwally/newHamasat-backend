const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const {
  Cart,
  Product,
  CartProducts,
  Order,
  OrderProducts,
} = require("../models");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const { catchError } = require("../middleware/catchErrorMiddleware");
const asyncHandler = require("express-async-handler");
const ApiFeatures = require("../utils/apiFeatures");
const { cleanupExpiredCart } = require("../utils/cartCleanup");
const { formatPhoneNumber } = require("../utils/phoneNumber");
const { sendOrderCodeTemplate } = require("../templates/sendOrderCode");
const { sendEmail } = require("../utils/sendEmail");
const { cookieOptions } = require("../utils/cookies");

class CartController {
  static async _getCartWithProducts(cartId, transaction, lang = "ar") {
    const apiFeatures = new ApiFeatures(Product, { lang }).languageFields();

    let cart = await Cart.findOne({
      where: { id: cartId },
      include: {
        model: Product,
        as: "products",
        through: { attributes: ["quantity", "color", "size"] },
        attributes: apiFeatures.queryOptions.attributes,
      },
      transaction,
    });

    if (!cart) return null;

    for (const product of cart.products) {
      const cartProduct = await CartProducts.findOne({
        where: { cartId, productId: product.id },
        transaction,
      });

      if (product.remaining <= 0) {
        await cartProduct.destroy({ transaction });
      } else if (cartProduct.quantity > product.remaining) {
        await cartProduct.update(
          { quantity: product.remaining },
          { transaction }
        );
      }
    }

    return await Cart.findOne({
      where: { id: cartId },
      include: {
        model: Product,
        as: "products",
        through: { attributes: ["quantity", "color", "size"] },
        attributes: apiFeatures.queryOptions.attributes,
      },
      transaction,
    });
  }

  static getOrCreateCart = catchError(
    asyncHandler(async (req, res) => {
      const sessionId = req.cookies.sessionId || uuidv4();
      const lang = req.query.lang || "ar";

      if (!req.cookies.sessionId) {
        res.cookie("sessionId", sessionId, {
          ...cookieOptions,
        });
      }

      const transaction = await Cart.sequelize.transaction();
      try {
        let cart = await cleanupExpiredCart(sessionId, transaction);
        const message = cart
          ? "Cart retrieved successfully"
          : "Cart created successfully";

        if (!cart) {
          cart = await Cart.create({ sessionId }, { transaction });
        }

        const finalCart = await this._getCartWithProducts(
          cart.id,
          transaction,
          lang
        );

        await transaction.commit();
        res.status(200).json(new ApiResponse(message, finalCart));
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    })
  );

  static addProductToCart = catchError(
    asyncHandler(async (req, res) => {
      const sessionId = req.cookies.sessionId;
      const { productId, quantity, color, size } = req.body;
      if (!sessionId) throw new ApiError("Session ID not found", 400);

      const transaction = await Cart.sequelize.transaction();
      try {
        let cart = await cleanupExpiredCart(sessionId, transaction);
        if (!cart) cart = await Cart.create({ sessionId }, { transaction });

        const product = await Product.findByPk(productId, { transaction });
        if (!product) throw new ApiError("Product not found", 404);
        if (quantity > product.remaining) {
          throw new ApiError(
            `Cannot add more than ${product.remaining} units`,
            400
          );
        }

        const existingProduct = await CartProducts.findOne({
          where: { cartId: cart.id, productId, color, size },
          transaction,
        });

        if (existingProduct) {
          const newQuantity = existingProduct.quantity + quantity;
          if (newQuantity > product.remaining)
            throw new ApiError("Not enough stock available", 400);
          await existingProduct.update(
            { quantity: newQuantity },
            { transaction }
          );
        } else {
          await CartProducts.create(
            { cartId: cart.id, productId, quantity, color, size },
            { transaction }
          );
        }

        const updatedCart = await this._getCartWithProducts(
          cart.id,
          transaction
        );
        await transaction.commit();
        res
          .status(200)
          .json(new ApiResponse("Product added to cart", updatedCart));
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    })
  );

  static clearCart = catchError(
    asyncHandler(async (req, res) => {
      const sessionId = req.cookies.sessionId;

      const transaction = await Cart.sequelize.transaction();
      try {
        const cart = await cleanupExpiredCart(sessionId, transaction);
        if (!cart) throw new ApiError("Cart not found or expired", 404);

        await CartProducts.destroy({ where: { cartId: cart.id }, transaction });

        cart.products = [];
        await transaction.commit();
        res
          .status(200)
          .json(new ApiResponse("Cart cleared successfully", cart));
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    })
  );

  static removeProductFromCart = catchError(
    asyncHandler(async (req, res) => {
      const sessionId = req.cookies.sessionId;
      const { productId } = req.body;

      const transaction = await Cart.sequelize.transaction();
      try {
        const cart = await cleanupExpiredCart(sessionId, transaction);
        if (!cart) throw new ApiError("Cart not found or expired", 404);

        const productInCart = await CartProducts.findOne({
          where: { cartId: cart.id, productId },
          transaction,
        });
        if (!productInCart)
          throw new ApiError("Product not found in cart", 404);

        await productInCart.destroy({ transaction });

        const updatedCart = await this._getCartWithProducts(
          cart.id,
          transaction
        );
        await transaction.commit();
        res
          .status(200)
          .json(new ApiResponse("Product removed from cart", updatedCart));
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    })
  );

  static increaseProductQuantity = catchError(
    asyncHandler(async (req, res) => {
      await this._updateQuantity(req, res, +1);
    })
  );

  static decreaseProductQuantity = catchError(
    asyncHandler(async (req, res) => {
      await this._updateQuantity(req, res, -1);
    })
  );

  static async _updateQuantity(req, res, change) {
    const sessionId = req.cookies.sessionId;
    const { productId } = req.body;

    const transaction = await Cart.sequelize.transaction();
    try {
      const cart = await cleanupExpiredCart(sessionId, transaction);
      if (!cart) throw new ApiError("Cart not found or expired", 404);

      const productInCart = await CartProducts.findOne({
        where: { cartId: cart.id, productId },
        transaction,
      });
      if (!productInCart) throw new ApiError("Product not found in cart", 404);

      const product = await Product.findByPk(productId, { transaction });
      const newQuantity = productInCart.quantity + change;

      if (newQuantity > product.remaining)
        throw new ApiError("Not enough stock available", 400);
      if (newQuantity <= 0) {
        await productInCart.destroy({ transaction });
      } else {
        await productInCart.update({ quantity: newQuantity }, { transaction });
      }

      const updatedCart = await this._getCartWithProducts(cart.id, transaction);
      await transaction.commit();

      const message =
        change > 0
          ? "Product quantity increased"
          : "Product quantity decreased";
      res.status(200).json(new ApiResponse(message, updatedCart));
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static createOrderFromCart = catchError(
    asyncHandler(async (req, res) => {
      const sessionId = req.cookies.sessionId;
      const orderDetails = req.body;

      const transaction = await Order.sequelize.transaction();
      try {
        const cart = await cleanupExpiredCart(sessionId, transaction);
        if (!cart) throw new ApiError("Cart not found or expired", 404);

        const products = await cart.getProducts({ transaction });
        if (!products.length) throw new ApiError("Cart is empty", 400);

        let total = 0;
        for (const product of products) {
          const { quantity } = product.CartProducts;
          const unitPrice = product.isSale ? product.salePrice : product.price;
          const lineTotal = parseFloat(unitPrice) * quantity;

          if (quantity > product.remaining) {
            throw new ApiError(
              `Not enough stock for product ${product.name}. Only ${product.remaining} left.`,
              400
            );
          }

          total += lineTotal;
        }

        const orderCode = crypto.randomBytes(3).toString("hex").toUpperCase();

        const order = await Order.create(
          { ...orderDetails, sessionId, total, status: "pending", orderCode },
          { transaction }
        );

        for (const product of products) {
          const { quantity, color, size } = product.CartProducts;
          const unitPrice = product.isSale ? product.salePrice : product.price;
          const lineTotal = parseFloat(unitPrice) * quantity;

          await OrderProducts.create(
            {
              orderId: order.id,
              productId: product.id,
              quantity,
              color,
              size,
              unitPrice,
              total: lineTotal,
            },
            { transaction }
          );

          await product.update(
            {
              sold: product.sold + quantity,
              remaining: product.remaining - quantity,
            },
            { transaction }
          );
        }

        await CartProducts.destroy({ where: { cartId: cart.id }, transaction });
        await cart.destroy({ transaction });

        const formattedPhone = formatPhoneNumber(
          orderDetails.ISD,
          orderDetails.phoneNumber
        );

        const emailContent = sendOrderCodeTemplate(
          orderCode,
          orderDetails.username
        );
        await sendEmail(orderDetails.email, "تأكيد الطلب", emailContent);

        await transaction.commit();

        res.status(201).json(
          new ApiResponse("Order created successfully", {
            orderId: order.id,
            total,
            orderCode,
          })
        );
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    })
  );
}

module.exports = CartController;
