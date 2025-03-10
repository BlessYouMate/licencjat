import express from 'express';
import dotenv from 'dotenv';
import db from './config/db.js';
import cors from 'cors';
import cookiePareser from "cookie-parser"

import authRouter from './routes/authRouter.js';

//Load from .env
dotenv.config({ path: './.env' });

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    credentials: true,
}))
app.use(express.json());
app.use(cookiePareser());

app.use(authRouter)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});