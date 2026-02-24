import express from "express"
import * as authservice from "./auth.service.js"


const authRouter = express.Router()


authRouter.post("/sendSignupOtp", async (req, res, next) => {
    try {
        const result = await authservice.sendSignupOtp(req.body);
        return res.status(200).json({ mes: "done", result });
    } catch (error) {
        next(error);
    }
});

authRouter.post("/signUp", async (req, res, next) => {
    try {
        const result = await authservice.signUp(req.body);
        return res.status(201).json({ mes: "done", result });
    } catch (error) {
        next(error);
    }
});


authRouter.post("/logIn", async (req, res, next) => {
    // console.log();
    
    try {
        const result = await authservice.login(req.body,req.protocol,req.host)
        return res.status(201).json({ mes: "done", result })

    } catch (error) {
        next(error)

    }
})



export default authRouter

