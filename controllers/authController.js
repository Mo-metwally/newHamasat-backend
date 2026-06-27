const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { comparePassword } = require('../utils/encryption');
const asyncHandler = require('express-async-handler');
const { catchError } = require('../middleware/catchErrorMiddleware');
const createTokenParts = require('../utils/createToken');
const { setCookie } = require('../utils/cookies');
const { User, RegistrationOTP } = require('../models');
const sendEmail = require('../utils/email');
const { vendorWelcomeEmailTemplate } = require('../utils/emailTemplates');
const crypto = require('crypto');

// SignIn Controller
exports.signInController = catchError(
  asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return next(new ApiError('User not found', 404));

    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect)
      return next(new ApiError('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401));

    if (user.role !== 'superAdmin' && user.isActive === false) {
      return next(new ApiError('حسابك قيد المراجعة أو تم تعطيله. يرجى التواصل مع الإدارة.', 403));
    }

    // Create token parts for layered cookies
    const tokenParts = createTokenParts(user);

    // Set each token part as an HttpOnly cookie
    setCookie(res, tokenParts);

    res
      .status(200)
      .json(new ApiResponse('User logged in successfully', {}));
  }),
);

exports.vendorRegisterController = catchError(
  asyncHandler(async (req, res, next) => {
    const { name, email, password, phone, businessField, productDescription, sec_phone, gMapLink, fbLink, tiktokLink, instLink, vendorDescription, whyUs, address } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return next(new ApiError('البريد الإلكتروني مسجل بالفعل', 400));

    // Verify if email was verified via OTP
    const registrationOTP = await RegistrationOTP.findOne({ where: { email, verified: true } });
    if (!registrationOTP) {
      return next(new ApiError('لم يتم التحقق من البريد الإلكتروني. يرجى تأكيد الكود المرسل أولاً.', 400));
    }

    await User.create({
      name,
      email,
      password,
      role: 'admin',
      phone,
      sec_phone,
      gMapLink,
      fbLink,
      tiktokLink,
      instLink,
      vendorDescription,
      whyUs,
      address,
      businessField,
      productDescription,
      isActive: false
    });

    // Optionally cleanup OTP
    await RegistrationOTP.destroy({ where: { email } });

    try {
      await sendEmail({
        email: email,
        subject: 'تأكيد إنشاء الحساب - همسات هوم',
        html: vendorWelcomeEmailTemplate(name)
      });
    } catch (emailError) {
      console.error('Error sending welcome email to vendor:', emailError);
    }

    res.status(201).json(new ApiResponse('Vendor registered successfully. Pending approval.', {}));
  })
);

exports.sendRegistrationOTPController = catchError(
  asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    if (!email) return next(new ApiError('الرجاء توفير البريد الإلكتروني', 400));
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return next(new ApiError('البريد الإلكتروني غير صالح', 400));
    }

    const existingUser = await User.findOne({ where: { email: email.trim() } });
    if (existingUser) return next(new ApiError('البريد الإلكتروني مسجل بالفعل', 400));

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Upsert RegistrationOTP
    let regOTP = await RegistrationOTP.findOne({ where: { email } });
    if (regOTP) {
      regOTP.otp = otp;
      regOTP.expiresAt = expiresAt;
      regOTP.verified = false;
      await regOTP.save();
    } else {
      await RegistrationOTP.create({ email, otp, expiresAt, verified: false });
    }

    const { sendRegistrationOtpTemplate } = require('../utils/emailTemplates');
    try {
      await sendEmail({
        email,
        subject: 'رمز تأكيد التسجيل (همسات هوم)',
        html: sendRegistrationOtpTemplate(otp, email)
      });
      res.status(200).json(new ApiResponse('تم إرسال رمز التحقق بنجاح', {}));
    } catch (err) {
      console.error('OTP Send Error:', err);
      return next(new ApiError('فشل إرسال البريد الإلكتروني', 500));
    }
  })
);

exports.verifyRegistrationOTPController = catchError(
  asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    if (!email || !otp) return next(new ApiError('بيانات غير مكتملة', 400));

    const regOTP = await RegistrationOTP.findOne({ where: { email } });
    if (!regOTP) return next(new ApiError('لا يوجد طلب تحقق لهذا البريد', 404));

    if (regOTP.otp !== otp) return next(new ApiError('رمز التحقق غير صحيح', 400));
    if (new Date() > regOTP.expiresAt) return next(new ApiError('رمز التحقق انتهت صلاحيته', 400));

    regOTP.verified = true;
    await regOTP.save();

    res.status(200).json(new ApiResponse('تم تأكيد البريد الإلكتروني بنجاح', {}));
  })
);

exports.logoutController = (req, res) => {
  [
    'h_token',
    'p_token',
    's_token',
  ].forEach((partKey) => {
    res.cookie(partKey, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 1,
    });
  });

  res
    .status(200)
    .json(new ApiResponse('User logged out successfully', {}));
};

exports.meController = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse('User details fetched', req.user));
});

const { sendOtpTemplate } = require('../utils/emailTemplates');

exports.forgotPasswordController = catchError(
  asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    if (!email) return next(new ApiError('الرجاء إدخال البريد الإلكتروني', 400));

    const user = await User.findOne({ where: { email } });
    if (!user) return next(new ApiError('لا يوجد حساب مرتبط بهذا البريد الإلكتروني', 404));

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.passwordResetOTP = otp;
    user.passwordResetExpires = otpExpires;
    await user.save({ validate: false });

    // Send Email
    try {
      const htmlMessage = sendOtpTemplate(otp, email);

      await sendEmail({
        email: user.email,
        subject: 'رمز استعادة كلمة المرور (صالحة لمدة 15 دقيقة)',
        html: htmlMessage,
      });

      res.status(200).json(new ApiResponse('تم إرسال رمز التحقق إلى بريدك الإلكتروني', {}));
    } catch (err) {
      user.passwordResetOTP = null;
      user.passwordResetExpires = null;
      await user.save({ validate: false });
      console.error(err);
      return next(new ApiError('حدث خطأ أثناء إرسال البريد الإلكتروني، حاول مرة أخرى.', 500));
    }
  })
);

exports.verifyOTPController = catchError(
  asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    if (!email || !otp) return next(new ApiError('الرجاء توفير البريد الإلكتروني ورمز التحقق', 400));

    const user = await User.findOne({ where: { email } });
    if (!user) return next(new ApiError('لا يوجد حساب مرتبط بهذا البريد الإلكتروني', 404));

    if (user.passwordResetOTP !== otp) {
      return next(new ApiError('رمز التحقق غير صحيح', 400));
    }

    if (user.passwordResetExpires < new Date()) {
      return next(new ApiError('رمز التحقق انتهت صلاحيته', 400));
    }

    res.status(200).json(new ApiResponse('تم التحقق بنجاح', {}));
  })
);

exports.resetPasswordController = catchError(
  asyncHandler(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return next(new ApiError('الرجاء توفير جميع البيانات المطلوبة', 400));

    const user = await User.findOne({ where: { email } });
    if (!user) return next(new ApiError('لا يوجد حساب مرتبط بهذا البريد الإلكتروني', 404));

    if (user.passwordResetOTP !== otp) {
      return next(new ApiError('رمز التحقق غير صحيح', 400));
    }

    if (user.passwordResetExpires < new Date()) {
      return next(new ApiError('رمز التحقق انتهت صلاحيته', 400));
    }

    // Update password
    user.password = newPassword;
    user.passwordResetOTP = null;
    user.passwordResetExpires = null;
    await user.save(); // will trigger beforeUpdate to hash password

    // Create token parts for layered cookies
    const tokenParts = createTokenParts(user);
    setCookie(res, tokenParts);

    res.status(200).json(new ApiResponse('تم تغيير كلمة المرور بنجاح', {}));
  })
);

