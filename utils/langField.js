const getLanguageField = (baseField, lang) => {
  return `${baseField}_${lang}`;
}

module.exports = { getLanguageField };
