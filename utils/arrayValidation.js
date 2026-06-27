const validateArray = (arr, fieldName, res) => {
  if (!Array.isArray(arr) || arr.length === 0) {
    res.status(400).json({
      success: false,
      message: `${fieldName} array is required.`,
    });
    return false;
  }
  return true;
};

module.exports = validateArray;
