import mongoose from "mongoose";
import { GenderEnum, RoleEnum } from "../../Common/Enums/user.enums.js";

const userSchema = new mongoose.Schema({
    userName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    phone:String
    ,
    DOB:{
        type:Date
    },
    role:{
        type:String,
        enum:Object.values(RoleEnum),
        default:RoleEnum.User

    }
    ,
    gender:{
        type:String,
        enum:Object.values(GenderEnum),
        default:GenderEnum.Male
    },
    confrimEmail:{
        type:Boolean,
        default:true
    }

},{
    timestamps:true
})


const userModel = mongoose.model("user", userSchema)

export default userModel;