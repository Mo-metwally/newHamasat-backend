"use strict";

/**
 * Utility function to validate if a value matches a specific regex pattern.
 */
const validatePattern = (value, pattern, fieldName, message) => {
  if (!pattern.test(value)) {
    throw new Error(message || `${fieldName} is invalid.`);
  }
};

/**
 * Validate a required non-empty string.
 * @param {string} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 */
const validateRequiredString = (value, fieldName) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} is required and must be a non-empty string.`);
  }
};

/**
 * Validate an optional string (can be empty but must be a valid string if provided).
 * @param {string} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 */
const validateOptionalString = (value, fieldName) => {
  if (value !== undefined && typeof value !== "string") {
    throw new Error(`${fieldName} must be a string if provided.`);
  }
};

/**
 * Validate a string containing numbers and letters.
 * @param {string} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 */
const validateStringWithNumbers = (value, fieldName) => {
  const pattern = /^[a-zA-Z0-9]+$/;
  validatePattern(
    value,
    pattern,
    fieldName,
    `${fieldName} must contain only letters and numbers.`
  );
};

/**
 * Validate a string length within a specific range.
 * @param {string} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 * @param {number} min - Minimum length (inclusive).
 * @param {number} max - Maximum length (inclusive).
 */
const validateStringLength = (value, fieldName, min, max) => {
  if (value.length < min || value.length > max) {
    throw new Error(
      `${fieldName} must be between ${min} and ${max} characters.`
    );
  }
};

/**
 * Validate a number with a default value.
 * @param {number} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 * @param {number} defaultValue - Default value if the field is undefined.
 */
const validateNumberWithDefault = (value, fieldName, defaultValue = 0) => {
  if (value === undefined) return defaultValue;
  validateNumber(value, fieldName);
  return value;
};

/**
 * Validate a number.
 * @param {number} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 */
const validateNumber = (value, fieldName) => {
  if (typeof value !== "number" || isNaN(value)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
};

/**
 * Validate a number within a specific range.
 * @param {number} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 * @param {number} min - Minimum value (inclusive).
 * @param {number} max - Maximum value (inclusive).
 */
const validateNumberRange = (value, fieldName, min, max) => {
  validateNumber(value, fieldName);
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}.`);
  }
};

/**
 * Validate an email.
 */
const validateEmail = (email, fieldName = "Email") => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  validatePattern(
    email,
    emailPattern,
    fieldName,
    `${fieldName} must be a valid email address.`
  );
};

/**
 * Validate a password.
 */
const validatePassword = (password, fieldName = "Password") => {
  const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  validatePattern(
    password,
    passwordPattern,
    fieldName,
    `${fieldName} must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.`
  );
};

// /**
//  * Validates if the provided date is in the future.
//  * @param {string|Date} value - The date value to validate (can be a Date object or string).
//  * @param {string} fieldName - The name of the field to use in the error message.
//  */
// const validateFutureDate = (value, fieldName) => {
//   // Parse the value using moment
//   const date = moment(value);

//   // Check if the date is valid and in the future
//   if (!date.isValid()) {
//     throw new Error(`${fieldName} is not a valid date.`);
//   }

//   // Compare if the date is in the future
//   if (date.isBefore(moment(), 'day')) {
//     throw new Error(`${fieldName} must be a future date.`);
//   }
// };

/**
 * Validate a UUID.
 */
const validateUUID = (value, fieldName) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error(`${fieldName} must be a valid UUID.`);
  }
};

/**
 * Validate a date.
 */
const validateDate = (value, fieldName) => {
  if (!(value instanceof Date) && isNaN(Date.parse(value))) {
    throw new Error(`${fieldName} must be a valid date.`);
  }
};

/**
 * Validate if a date is in the future.
 */
const validateFutureDate = (value, fieldName) => {
  const date = value instanceof Date ? value : new Date(value);
  if (date <= new Date()) {
    throw new Error(`${fieldName} must be a future date.`);
  }
};

/**
 * Validate if a record exists in the database.
 */
const checkIfExists = async (model, id, fieldName) => {
  const record = await model.findByPk(id);
  if (!record) {
    throw new Error(`${fieldName} with ID ${id} does not exist.`);
  }
};

/**
 * Validate if a value is unique in the database.
 */
const checkUnique = async (model, condition, fieldName) => {
  const existingRecord = await model.findOne({ where: condition });
  if (existingRecord) {
    throw new Error(`${fieldName} must be unique.`);
  }
};

/**
 * Validate a required array of strings.
 * @param {string[]} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 */
const validateRequiredArray = (value, fieldName) => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(
      `${fieldName} is required and must be an array of strings.`
    );
  }
};

/**
 * Validate an optional array of strings.
 * @param {string[]} value - The value to validate.
 * @param {string} fieldName - The name of the field for error messages.
 */
const validateOptionalArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array of strings.`);
  }
};

/**
 * Validates that the value is one of the allowed roles.
 * @param {string} value - The value to check (e.g., a user's role).
 * @param {string[]} allowedRoles - The list of valid roles for this field.
 * @param {string} fieldName - The name of the field to be used in the error message.
 */
const validateRole = (value, allowedRoles, fieldName) => {
  if (!allowedRoles.includes(value)) {
    throw new Error(`${fieldName} must be one of ${allowedRoles.join(', ')}.`);
  }
};

module.exports = {
  validateRequiredString,
  validateOptionalString,
  validateStringWithNumbers,
  validateStringLength,
  validateNumberWithDefault,
  validateOptionalArray,
  validateRequiredArray,
  validateNumber,
  validateNumberRange,
  validateEmail,
  validatePassword,
  validateUUID,
  validateDate,
  validateFutureDate,
  validateRole,
  checkIfExists,
  checkUnique,
};
