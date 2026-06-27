const { where, fn, col } = require('sequelize');

const standardizeName = (value) => value.replace(/\s+/g, '').toLowerCase();

const createStandardizedCondition = (baseField, value, lang) => {
  return where(
    fn('replace', fn('lower', col(`${baseField}_${lang}`)), ' ', ''),
    standardizeName(value)
  );
};

module.exports = { standardizeName, createStandardizedCondition };
