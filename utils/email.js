const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: `همسات هوم <${process.env.USER_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML support
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
