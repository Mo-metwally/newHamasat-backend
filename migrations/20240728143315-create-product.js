'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Products', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name_en: { type: Sequelize.STRING },
      name_ar: { type: Sequelize.STRING },
      model_en: { type: Sequelize.STRING },
      model_ar: { type: Sequelize.STRING },
      slug: { type: Sequelize.STRING },
      price: { type: Sequelize.DECIMAL(10, 2) },
      basePrice: { type: Sequelize.DECIMAL(10, 2) },
      salePrice: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },
      saleExpireDate: { type: Sequelize.DATE },
      sold: { type: Sequelize.INTEGER },
      discount: { type: Sequelize.INTEGER },
      stock: { type: Sequelize.INTEGER },
      remaining: { type: Sequelize.INTEGER },
      keywords: { type: Sequelize.ARRAY(Sequelize.STRING) },
      color_en: { type: Sequelize.ARRAY(Sequelize.STRING) },
      color_ar: { type: Sequelize.ARRAY(Sequelize.STRING) },
      size_en: { type: Sequelize.ARRAY(Sequelize.STRING) },
      size_ar: { type: Sequelize.ARRAY(Sequelize.STRING) },
      description_en: { type: Sequelize.TEXT },
      description_ar: { type: Sequelize.TEXT },
      images: { type: Sequelize.ARRAY(Sequelize.STRING) },
      image: { type: Sequelize.STRING },
      newExpireDate: { type: Sequelize.DATE },
      categoryId: { type: Sequelize.UUID },
      subcategoryId: { type: Sequelize.UUID },
      brandId: { type: Sequelize.UUID },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Products');
  },
};
