const CLIENT_URL = process.env.CLIENT_URL;

exports.sendOrderCodeTemplate = (orderCode, username) => {
  return `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 650px; margin: auto; background-color: #fff7ef; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #ffeae2;">

      <!-- الهيدر -->
      <div style="background-color: #ffeae2; padding: 25px; text-align: center;">
        <img src="https://raw.githubusercontent.com/Mo-metwally/Images/refs/heads/metwally/HamasatLogo2.png" alt="Hamsat Home Logo" style="max-width: 250px; margin-bottom: 12px;" />
        <h2 style="margin: 0; font-size: 26px; font-weight: bold; color: #4a1e0a;">رمز الاستعلام عن الطلب</h2>
      </div>

      <!-- المحتوى -->
      <div style="padding: 30px; color: #4a1e0a; font-size: 18px; line-height: 1.8;">
        <p style="margin: 0 0 18px; font-size: 19px;">مرحبًا <strong>${username}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 17px;">تم استلام طلبك بنجاح. سيتم التواصل معك في أقرب وقت لتأكيد الطلب.</p>
        
        <p style="margin: 0 0 15px; font-size: 18px; font-weight: bold;">رمز الاستعلام عن طلبك هو:</p>
        <div style="text-align: center; margin: 25px 0;">
          <p style="font-size: 28px; font-weight: bold; color: #ff4b00; letter-spacing: 2px;">${orderCode}</p>
        </div>


        <p style="margin: 0 0 28px; font-size: 17px;">
          <strong>مواعيد العمل</strong>
            من ١٢ م ل ١٢ ص ماعدا الجمعة
        </p>
        
        <p style="margin: 0 0 18px; font-size: 17px;">
          إذا كان لديك أي استفسارات، لا تتردد في 
          <a href="${CLIENT_URL}/" style="color: #ff4b00; font-weight: bold; text-decoration: none;">التواصل معنا</a>.
        </p>

        <p style="margin: 0 0 28px; font-size: 17px;">
          يمكنك متابعة طلبك من خلال هذا الرابط: 
          <a href="${CLIENT_URL}/followup" style="color: #ff4b00; font-weight: bold; text-decoration: none;">اضغط هنا</a>.
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
