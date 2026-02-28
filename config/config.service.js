import dotenv from "dotenv"
import path from 'path';
export const NODE_ENV=process.env.NODE_ENV

const envpath={
    dev: path.resolve("./config/.env.dev"),
    prod:path.resolve("./config/.env.prod")
}

dotenv.config({path:envpath[NODE_ENV ||"dev"]})

export const PORT =process.env.port || 3000;
export const DB_URI =process.env.DB_URI || "";
export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS) ||10;
export const ENCRPTION_KEY= process.env.ENCRPTION_KEY||""
export const TOKEN_SIGNATURE_USER= process.env.TOKEN_SIGNATURE_USER||""
export const TOKEN_SIGNATURE_ADMIN= process.env.TOKEN_SIGNATURE_ADMIN||""
export const TOKEN_SIGNATURE_USER_Refresh= process.env.TOKEN_SIGNATURE_USER_Refresh||""
export const TOKEN_SIGNATURE_ADMIN_Refresh= process.env.TOKEN_SIGNATURE_ADMIN_Refresh||""

export const WEB_CLIENT_ID = process.env.WEB_CLIENT_ID||""


export const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com"
export const SMTP_PORT = parseInt(process.env.SMTP_PORT) || 587
export const SMTP_USER = process.env.SMTP_USER || ""
export const SMTP_PASS = process.env.SMTP_PASS || ""
export const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10

