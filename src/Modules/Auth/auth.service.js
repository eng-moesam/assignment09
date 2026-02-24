import { compare, hash } from "bcrypt";
import userModel from "../../DB/Models/User.Model.js";
import otpModel from "../../DB/Models/Otp.Model.js";
import * as dbRepo from "../../DB/db.repostory.js"
import { ENCRPTION_KEY, OTP_EXPIRY_MINUTES, SALT_ROUNDS, TOKEN_SIGNATURE_ADMIN, TOKEN_SIGNATURE_ADMIN_Refresh, TOKEN_SIGNATURE_USER, TOKEN_SIGNATURE_USER_Refresh } from "../../../config/config.service.js";
import { compareOperation, hashOperation } from "../../Common/Security/hash.js";
import { sendOtpEmail } from "../../Common/Services/email.service.js";
import CryptoJS from "crypto-js";
import jwt from 'jsonwebtoken';
import { RoleEnum } from "../../Common/Enums/user.enums.js";
import { tokenType } from "../../Common/Enums/token.enums.js";
import { generateToken, getSignature } from "../../Common/Security/token.js";

// Encrypt
// var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123').toString();

// Decrypt
// var bytes  = CryptoJS.AES.decrypt(ciphertext, 'secret key 123');
// var originalText = bytes.toString(CryptoJS.enc.Utf8);

// console.log(originalText); 
 
/** Generate 6-digit OTP */
function generateOtpCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendSignupOtp(body) {
    const { email } = body;
    if (!email || !String(email).trim()) {
        throw new Error("email is required", { cause: { statuscode: 400 } });
    }
    const normalizedEmail = String(email).toLowerCase().trim();
    const userExist = await dbRepo.findOne({ model: userModel, filters: { email: normalizedEmail } });
    if (userExist) {
        throw new Error("email already exist", { cause: { statuscode: 409 } });
    }
    // Remove any previous OTP for this email
    await dbRepo.findOneAndDelete({ model: otpModel, filters: { email: normalizedEmail } });
    const otp = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await dbRepo.create({
        model: otpModel,
        data: { email: normalizedEmail, otp, expiresAt }
    });

    await sendOtpEmail(normalizedEmail, otp);
    return { message: "OTP sent to email", email: normalizedEmail };
}

 export async function signUp(bodyData) {

    const { email, otp } = bodyData;
    const normalizedEmail = email ? String(email).toLowerCase().trim() : "";
    if (!normalizedEmail) {
        throw new Error("email is required", { cause: { statuscode: 400 } });
    }
    if (!otp || String(otp).length !== 6) {
        throw new Error("valid 6-digit OTP is required", { cause: { statuscode: 400 } });
    }

    const otpRecord = await dbRepo.findOne({ model: otpModel, filters: { email: normalizedEmail } });
    if (!otpRecord) {
        throw new Error("OTP not found or expired. Request a new OTP.", { cause: { statuscode: 400 } });
    }
    if (otpRecord.otp !== String(otp).trim()) {
        throw new Error("Invalid OTP", { cause: { statuscode: 400 } });
    }
    if (new Date() > new Date(otpRecord.expiresAt)) {
        await dbRepo.findOneAndDelete({ model: otpModel, filters: { email: normalizedEmail } });
        throw new Error("OTP expired. Request a new OTP.", { cause: { statuscode: 400 } });
    }

    const emailexist = await dbRepo.findOne({ model: userModel, filters: { email: normalizedEmail } });
    if (emailexist) {
        throw new Error("email already exist", { cause: { statuscode: 409 } });
    }

    bodyData.email = normalizedEmail;
    bodyData.password = await hashOperation({ plaintext: bodyData.password, round: SALT_ROUNDS });
    bodyData.phone = CryptoJS.AES.encrypt(bodyData.phone, ENCRPTION_KEY).toString();
    delete bodyData.otp;

    const result = await dbRepo.create({ model: userModel, data: bodyData });
    await dbRepo.findOneAndDelete({ model: otpModel, filters: { email: normalizedEmail } });
    return result;
 }

 export async function login(bodyData,protocol,host) {
   
     const{email,password}=bodyData
    const user= await dbRepo.findOne({model:userModel,filters:{email}})

    if(!user){
        throw new Error("invalid info",{cause:{statuscode:404}})

    }
    const ispassword= await compareOperation({plaintext: password,hashedvalue: user.password})
    const bytes  = CryptoJS.AES.decrypt(user.phone, ENCRPTION_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    user.phone=originalText

    if(!ispassword){
       throw new Error("invalid info",{cause:{statuscode:404}})
    }
   
    
    const { accessSignature, refreshSignature } = getSignature(user.role)

      const acsses_token = generateToken({payload:{ sub:user._id},signature:accessSignature,options:{
        audience:[user.role,tokenType.access] ,
        expiresIn:60*15
      }})

       const refresh_token =generateToken({payload:{ sub:user._id},signature:refreshSignature,options:{
        audience:[user.role,tokenType.refresh] ,
        expiresIn:"1y"
      }})
    
    
        

     return  {acsses_token,refresh_token} 
    
 }





