import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,       // sandbox.smtp.mailtrap.io
  port: Number(process.env.SMTP_PORT || 2525),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,     // mailtrap username
    pass: process.env.SMTP_PASS,     // mailtrap password
  },
});

export async function sendMail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM;  
  return transporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });
}

export default transporter;
