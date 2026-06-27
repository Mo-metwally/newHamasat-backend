// Got it — you want a **free** and **reliable** way to send a WhatsApp message when an order is created, with a professional message format containing order details.

// Here’s the key points to solve:

// 1. **Free sending method**
//    Official WhatsApp Business API requires Meta approval and usually isn’t free.
//    However, you can use **WhatsApp Web automation via `whatsapp-web.js`** (Node.js library) which runs a WhatsApp Web session using your phone’s number. This bypasses API costs but requires keeping a session active.

// 2. **Professional order message**
//    The message should be clear, polite, and contain:

//    * Order code
//    * Customer name
//    * List of products (with qty, color, size)
//    * Total price
//    * Payment method
//    * Thank-you note

// ---

// ## **1. Install Dependencies**

// ```bash
// npm install whatsapp-web.js qrcode-terminal
// ```

// ---

// ## **2. Create a WhatsApp Service**

// `services/whatsappService.js`

// ```js
// const { Client, LocalAuth } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');

// const client = new Client({
//   authStrategy: new LocalAuth(),
// });

// client.on('qr', qr => {
//   console.log('Scan this QR code with your WhatsApp:');
//   qrcode.generate(qr, { small: true });
// });

// client.on('ready', () => {
//   console.log('✅ WhatsApp client is ready!');
// });

// client.initialize();

// async function sendWhatsAppMessage(phoneNumber, message) {
//   try {
//     const formattedNumber = phoneNumber.replace(/\D/g, '') + '@c.us'; // E.164 format without "+"
//     await client.sendMessage(formattedNumber, message);
//     console.log(`📩 WhatsApp message sent to ${phoneNumber}`);
//   } catch (err) {
//     console.error('❌ Failed to send WhatsApp message:', err);
//   }
// }

// module.exports = { sendWhatsAppMessage };
// ```

// ---

// ## **3. Create a Professional Message Template**

// `templates/orderWhatsAppTemplate.js`

// ```js
// function orderWhatsAppTemplate(order, products, lang = 'ar') {
//   if (lang === 'ar') {
//     return `📦 *تأكيد طلبك*  
// مرحبًا ${order.username}، شكرًا لطلبك من متجرنا ❤️  
// رقم الطلب: *${order.orderCode}*

// 🛒 تفاصيل الطلب:
// ${products.map(
//   p => `- ${p.name} × ${p.quantity} (اللون: ${p.color || 'غير محدد'}, المقاس: ${p.size || 'غير محدد'})`
// ).join('\n')}

// 💰 المجموع الكلي: ${order.total} ${order.currency || 'ج.م'}  
// 🔹 طريقة الدفع: ${order.paymentMethod || 'عند الاستلام'}  

// 📞 سيتم التواصل معك قريبًا لتأكيد الشحن.  
// شكرًا لثقتك بنا! 🌟`;
//   }

//   // English fallback
//   return `📦 *Order Confirmation*  
// Hello ${order.username}, thank you for your order ❤️  
// Order Code: *${order.orderCode}*

// 🛒 Order Details:
// ${products.map(
//   p => `- ${p.name} × ${p.quantity} (Color: ${p.color || 'N/A'}, Size: ${p.size || 'N/A'})`
// ).join('\n')}

// 💰 Total: ${order.total} ${order.currency || 'EGP'}  
// 🔹 Payment Method: ${order.paymentMethod || 'Cash on Delivery'}  

// 📞 We will contact you soon to confirm shipping.  
// Thank you for shopping with us! 🌟`;
// }

// module.exports = { orderWhatsAppTemplate };
// ```

// ---

// ## **4. Integrate into `createOrderFromCart`**

// In your `CartController.createOrderFromCart`, after sending the email, add:

// ```js
// const { sendWhatsAppMessage } = require('../services/whatsappService');
// const { orderWhatsAppTemplate } = require('../templates/orderWhatsAppTemplate');

// // After email sending:
// const productsDetails = products.map(product => ({
//   name: product.name,
//   quantity: product.CartProducts.quantity,
//   color: product.CartProducts.color,
//   size: product.CartProducts.size
// }));

// const whatsappMsg = orderWhatsAppTemplate(
//   { 
//     username: orderDetails.username,
//     orderCode,
//     total,
//     currency: 'ج.م',
//     paymentMethod: orderDetails.paymentMethod || 'عند الاستلام'
//   },
//   productsDetails,
//   req.query.lang || 'ar'
// );

// await sendWhatsAppMessage(formattedPhone, whatsappMsg);
// ```

// ---

// ## **5. How it works**

// * First run will show a QR code in the terminal — scan with your WhatsApp mobile app (like logging into WhatsApp Web).
// * Session stays stored, so you won’t need to scan every time.
// * When an order is placed, it sends a clean WhatsApp message to the customer.

// ---

// If you want, I can also **add automatic product table formatting** in WhatsApp so it looks like a nice receipt instead of a plain list.
// That would make it *very* professional.

// Do you want me to make that receipt-style WhatsApp message?
