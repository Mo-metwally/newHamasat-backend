/**
 * Generates a slug for a given string.
 * @param {string} text - The text to be converted into a slug.
 * @returns {string} - The generated slug.
 */
const generateSlug = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .normalize("NFKD") // Normalize characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, "") // Allow Arabic, English, numbers, spaces, and dashes
    .trim() // Trim whitespace
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .toLowerCase(); // Convert to lowercase
};

module.exports = {
  generateSlug,
};
