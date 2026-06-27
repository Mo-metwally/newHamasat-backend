const path = require("path");
const PDFDocument = require("pdfkit");
const { Order, Product, OrderProducts } = require("../models");
const ApiError = require("../utils/apiError");
const asyncHandler = require("express-async-handler");
const { catchError } = require("../middleware/catchErrorMiddleware");
const ApiFeatures = require("../utils/apiFeatures");
const factory = require("../utils/handlersFactory");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const ApiResponse = require("../utils/apiResponse");
const { formatPhoneNumber } = require("../utils/phoneNumber");
const { sendOrderCodeTemplate } = require("../templates/sendOrderCode");
const { sendEmail } = require("../utils/sendEmail");
const { cookieOptions } = require("../utils/cookies");
const { adminSendEmailTemplate } = require("../templates/adminSendEmail");

class OrderController {
  static generateOrderCode() {
    return crypto.randomBytes(3).toString("hex").toUpperCase();
  }

  static async validateProductStock(product, quantity) {
    if (!product) throw new ApiError("Product not found", 404);
    if (quantity > product.remaining) {
      throw new ApiError(`Only ${product.remaining} units available`, 400);
    }
  }

  static getSessionId(req, res) {
    let sessionId = req.cookies.sessionId;
    if (!sessionId) {
      sessionId = uuidv4();
      res.cookie("sessionId", sessionId, {
        ...cookieOptions,
      });
    }
    return sessionId;
  }

  static getOrder = catchError(
    asyncHandler(async (req, res, next) => {
      const { id } = req.params;
      const include = [
        {
          model: Product,
          as: "products",
          include: [
            {
              model: Product.sequelize.models.User,
              as: "vendor",
              attributes: ["id", "name", "email", "phone"],
              required: false
            }
          ],
          through: {
            attributes: ["quantity", "color", "size", "unitPrice", "total"],
          },
        },
      ];

      const order = await Order.findByPk(id, { include });

      if (!order) {
        return next(new ApiError(`No record found for this id ${id}`, 404));
      }

      if (req.user && req.user.role === 'admin') {
        const hasVendorProduct = order.products.some(p => p.vendorId === req.user.id);
        if (!hasVendorProduct) {
          return next(new ApiError(`You are not allowed to view this order`, 403));
        }
      }

      res.status(200).json(new ApiResponse(`Order retrieved successfully`, order));
    })
  );

  static orderNow = catchError(
    asyncHandler(async (req, res) => {
      const sessionId = OrderController.getSessionId(req, res);

      const {
        productId,
        quantity,
        color,
        size,
        username,
        phoneNumber,
        ISD,
        email,
        userNote,
        address,
        area,
        street,
        buildingNum,
        flatNum,
      } = req.body;

      const transaction = await Order.sequelize.transaction();
      try {
        const product = await Product.findByPk(productId, { transaction });
        await OrderController.validateProductStock(product, quantity);

        const unitPrice = product.isSale ? product.salePrice : product.price;
        const lineTotal = parseFloat(unitPrice) * quantity;

        const orderCode = OrderController.generateOrderCode();

        const order = await Order.create(
          {
            sessionId,
            username,
            phoneNumber,
            ISD,
            email,
            userNote,
            address,
            area,
            street,
            buildingNum,
            flatNum,
            total: lineTotal,
            orderCode,
            status: "pending",
          },
          { transaction }
        );

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

        const formattedPhone = formatPhoneNumber(ISD, phoneNumber);
        const emailContent = sendOrderCodeTemplate(orderCode, username);
        await sendEmail(email, "تأكيد الطلب", emailContent);

        await transaction.commit();

        res.status(201).json(
          new ApiResponse("Order placed successfully", {
            orderId: order.id,
            total: lineTotal,
            orderCode,
          })
        );
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    })
  );

  static addProductToOrder = catchError(
    asyncHandler(async (req, res, next) => {
      const { orderId } = req.params;
      const { productId, quantity, color, size, unitPrice } = req.body;

      const transaction = await Order.sequelize.transaction();
      try {
        const order = await Order.findByPk(orderId, {
          include: [{ model: Product, as: "products" }],
          transaction
        });
        if (!order) throw new ApiError("Order not found", 404);

        if (req.user && req.user.role === 'admin') {
          const hasVendorProduct = order.products.some(p => p.vendorId === req.user.id);
          if (!hasVendorProduct) {
            throw new ApiError("غير مصرح لك بالإضافة إلى طلب لا يحتوي على منتجاتك", 403);
          }
        }

        const product = await Product.findByPk(productId, { transaction });
        if (!product) throw new ApiError("Product not found", 404);

        await OrderController.validateProductStock(product, quantity);

        const lineTotal = parseFloat(unitPrice) * quantity;

        // Create the OrderProducts association
        await OrderProducts.create(
          {
            orderId: order.id,
            productId: product.id,
            quantity,
            color: color || "n/a",
            size: size || "n/a",
            unitPrice,
            total: lineTotal,
          },
          { transaction }
        );

        // Update Product stock
        await product.update(
          {
            sold: product.sold + quantity,
            remaining: product.remaining - quantity,
          },
          { transaction }
        );

        // Recalculate order total
        const allOrderProducts = await OrderProducts.findAll({ where: { orderId: order.id }, transaction });
        const newTotal = allOrderProducts.reduce((acc, op) => acc + parseFloat(op.total || 0), 0);
        await order.update({ total: newTotal }, { transaction });

        await transaction.commit();
        res.status(200).json(new ApiResponse("Product added to order successfully", { orderTotal: newTotal }));
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    })
  );

  static updateOrderProduct = catchError(
    asyncHandler(async (req, res, next) => {
      const { orderId, productId } = req.params;
      const { quantity, color, size, unitPrice } = req.body;

      const transaction = await Order.sequelize.transaction();
      try {
        const order = await Order.findByPk(orderId, { transaction });
        if (!order) throw new ApiError("Order not found", 404);

        const orderProduct = await OrderProducts.findOne({
          where: { orderId, productId },
          transaction,
        });

        if (!orderProduct) throw new ApiError("Product not found in this order", 404);

        const product = await Product.findByPk(productId, { transaction });
        if (!product) throw new ApiError("Product not found", 404);

        const oldQuantity = orderProduct.quantity;
        const quantityDiff = quantity - oldQuantity;

        if (quantityDiff > 0) {
          // Need more stock
          if (quantityDiff > product.remaining) {
            throw new ApiError(`Only ${product.remaining} more units available`, 400);
          }
        }

        const lineTotal = parseFloat(unitPrice) * quantity;

        await orderProduct.update(
          {
            quantity,
            color: color || orderProduct.color,
            size: size || orderProduct.size,
            unitPrice,
            total: lineTotal,
          },
          { transaction }
        );

        // Adjust product stock
        await product.update(
          {
            sold: product.sold + quantityDiff,
            remaining: product.remaining - quantityDiff,
          },
          { transaction }
        );

        // Recalculate order total
        const allOrderProducts = await OrderProducts.findAll({ where: { orderId: order.id }, transaction });
        const newTotal = allOrderProducts.reduce((acc, op) => acc + parseFloat(op.total || 0), 0);
        await order.update({ total: newTotal }, { transaction });

        await transaction.commit();
        res.status(200).json(new ApiResponse("Order product updated successfully", { orderTotal: newTotal }));
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    })
  );

  static removeProductFromOrder = catchError(
    asyncHandler(async (req, res, next) => {
      const { orderId, productId } = req.params;

      const transaction = await Order.sequelize.transaction();
      try {
        const order = await Order.findByPk(orderId, { transaction });
        if (!order) throw new ApiError("Order not found", 404);

        const orderProduct = await OrderProducts.findOne({
          where: { orderId, productId },
          transaction,
        });

        if (!orderProduct) throw new ApiError("Product not found in this order", 404);

        const product = await Product.findByPk(productId, { transaction });
        
        // Restore stock if product still exists
        if (product) {
          await product.update(
            {
              sold: Math.max(0, product.sold - orderProduct.quantity),
              remaining: product.remaining + orderProduct.quantity,
            },
            { transaction }
          );
        }

        // Delete association
        await orderProduct.destroy({ transaction });

        // Recalculate order total
        const allOrderProducts = await OrderProducts.findAll({ where: { orderId: order.id }, transaction });
        const newTotal = allOrderProducts.reduce((acc, op) => acc + parseFloat(op.total || 0), 0);
        await order.update({ total: newTotal }, { transaction });

        await transaction.commit();
        res.status(200).json(new ApiResponse("Product removed from order successfully", { orderTotal: newTotal }));
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    })
  );

  static getAllOrders = catchError(
    asyncHandler(async (req, res) => {
      const apiFeatures = new ApiFeatures(Order, req.query)
        .filter()
        .search()
        .sort()
        .limitFields()
        .languageFields();

      if (req.user && req.user.role === 'admin') {
        apiFeatures.queryOptions.include = [
          {
            model: Product,
            as: "products",
            where: { vendorId: req.user.id },
            attributes: [],
            through: { attributes: [] }
          }
        ];
        apiFeatures.queryOptions.distinct = true;
      } else if (req.user && req.user.role === 'superAdmin') {
        apiFeatures.queryOptions.include = [
          {
            model: Product,
            as: "products",
            include: [
              {
                model: Product.sequelize.models.User,
                as: "vendor",
                attributes: ["id", "name", "email", "phone"],
                required: false
              }
            ],
            through: { attributes: [] } // you can include attributes if needed
          }
        ];
        apiFeatures.queryOptions.distinct = true;
      }

      await apiFeatures.paginate();
      const records = await apiFeatures.query();

      res.status(200).json(
        new ApiResponse(`Orders retrieved successfully`, {
          results: records.length,
          pagination: apiFeatures.paginationResult,
          data: records,
        })
      );
    })
  );

  static getAllOrdersForGuest = catchError(
    asyncHandler(async (req, res) => {
      const sessionId = req.cookies.sessionId;
      const lang = req.query.lang || "ar";

      if (!sessionId) throw new ApiError("Session ID not found", 400);

      const apiFeatures = new ApiFeatures(Product, { lang }).languageFields();

      const orders = await Order.findAll({
        where: { sessionId },
        include: {
          model: Product,
          as: "products",
          through: {
            attributes: ["quantity", "color", "size", "unitPrice", "total"],
          },
          attributes: apiFeatures.queryOptions.attributes,
        },
      });

      if (!orders.length)
        throw new ApiError("No orders found for this session", 404);

      res.status(200).json({ results: orders.length, data: orders });
    })
  );

  static getOrderInvoice = catchError(
    asyncHandler(async (req, res) => {
      const { orderId } = req.params;
      const lang = req.query.lang || "ar";

      const order = await Order.findOne({
        where: { id: orderId },
        include: {
          model: Product,
          as: "products",
          through: {
            attributes: ["quantity", "color", "size", "unitPrice", "total"],
          },
          attributes: [`name_${lang}`, `model_${lang}`, `description_${lang}`],
        },
      });

      if (!order) {
        throw new ApiError(
          lang === "ar" ? "لم يتم العثور على الطلب" : "Order not found",
          404
        );
      }

      const pdfDoc = new PDFDocument({ margin: 50 });
      const invoiceName = `invoice-${orderId}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);
      pdfDoc.pipe(res);

      OrderController.renderInvoice(pdfDoc, order, lang);

      pdfDoc.end();
    })
  );

  static inquireOrderByCode = catchError(
    asyncHandler(async (req, res) => {
      const { code } = req.params;
      const lang = req.query.lang || "ar";

      const apiFeatures = new ApiFeatures(Product, { lang }).languageFields();

      const order = await Order.findOne({
        where: { orderCode: code },
        include: {
          model: Product,
          as: "products",
          through: {
            attributes: ["quantity", "color", "size", "unitPrice", "total"],
          },
          attributes: apiFeatures.queryOptions.attributes,
        },
      });

      if (!order) throw new ApiError("Order not found", 404);

      res.status(200).json({ success: true, data: order });
    })
  );

  static sendVendorEmail = catchError(
    asyncHandler(async (req, res, next) => {
      const { vendorEmail, vendorName, subject, message } = req.body;
      
      if (!vendorEmail || !message) {
         return next(new ApiError("Email and message are required", 400));
      }

      const htmlContent = adminSendEmailTemplate(vendorName || 'البائع', message.replace(/\n/g, '<br>'));

      await sendEmail(vendorEmail, subject || "إخطار من النظام", htmlContent);

      res.status(200).json({ success: true, message: "Email sent successfully" });
    })
  );

  static renderInvoice(pdfDoc, order, lang) {
    // Company header
    pdfDoc
      .image(path.join(__dirname, "../public/assets/logo.png"), 50, 30, {
        width: 75,
      })
      .fontSize(18)
      .font(
        lang === "ar"
          ? path.join(__dirname, "../public/assets/Amiri-Regular.ttf")
          : "Helvetica"
      )
      .text(lang === "ar" ? "الشركة اسم" : "Your Company Name", 150, 30, {
        align: lang === "ar" ? "right" : "left",
      })
      .fontSize(10)
      .text(
        lang === "ar" ? "الشركة عنوان" : "Address: Your Company Address",
        150,
        pdfDoc.y + 1,
        { align: lang === "ar" ? "right" : "left" }
      )
      .text(
        lang === "ar" ? "+1234567890 : الهاتف" : "Phone: +1234567890",
        150,
        pdfDoc.y,
        { align: lang === "ar" ? "right" : "left" }
      )
      .text(
        lang === "ar"
          ? "info@yourcompany.com : الايميل"
          : "Email: info@yourcompany.com",
        150,
        pdfDoc.y,
        { align: lang === "ar" ? "right" : "left" }
      )
      .moveDown(2);

    // Invoice title
    pdfDoc
      .fontSize(20)
      .text(lang === "ar" ? "فاتورة" : "Invoice", {
        align: "center",
        underline: true,
      })
      .moveDown(0.5);

    // Order details
    pdfDoc
      .fontSize(12)
      .text(
        lang === "ar" ? `${order.id} : الطلب رقم` : `Order ID: ${order.id}`,
        { align: "right" }
      )
      .text(
        lang === "ar"
          ? `${new Date(order.createdAt).toLocaleDateString(
              "en"
            )} : الطلب تاريخ`
          : `Order Date: ${new Date(order.createdAt).toLocaleDateString("en")}`,
        { align: "right" }
      )
      .text(
        lang === "ar"
          ? `${new Date(order.updatedAt).toLocaleDateString(
              "en"
            )} : الطلب وصول تاريخ`
          : `Order Delivered Date: ${new Date(
              order.updatedAt
            ).toLocaleDateString("en")}`,
        { align: "right" }
      )
      .moveDown(0.5);

    pdfDoc
      .fontSize(12)
      .text(lang === "ar" ? "المنتجات تفاصيل " : "Product Details:", {
        underline: true,
        align: "center",
      })
      .moveDown(0.5)
      .fontSize(10)
      .text(
        lang === "ar"
          ? "المنتج اسم       الكمية       السعر       الإجمالي"
          : "Product Name       Quantity       Price       Total",
        { underline: true }
      );

    let total = 0;
    order.products.forEach((product) => {
      const name = product[`name_${lang}`] || "";
      const quantity = product.OrderProducts?.quantity || 0;
      const price = parseFloat(product.OrderProducts?.unitPrice) || 0;
      const lineTotal =
        parseFloat(product.OrderProducts?.total) || quantity * price;
      total += lineTotal;

      pdfDoc.text(
        `${name}       ${quantity}       ${price.toFixed(
          2
        )}       ${lineTotal.toFixed(2)}`
      );
    });

    // Total row
    pdfDoc
      .moveDown()
      .fontSize(12)
      .text(
        lang === "ar"
          ? ` جنيهاً ${total.toLocaleString("en", {
              minimumFractionDigits: 2,
            })} : الإجمالي`
          : `Total: ${total.toLocaleString("en", {
              minimumFractionDigits: 2,
            })} Pounds`,
        { align: "right" }
      );

    // Signature
    pdfDoc
      .moveDown(3)
      .fontSize(12)
      .text(lang === "ar" ? "التوقيع:" : "Signature:", { underline: true })
      .font(path.join(__dirname, "../public/assets/signature-font.ttf"))
      .fontSize(16)
      .moveDown(0.5)
      .text("MohamedAtef", 80, pdfDoc.y, { align: "left" });
  }
}

module.exports = OrderController;
