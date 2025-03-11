import { Router } from "express";

import { register, login, logout } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);

authRouter.get("/", authMiddleware, (req, res) => {
    res.status(200).json({ message: "Welcome to the protected home page!" });
});

authRouter.post("/logout", logout);


export default authRouter;