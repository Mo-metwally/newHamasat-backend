const slugify = require('slugify');
const { generateSlug } = require("./regExSlug");

/**
 * Generates a slug for the given object based on `name_en` or `name_ar` if `name_en` is null.
 * @param {Object} entity - The entity object (e.g., model instance).
 * @param {string} primaryField - The primary field to use for generating the slug.
 * @param {string} fallbackField - The fallback field to use if the primary field is null or empty.
 * @param {string} [slugField='slug'] - The field to store the generated slug.
 */
const setSlug = (entity, primaryField, fallbackField, slugField = "slug") => {
  const nameToSlugify = entity[primaryField] || entity[fallbackField];
  if (!entity[slugField] && nameToSlugify) {
    entity[slugField] = generateSlug(nameToSlugify);
  }
};

/**
 * Generates default name_en or name_ar for a given entity.
 * @param {Object} entity - The model instance (e.g., Product, Category).
 */
const generateName = (entity) => {
  if (!entity.name_en && entity.name_ar) {
    entity.name_en = slugify(entity.name_ar, { lower: true, strict: true });
  } else if (!entity.name_ar && entity.name_en) {
    entity.name_ar = entity.name_en;
  }
};

module.exports = {
  setSlug,
  generateName
};

// const slugify = require("slugify");

// /**
//  * Generates a slug for the given object based on `name_en` or `name_ar` if `name_en` is null.
//  * @param {Object} entity - The entity object (e.g., model instance).
//  * @param {string} primaryField - The primary field to use for generating the slug.
//  * @param {string} fallbackField - The fallback field to use if the primary field is null or empty.
//  * @param {string} [slugField='slug'] - The field to store the generated slug.
//  */
// const setSlug = (entity, primaryField, fallbackField, slugField = "slug") => {
//   const nameToSlugify = entity[primaryField] || entity[fallbackField];
//   if (!entity[slugField] && nameToSlugify) {
//     entity[slugField] = slugify(nameToSlugify, { lower: true, strict: true });
//   }
// };

// module.exports = {
//   setSlug,
// };
