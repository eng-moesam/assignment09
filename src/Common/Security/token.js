import { TOKEN_SIGNATURE_ADMIN, TOKEN_SIGNATURE_ADMIN_Refresh, TOKEN_SIGNATURE_USER, TOKEN_SIGNATURE_USER_Refresh } from "../../../config/config.service.js";
import { RoleEnum } from "../Enums/user.enums.js";
import jwt from 'jsonwebtoken';
export function getSignature(role = RoleEnum.User) {

         let refreshSignature=""
         let accessSignature=""
         switch (role) {
          case RoleEnum.User:
            refreshSignature=TOKEN_SIGNATURE_USER_Refresh 
            accessSignature=TOKEN_SIGNATURE_USER
            break;
          case RoleEnum.Admin:
            refreshSignature=TOKEN_SIGNATURE_ADMIN_Refresh 
            accessSignature=TOKEN_SIGNATURE_ADMIN
            break;
          default:
      throw new Error("Invalid role for token signature");
          
         }
    return {accessSignature,refreshSignature}
}

export function generateToken({payload={},signature,options={}}){
    return jwt.sign(payload,signature,options); 
}

export function verfiyToken({token,signature}){
    return jwt.verify(token,signature)
}
export function decodedToken(token){
    return jwt.decode(token)
}