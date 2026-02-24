import express from "express"
import authRouter from "./Modules/Auth/auth.controller.js";
import { NODE_ENV, PORT, TOKEN_SIGNATURE_ADMIN, TOKEN_SIGNATURE_ADMIN_Refresh, TOKEN_SIGNATURE_USER, TOKEN_SIGNATURE_USER_Refresh } from "../config/config.service.js";
import connectDB from "./DB/connection.js";
import { globalErrHandlling } from "./Common/Response/response.js";
import userRouter from "./Modules/User/user.controller.js";
// import { globalErrHandlling } from "./Common/Response/response.js";
// import dotenv from 'dotenv'
// import path from "path";
// dotenv.config({path:path.resolve("./config/.env.dev")})

async function bootstrap(){
  
const app =express()
const port = PORT;
await connectDB()
app.use(express.json())
app.use("/auth",authRouter)
app.use("/user",userRouter)


app.use(globalErrHandlling)

app.listen(port,()=>{
    console.log(`sever is running ${port}`);
})
   
}
export default bootstrap;
