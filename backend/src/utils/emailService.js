import nodemailer from 'nodemailer';

// Create a transporter using SMTP
// Assumes environment variables SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS are set
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send an OTP email
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
export const sendOtpEmail = async (to, otp) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('⚠️ SMTP credentials not configured. Skipping email sending, but generating OTP: ', otp);
            return true; // Return true in dev if no credentials, so flow can continue
        }

        const mailOptions = {
            from: `"Assam University Portal" <${process.env.SMTP_USER}>`,
            to,
            subject: 'Your Verification Code',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #1e4aba; text-align: center;">Assam University Student-Alumni Portal</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">Your verification code for registration is:</p>
          <div style="background-color: #f4f7f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e4aba;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">This code will expire in 5 minutes.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ OTP Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        return false;
    }
};
