const { User } = require("../models");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("express-async-handler");
const { catchError } = require("../middleware/catchErrorMiddleware");
const ApiFeatures = require("../utils/apiFeatures");

exports.getAllUsers = catchError(
  asyncHandler(async (req, res, next) => {
    const apiFeatures = new ApiFeatures(User, req.query)
      .filter()
      .search()
      .sort()
      .limitFields();

    await apiFeatures.paginate();
    const users = await apiFeatures.query();

    res.status(200).json(
      new ApiResponse("Users retrieved successfully", {
        results: users.length,
        pagination: apiFeatures.paginationResult,
        data: users,
      })
    );
  })
);

exports.updateUser = catchError(
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { 
      name, email, phone, sec_phone, address, 
      role, isActive, businessField, vendorDescription, productDescription,
      whyUs, gMapLink, fbLink, tiktokLink, instLink
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return next(new ApiError("User not found", 404));
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.sec_phone = sec_phone !== undefined ? sec_phone : user.sec_phone;
    user.address = address !== undefined ? address : user.address;

    if (businessField !== undefined) user.businessField = businessField;
    if (vendorDescription !== undefined) user.vendorDescription = vendorDescription;
    if (productDescription !== undefined) user.productDescription = productDescription;
    if (whyUs !== undefined) user.whyUs = whyUs;
    if (gMapLink !== undefined) user.gMapLink = gMapLink;
    if (fbLink !== undefined) user.fbLink = fbLink;
    if (tiktokLink !== undefined) user.tiktokLink = tiktokLink;
    if (instLink !== undefined) user.instLink = instLink;

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.status(200).json(
      new ApiResponse("User updated successfully", user)
    );
  })
);

exports.deleteUser = catchError(
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return next(new ApiError("User not found", 404));
    }

    await user.destroy();

    res.status(204).json(new ApiResponse("User deleted successfully", {}));
  })
);

exports.updateMe = catchError(
  asyncHandler(async (req, res, next) => {
    const { 
      name, email, phone, password, sec_phone, address, 
      businessField, productDescription, vendorDescription, whyUs, 
      fbLink, instLink, tiktokLink, gMapLink 
    } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return next(new ApiError("User not found", 404));
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) user.password = password;
    if (sec_phone !== undefined) user.sec_phone = sec_phone;
    if (address !== undefined) user.address = address;
    if (businessField !== undefined) user.businessField = businessField;
    if (productDescription !== undefined) user.productDescription = productDescription;
    if (vendorDescription !== undefined) user.vendorDescription = vendorDescription;
    if (whyUs !== undefined) user.whyUs = whyUs;
    if (fbLink !== undefined) user.fbLink = fbLink;
    if (instLink !== undefined) user.instLink = instLink;
    if (tiktokLink !== undefined) user.tiktokLink = tiktokLink;
    if (gMapLink !== undefined) user.gMapLink = gMapLink;

    await user.save();

    res.status(200).json(
      new ApiResponse("User data updated successfully", user)
    );
  })
);

exports.getVendorProfile = catchError(
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const vendor = await User.findByPk(id, {
      attributes: [
        'id', 'name', 'email', 'phone', 'sec_phone', 'address',
        'businessField', 'vendorDescription', 'productDescription',
        'gMapLink', 'fbLink', 'tiktokLink', 'instLink', 'role'
      ] // Exclude password, whyUs, and other sensitive fields
    });

    if (!vendor) {
      return next(new ApiError("البائع غير موجود", 404));
    }

    // Optionally check if vendor.role === 'vendor' or 'admin' 
    // depending on the platform's logic for vendors.
    
    res.status(200).json(
      new ApiResponse("تم جلب بيانات البائع بنجاح", vendor)
    );
  })
);
