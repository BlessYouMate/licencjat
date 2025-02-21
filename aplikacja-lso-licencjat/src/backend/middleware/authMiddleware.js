import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config({ path: "./.env" });

const authMiddleware = (req, res, next) =>{

    const token = req.cookies?.jwt;

    if(!token){
        return res.status(401).json({ error: "access denied. Token not provided" })
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(err){
        console.log("server auth error ", err);
        return res.status(403).json({error: "invalid token"})
    }

};

export { authMiddleware };