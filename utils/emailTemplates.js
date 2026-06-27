const CLIENT_URL = process.env.CLIENT_URL || 'http://192.168.1.2:3000';

exports.sendOtpTemplate = (otp, email) => {
  return `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 650px; margin: auto; background-color: #fff7ef; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #ffeae2;">

      <!-- الهيدر -->
      <div style="background-color: #ffeae2; padding: 25px; text-align: center;">
        <img src="https://raw.githubusercontent.com/Mo-metwally/Images/refs/heads/metwally/HamasatLogo2.png" alt="Hamsat Home Logo" style="max-width: 250px; margin-bottom: 12px;" />
        <h2 style="margin: 0; font-size: 26px; font-weight: bold; color: #4a1e0a;">استعادة كلمة المرور</h2>
      </div>

      <!-- المحتوى -->
      <div style="padding: 30px; color: #4a1e0a; font-size: 18px; line-height: 1.8;">
        <p style="margin: 0 0 18px; font-size: 19px;">مرحبًا،</p>
        <p style="margin: 0 0 20px; font-size: 17px;">لقد تلقينا طلبًا لاستعادة كلمة المرور الخاصة بحسابك (${email}). الرجاء استخدام الرمز أدناه لإكمال العملية.</p>
        
        <p style="margin: 0 0 15px; font-size: 18px; font-weight: bold;">رمز التحقق الخاص بك (OTP) هو:</p>
        <div style="text-align: center; margin: 25px 0;">
          <p style="font-size: 32px; font-weight: bold; color: #ff4b00; letter-spacing: 4px;">${otp}</p>
        </div>

        <p style="margin: 0 0 18px; font-size: 15px; color: #666;">
          <em>ملاحظة: هذا الرمز صالح لمدة 15 دقيقة فقط. إذا لم تقم بطلب استعادة كلمة المرور، يرجى تجاهل هذا البريد تماماً ولن يحدث أي تغيير على حسابك.</em>
        </p>

      </div>

      <!-- الفوتر -->
      <div style="background-color: #ffeae2; padding: 20px; text-align: center; font-size: 15px; color: #4a1e0a;">
        <p style="margin: 0 0 6px; font-size: 16px;">شكرًا لاختيارك <strong>همسات هوم</strong></p>
        <p style="margin: 0; font-size: 15px;">فريق دعم همسات هوم</p>
      </div>
    </div>
  `;
};

exports.sendRegistrationOtpTemplate = (otp, email) => {
  return `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 650px; margin: auto; background-color: #fff7ef; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #ffeae2;">

      <!-- الهيدر -->
      <div style="background-color: #ffeae2; padding: 25px; text-align: center;">
        <img src="https://raw.githubusercontent.com/Mo-metwally/Images/refs/heads/metwally/HamasatLogo2.png" alt="Hamsat Home Logo" style="max-width: 250px; margin-bottom: 12px;" />
        <h2 style="margin: 0; font-size: 26px; font-weight: bold; color: #4a1e0a;">تأكيد التسجيل كبائع</h2>
      </div>

      <!-- المحتوى -->
      <div style="padding: 30px; color: #4a1e0a; font-size: 18px; line-height: 1.8;">
        <p style="margin: 0 0 18px; font-size: 19px;">مرحبًا،</p>
        <p style="margin: 0 0 20px; font-size: 17px;">شكرًا لاهتمامك بالانضمام كبائع في منصة همسات هوم بالبريد (${email}). يرجى استخدام الرمز أدناه لإكمال عملية إنشاء الحساب.</p>
        
        <p style="margin: 0 0 15px; font-size: 18px; font-weight: bold;">رمز التحقق الخاص بك (OTP) هو:</p>
        <div style="text-align: center; margin: 25px 0;">
          <p style="font-size: 32px; font-weight: bold; color: #ff4b00; letter-spacing: 4px;">${otp}</p>
        </div>

        <p style="margin: 0 0 18px; font-size: 15px; color: #666;">
          <em>ملاحظة: هذا الرمز صالح لمدة 15 دقيقة فقط. إذا لم تطلب إنشاء حساب، يمكنك تجاهل هذا البريد تماماً ولن يتم استكمال التسجيل.</em>
        </p>

      </div>

      <!-- الفوتر -->
      <div style="background-color: #ffeae2; padding: 20px; text-align: center; font-size: 15px; color: #4a1e0a;">
        <p style="margin: 0 0 6px; font-size: 16px;">يسعدنا انضمامك <strong>لعائلة همسات هوم</strong></p>
        <p style="margin: 0; font-size: 15px;">فريق دعم همسات هوم</p>
      </div>
    </div>
  `;
};

exports.updateStatusEmailTemplate = (username, message) => {
  return `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 650px; margin: auto; background-color: #fff7ef; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #ffeae2;">

      <!-- الهيدر -->
      <div style="background-color: #ffeae2; padding: 25px; text-align: center;">

        <img src="https://raw.githubusercontent.com/Mo-metwally/Images/refs/heads/metwally/HamasatLogo2.png" alt="Hamsat Home Logo" style="max-width: 250px; margin-bottom: 12px;" />
        <h2 style="margin: 0; font-size: 26px; font-weight: bold; color: #4a1e0a;">تحديث حالة حسابك - همسات هوم</h2>
      </div>

      <!-- المحتوى -->
      <div style="padding: 30px; color: #4a1e0a; font-size: 18px; line-height: 1.8;">
        <p style="margin: 0 0 18px; font-size: 19px;">مرحبًا <strong>${username}</strong>,</p>
        <p style="margin: 0 0 22px; font-size: 17px; color: #4a1e0a;"><strong>${message}</strong></p>

        <p style="margin: 0 0 28px; font-size: 17px;">
          <strong>مواعيد العمل</strong><br/>
            من ١٢ م ل ١٢ ص ماعدا الجمعة
        </p>

        <p style="margin: 0 0 18px; font-size: 17px;">
          إذا كان لديك أي استفسارات، لا تتردد في 
          <a href="${CLIENT_URL}/" style="color: #ff4b00; font-weight: bold; text-decoration: none;">التواصل معنا</a>.
        </p>

        <p style="margin: 0 0 28px; font-size: 17px;">
          يمكنك متابعة متجرك من خلال هذا الرابط: 
          <a href="${CLIENT_URL}/admin" style="color: #ff4b00; font-weight: bold; text-decoration: none;">اضغط هنا</a>.
        </p>

      </div>

      <!-- الفوتر -->
      <div style="background-color: #ffeae2; padding: 20px; text-align: center; font-size: 15px; color: #4a1e0a;">
        <p style="margin: 0 0 6px; font-size: 16px;">شكرًا لاختيارك <strong>همسات هوم</strong></p>
        <p style="margin: 0; font-size: 15px;">فريق دعم همسات هوم</p>
      </div>
    </div>
  `;
};

exports.vendorWelcomeEmailTemplate = (username) => {
  return `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 650px; margin: auto; background-color: #fff7ef; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #ffeae2;">

      <!-- الهيدر -->
      <div style="background-color: #ffeae2; padding: 25px; text-align: center;">
        <img src="https://raw.githubusercontent.com/Mo-metwally/Images/refs/heads/metwally/HamasatLogo2.png" alt="Hamsat Home Logo" style="max-width: 250px; margin-bottom: 12px;" />
        <h2 style="margin: 0; font-size: 26px; font-weight: bold; color: #4a1e0a;">تأكيد إنشاء الحساب - همسات هوم</h2>
      </div>

      <!-- المحتوى -->
      <div style="padding: 30px; color: #4a1e0a; font-size: 18px; line-height: 1.8;">
        <p style="margin: 0 0 18px; font-size: 19px;">مرحباً <strong>${username}</strong>،</p>
        
        <p style="margin: 0 0 22px; font-size: 17px; color: #4a1e0a;">
          <strong>تم إنشاء الحساب بنجاح.</strong><br>
          حسابك الآن قيد المراجعة، وسيتم التواصل معك في أقرب وقت من قبل فريق همسات هوم.
        </p>

        <p style="margin: 0 0 28px; font-size: 17px;">
          أو يمكنك التواصل معنا على الرقم: <span style="direction: ltr; display: inline-block;">+20 102 638 8831</span>
        </p>
      </div>

      <!-- الفوتر -->
      <div style="background-color: #ffeae2; padding: 20px; text-align: center; font-size: 15px; color: #4a1e0a;">
        <p style="margin: 0 0 6px; font-size: 16px;">شكرًا لاختيارك <strong>همسات هوم</strong></p>
        <p style="margin: 0; font-size: 15px;">فريق دعم همسات هوم</p>
      </div>
    </div>
  `;
};
