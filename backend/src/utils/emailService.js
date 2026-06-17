import nodemailer from 'nodemailer';

// Lazy transporter — created on first use so env vars are guaranteed to be loaded
let transporter = null;
function getTransporter() {
    if (!transporter) {
        console.log('📧 Creating SMTP transporter with:', {
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: process.env.SMTP_PORT || '587',
            user: process.env.SMTP_USER ? '✅ set' : '❌ missing',
            pass: process.env.SMTP_PASS ? '✅ set' : '❌ missing',
        });
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    return transporter;
}

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
            from: process.env.SMTP_FROM || `"Assam University Portal" <${process.env.SMTP_USER}>`,
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

        const smtp = getTransporter();
        const info = await smtp.sendMail(mailOptions);
        console.log('✅ OTP Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending OTP email:', error.message);
        console.error('   Full error:', error);
        return false;
    }
};

/**
 * Send a password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Full password reset URL
 */
export const sendPasswordResetEmail = async (to, resetUrl) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn('⚠️ SMTP credentials not configured. Reset link (dev only):', resetUrl);
            return true;
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || `"Assam University Portal" <${process.env.SMTP_USER}>`,
            to,
            subject: 'Password Reset Request',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #4f46e5; text-align: center;">Assam University Student-Alumni Portal</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">We received a request to reset the password for your account.</p>
          <p style="font-size: 14px; color: #555;">Click the button below to set a new password. This link will expire in <strong>15 minutes</strong>.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; letter-spacing: 0.3px;">Reset My Password</a>
          </div>
          <p style="font-size: 13px; color: #888;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 13px; color: #4f46e5; word-break: break-all;">${resetUrl}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 13px; color: #aaa; text-align: center;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
      `,
        };

        const smtp = getTransporter();
        const info = await smtp.sendMail(mailOptions);
        console.log('✅ Password reset email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending password reset email:', error.message);
        return false;
    }
};
