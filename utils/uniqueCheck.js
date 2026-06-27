const { Op } = require('sequelize');
const { createStandardizedCondition } = require('./standardizeName');
const ApiError = require('./apiError');

const checkUniqueField = async (Model, uniqueField, reqBody, excludeId = null) => {
  if (uniqueField) {
    const { lang, ...rest } = reqBody;
    const uniqueLangs = Object.keys(rest).filter((key) =>
      key.startsWith(uniqueField)
    );

    // Check for uniqueness across all language fields
    const orConditions = uniqueLangs.map((langField) =>
      createStandardizedCondition(
        uniqueField,
        reqBody[langField],
        langField.split('_')[1]
      )
    );

    const whereCondition = excludeId
      ? {
          [Op.and]: [
            { id: { [Op.ne]: excludeId } },
            { [Op.or]: orConditions },
          ],
        }
      : { [Op.or]: orConditions };

    const existingRecord = await Model.findOne({
      where: whereCondition,
    });

    if (existingRecord) {
      throw new ApiError(
        `Record with this ${uniqueField} already exists in one of the languages`,
        400
      );
    }
  }
};

module.exports = checkUniqueField;
