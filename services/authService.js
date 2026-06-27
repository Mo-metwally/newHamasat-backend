const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const { User } = require('../models');

// Protect route middleware with individual token validation
exports.protect = asyncHandler(async (req, res, next) => {
  const tokenParts = [
    req.cookies.h_token,
    req.cookies.p_token,
    req.cookies.s_token,
  ];

  // Check if all parts are present
  if (tokenParts.some(part => !part)) {
    return next(new ApiError("You are not logged in. Please log in to access this route", 401));
  }

  try {
    const decodedPayload = {
      h_token: jwt.verify(req.cookies.h_token, process.env.JWT_SECRET_KEY),
      p_token: jwt.verify(req.cookies.p_token, process.env.JWT_SECRET_KEY),
      s_token: jwt.verify(req.cookies.s_token, process.env.JWT_SECRET_KEY),
    };

    // Extract user ID from decoded payload
    const userId = decodedPayload.h_token.userId;

    // Find user by ID
    const currentUser = await User.findByPk(userId);

    if (!currentUser) {
      return next(new ApiError("The user belonging to this token no longer exists", 401));
    }

    // Attach user data to request object
    req.user = currentUser;
    next();
  } catch (err) {
    return next(new ApiError("Invalid token, please log in again", 401));
  }
});

exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // 1) access roles
    // 2) access registered user (req.user.role)
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError('You are not allowed to access this route', 403),
      );
    }
    next();
  });

exports.checkAuth = asyncHandler(async (req, res, next) => {
  if (!req.cookies.h_token && !req.cookies.p_token && !req.cookies.s_token) {
    return next();
  }

  try {
    const decodedPayload = {
      h_token: jwt.verify(req.cookies.h_token, process.env.JWT_SECRET_KEY),
      p_token: jwt.verify(req.cookies.p_token, process.env.JWT_SECRET_KEY),
      s_token: jwt.verify(req.cookies.s_token, process.env.JWT_SECRET_KEY),
    };

    // Extract user ID from decoded payload
    const userId = decodedPayload.h_token.userId;

    // Find user by ID
    const currentUser = await User.findByPk(userId);

    if (!currentUser) {
      return next();
    }

    // Attach user data to request object
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    return next();
  }
});
