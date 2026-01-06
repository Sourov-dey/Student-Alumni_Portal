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

console.log('SMTP host:', process.env.SMTP_HOST, 'SMTP user:', process.env.SMTP_USER);
const maskedUser = process.env.SMTP_USER ? process.env.SMTP_USER.replace(/.(?=.{4})/g, '*') : undefined;

console.log('SMTP config in use:', { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, user: maskedUser });
// optionally verify connection
transporter.verify().then(()=> console.log('SMTP verify: OK')).catch(err => console.error('SMTP verify failed:', err.message));
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
