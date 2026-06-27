const CLIENT_URL = process.env.CLIENT_URL;

exports.invoiceEmailTemplate = (username, invoiceUrl) => {
  return `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 650px; margin: auto; background-color: #fff7ef; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #ffeae2;">

      <!-- الهيدر -->
      <div style="background-color: #ffeae2; padding: 25px; text-align: center;">
        <img src="https://raw.githubusercontent.com/Mo-metwally/Images/refs/heads/metwally/HamasatLogo2.png" alt="Hamsat Home Logo" style="max-width: 250px; margin-bottom: 12px;" />
        <h2 style="margin: 0; font-size: 26px; font-weight: bold; color: #4a1e0a;">فاتورتك جاهزة - همسات هوم</h2>
      </div>

      <!-- المحتوى -->
      <div style="padding: 30px; color: #4a1e0a; font-size: 18px; line-height: 1.8;">
        <p style="margin: 0 0 18px; font-size: 19px;">مرحبًا <strong>${username}</strong>,</p>
        <p style="margin: 0 0 22px; font-size: 17px;">
          نشكر لك طلبك. يمكنك الاطلاع على فاتورتك وتنزيلها من خلال الرابط التالي:
        </p>

        <p style="margin: 25px 0; text-align: center;">
          <a href="${invoiceUrl}" 
             style="display: inline-block; padding: 14px 28px; background-color: #ff4b00;
                    color: #fff; text-decoration: none; border-radius: 8px; font-size: 17px; font-weight: bold;">
            عرض الفاتورة
          </a>
        </p>

        <p style="margin: 0 0 28px; font-size: 17px;">
          إذا كان لديك أي استفسارات، لا تتردد في 
          <a href="${CLIENT_URL}/contact" style="color: #ff4b00; font-weight: bold; text-decoration: none;">التواصل معنا</a>.
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
