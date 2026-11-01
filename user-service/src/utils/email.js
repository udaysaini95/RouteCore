const sgMail = require('@sendgrid/mail');
const { config } = require('../config');
const logger = require('../config/logger');

// Set SendGrid API Key
sgMail.setApiKey(config.SENDGRID_API_KEY);

/**
 * Send 6-digit OTP verification email
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 */
const sendOtpEmail = async (email, otp) => {
    const msg = {
        to: email,
        from: config.SENDGRID_FROM_EMAIL, // Must match your verified sender in SendGrid
        subject: 'Your IRCTC Verification OTP Code',
        text: `Your OTP for IRCTC account registration is: ${otp}. This code is valid for 5 minutes. Do not share it with anyone.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #0b3c5d; text-align: center;">IRCTC Account Verification</h2>
                <p>Hello,</p>
                <p>Thank you for initiating your registration with IRCTC. Please use the following One-Time Password (OTP) to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #d9534f; background: #f8f9fa; padding: 12px 24px; border-radius: 6px; border: 1px dashed #d9534f;">
                        ${otp}
                    </span>
                </div>
                <p style="color: #666; font-size: 14px;">This OTP is valid for <strong>5 minutes</strong>. If you did not request this code, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999; text-align: center;">IRCTC Railway Reservation System &copy; 2026</p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        logger.info(`[Email Service] OTP successfully sent to ${email}`);
        return true;
    } catch (error) {
        logger.error(`[Email Service] Error sending OTP to ${email}:`, error?.response?.body || error.message);
        throw error;
    }
};

/**
 * Send welcome/confirmation email upon successful verification
 * @param {object} meta - User metadata { firstName, lastName, email }
 */
const verifyOtpEmail = async (meta) => {
    const msg = {
        to: meta.email,
        from: config.SENDGRID_FROM_EMAIL,
        subject: 'Welcome to IRCTC — Registration Successful',
        text: `Hello ${meta.firstName}, your IRCTC account has been successfully verified and created.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #28a745; text-align: center;">Account Verified Successfully!</h2>
                <p>Dear <strong>${meta.firstName} ${meta.lastName || ''}</strong>,</p>
                <p>Congratulations! Your IRCTC account associated with <strong>${meta.email}</strong> has been created and verified successfully.</p>
                <p>You can now log in and book your tickets.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #999; text-align: center;">IRCTC Railway Reservation System &copy; 2026</p>
            </div>
        `,
    };

    try {
        await sgMail.send(msg);
        logger.info(`[Email Service] Welcome email successfully sent to ${meta.email}`);
        return true;
    } catch (error) {
        // Welcome email failure shouldn't necessarily crash registration, so we log it
        logger.error(`[Email Service] Error sending welcome email to ${meta.email}:`, error?.response?.body || error.message);
        return false;
    }
};

module.exports = {
    sendOtpEmail,
    verifyOtpEmail,
};