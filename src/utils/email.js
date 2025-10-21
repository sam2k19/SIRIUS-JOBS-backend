const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendMail(to, subject, html) {
  if (!process.env.SMTP_HOST) {
    console.log('Email disabled (no SMTP configured). Would send to', to, subject);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@siriusjobs.ng',
    to,
    subject,
    html
  });
}

module.exports = { sendMail };

