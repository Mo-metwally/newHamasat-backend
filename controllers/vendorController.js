const { User } = require("../models");
const ApiError = require("../utils/apiError");
const ApiResponse = require("../utils/apiResponse");
const asyncHandler = require("express-async-handler");
const { catchError } = require("../middleware/catchErrorMiddleware");
const ApiFeatures = require("../utils/apiFeatures");
const { invalidateKey } = require("../utils/cacheInvalidate");

exports.getAllVendors = catchError(
  asyncHandler(async (req, res, next) => {
    const apiFeatures = new ApiFeatures(User, req.query)
      .filter()
      .search()
      .sort()
      .limitFields();

    // Force filtering by role: admin
    apiFeatures.queryOptions.where = {
      ...apiFeatures.queryOptions.where,
      role: 'admin'
    };

    await apiFeatures.paginate();
    const vendors = await apiFeatures.query();

    res.status(200).json(
      new ApiResponse("Vendors retrieved successfully", {
        results: vendors.length,
        pagination: apiFeatures.paginationResult,
        data: vendors,
      })
    );
  })
);

exports.updateVendor = catchError(
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { 
      name, email, phone, sec_phone, address, 
      businessField, productDescription, vendorDescription, 
      whyUs, fbLink, instLink, tiktokLink, gMapLink, 
      role, isActive 
    } = req.body;

    const vendor = await User.findByPk(id);
    if (!vendor) {
      return next(new ApiError("Vendor/User not found", 404));
    }

    vendor.name = name || vendor.name;
    vendor.email = email || vendor.email;
    vendor.phone = phone || vendor.phone;
    vendor.sec_phone = sec_phone !== undefined ? sec_phone : vendor.sec_phone;
    vendor.address = address !== undefined ? address : vendor.address;
    vendor.businessField = businessField !== undefined ? businessField : vendor.businessField;
    vendor.productDescription = productDescription !== undefined ? productDescription : vendor.productDescription;
    vendor.vendorDescription = vendorDescription !== undefined ? vendorDescription : vendor.vendorDescription;
    vendor.whyUs = whyUs !== undefined ? whyUs : vendor.whyUs;
    vendor.fbLink = fbLink !== undefined ? fbLink : vendor.fbLink;
    vendor.instLink = instLink !== undefined ? instLink : vendor.instLink;
    vendor.tiktokLink = tiktokLink !== undefined ? tiktokLink : vendor.tiktokLink;
    vendor.gMapLink = gMapLink !== undefined ? gMapLink : vendor.gMapLink;

    if (role) {
      vendor.role = role;
    }
    
    if (isActive !== undefined) {
      if (vendor.isActive !== isActive) {
        vendor.isActive = isActive;
        await invalidateKey("products:*");
        await invalidateKey("product:*");
        await invalidateKey("product-all:*");

        const { updateStatusEmailTemplate } = require("../utils/emailTemplates");
        const { sendEmail } = require("../utils/sendEmail");

        const statusMessage = isActive 
          ? "لقد تم تفعيل حسابك بنجاح كبائع في منصة همسات هوم. يمكنك الآن البدء بعرض منتجاتك للعملاء." 
          : "لقد تم تعطيل حسابك كبائع مؤقتاً. يرجى التواصل مع الدعم الفني لمزيد من التفاصيل.";

        const emailHtml = updateStatusEmailTemplate(vendor.name, statusMessage);
        
        try {
          await sendEmail(vendor.email, "تحديث حالة حسابك - همسات هوم", emailHtml);
        } catch (error) {
          console.error("Failed to send status update email:", error);
        }
      }
    }

    await vendor.save();

    res.status(200).json(
      new ApiResponse("Vendor updated successfully", vendor)
    );
  })
);

exports.deleteVendor = catchError(
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const vendor = await User.findByPk(id);
    if (!vendor || vendor.role !== 'admin') {
      return next(new ApiError("Vendor not found", 404));
    }

    await vendor.destroy();

    res.status(204).json(new ApiResponse("Vendor deleted successfully", {}));
  })
);
