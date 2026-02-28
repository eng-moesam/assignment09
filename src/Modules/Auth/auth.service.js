import { compare, hash } from "bcrypt";
import userModel from "../../DB/Models/User.Model.js";
import otpModel from "../../DB/Models/Otp.Model.js";
import * as dbRepo from "../../DB/db.repostory.js"
import { ENCRPTION_KEY, OTP_EXPIRY_MINUTES, SALT_ROUNDS, TOKEN_SIGNATURE_ADMIN, TOKEN_SIGNATURE_ADMIN_Refresh, TOKEN_SIGNATURE_USER, TOKEN_SIGNATURE_USER_Refresh, WEB_CLIENT_ID } from "../../../config/config.service.js";
import { compareOperation, hashOperation } from "../../Common/Security/hash.js";
import { sendOtpEmail } from "../../Common/Services/email.service.js";
import CryptoJS from "crypto-js";
import jwt from 'jsonwebtoken';
import { providerEnum, RoleEnum } from "../../Common/Enums/user.enums.js";
import { tokenType } from "../../Common/Enums/token.enums.js";
import { generateToken, genratesignToken, getSignature } from "../../Common/Security/token.js";
import {OAuth2Client} from  'google-auth-library';

// Encrypt
// var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123').toString();

// Decrypt
// var bytes  = CryptoJS.AES.decrypt(ciphertext, 'secret key 123');
// var originalText = bytes.toString(CryptoJS.enc.Utf8);

// console.log(originalText); 
 
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


    await dbRepo.findOneAndDelete({ model: otpModel,
       filters: { email: normalizedEmail } });
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



 
 
async function verfiyGoogleTokenId(tokenId){
const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: WEB_CLIENT_ID,  // Specify the WEB_CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
  });
  const payload = ticket.getPayload();
  // This ID is unique to each Google Account, making it suitable for use as a primary key
  // during account lookup. Email is not a good choice because it can be changed by the user.
  // const userid = payload['sub'];
  // If the request specified a Google Workspace domain:
  // const domain = payload['hd'];
    return  payload
 }

export async function loginWithGmail(idToken) {

  const payloadToken = await verfiyGoogleTokenId(idToken)
  if(!payloadToken.email_verified){
    throw new Error("email not varfied",{cause:{statuscode:403}})
  }

  const user = await dbRepo.findOne({model:userModel,filters:{email:payloadToken.email,provider:providerEnum.Google}})

  if(!user){
    
    return signupWithGmail({idToken})


  }
  
  const {acsses_token,refresh_token} = genratesignToken(user)

  return {acsses_token,refresh_token}
  
}

export async function signupWithGmail(bodyData) {

  const {idToken} = bodyData

  const payloadGoogleToken = await verfiyGoogleTokenId(idToken)



  if(!payloadGoogleToken.email_verified){
    throw new Error("email not varfied",{cause:{statuscode:403}})
  }

  const user = await dbRepo.findOne({model:userModel,filters:{email:payloadGoogleToken.email}})

  if(user){
    if(user.provider==providerEnum.System){
    throw new Error(" acount already exsit sign up with password and email")
  }
  return {status:200 ,loginResult: await loginWithGmail(idToken)}//login with google
  }

 const newUser= await dbRepo.create({model:userModel,data:{
    email:payloadGoogleToken.email,
    userName: payloadGoogleToken.name,
    profilePicture:payloadGoogleToken.picture,
    confrimEmail:true,
    provider:providerEnum.Google
  }})
     const {acsses_token,refresh_token} = genratesignToken(newUser)

  
  
  return {status:201,tokens : {acsses_token,refresh_token} }
  
 
  
}








