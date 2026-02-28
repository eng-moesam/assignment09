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


export async function sendOtpEmail(to, otp) {
    const mailOptions = {
        from: `"Saraha" <${SMTP_USER}>`,
        to,
        subject: " Saraha",
        text: `otp ${otp}`,
        html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 400px;">
                <h2Saraha</h2>
               
                <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
                <p style="color: #666;">expired after 10 min</p>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
}
