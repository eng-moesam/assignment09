import nodemailer from "nodemailer";
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from "../../../config/config.service.js";

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

/**
 * Send OTP email to user
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<object>} nodemailer result
 */
export async function sendOtpEmail(to, otp) {
    const mailOptions = {
        from: `"Saraha" <${SMTP_USER}>`,
        to,
        subject: "كود التحقق - Saraha",
        text: `كود التحقق الخاص بك: ${otp}\nصالح لمدة 10 دقائق.`,
        html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 400px;">
                <h2>كود التحقق - Saraha</h2>
                <p>استخدم الكود التالي لإكمال التسجيل:</p>
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
                <p style="color: #666;">صالح لمدة 10 دقائق.</p>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
}
