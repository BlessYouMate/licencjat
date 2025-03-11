import db from "../config/db.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config({ path: "./.env" });

const register = async (req, res) => {

    const { login, password } = req.body;

    if( !login || !password ){
        return res.status(400).json({ error: "login and password required" })
    }

    try{
        const existedUser = await db.query("SELECT * FROM users WHERE login = $1", 
            [login]
        );
        if(existedUser.rows.length > 0){
            return res.status(400).json({error: "username already taken"});
        }
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = await db.query("INSERT INTO users (login, password) VALUES ($1, $2) RETURNING *", 
            [login, hashedPassword]
        );

        res.status(201).json({message: "user successfully created!", user: newUser.rows[0] });
    }
    catch(err){
        console.log("registration error ", err);
        res.status(500).json({error: "server error"});
    }
}


const login = async (req, res) => {
    const {login, password} = req.body;

    if(!login || !password){
        return res.status(400).json({error: 'Login i hasło są wymagane'})
    }

    try{
        const userQuery = await db.query("SELECT * FROM users WHERE login = $1",
             [login]
            );
        if(userQuery.rows.length < 1){
            return res.status(400).json({error: "Nieprawidłowy login lub hasło"});
        }
        const user = userQuery.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if(!passwordMatch){
            return res.status(400).json({error: "Nieprawidłowy login lub hasło"});
        }

        const token = jwt.sign(
            {userId: user.id, login: user.login },
            process.env.JWT_SECRET,
            {expiresIn: "30m"}
        )

        res.cookie("jwt", token, {
            httpOnly: true,
            secure: true,
            samSite: "Strict",
            maxAge: 30 * 60 * 1000
        });


        res.status(201).json({message: "Udało sie zalogować!" });
    }
    catch(err) {
        console.error("login error:", err.message || err);  
        res.status(500).json({ error: "Błąd serwera" });
    }
}

const logout = async (req, res) => {

    try{
        res.clearCookie("jwt");
        res.status(200).json({message: "Wylogowano"})
    }
    catch(err){
        console.log("logout error: ", err);
        res.status(500).json({error: "Błąd serwera"});
    }
}

export {register, login, logout};