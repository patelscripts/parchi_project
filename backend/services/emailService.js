const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

async function sendResetEmail(email, resetUrl) {
  await transporter.sendMail({
    from: `Parchi <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your Parchi password',
    html: `<p>Click the link below to reset your password. This link expires in 30 minutes.</p>
           <a href="${resetUrl}">${resetUrl}</a>`
  });
}

module.exports = { sendResetEmail };