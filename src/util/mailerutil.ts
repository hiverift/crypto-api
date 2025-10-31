const nodemailer = require('nodemailer');

export const generateOTP = () => {
  return Math.floor(Math.random() * 900000) + 100000;
};

export const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER, // Replace with your email
      pass: process.env.EMAIL_PASS, // Replace with your email password or app password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};
