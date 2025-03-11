import express from 'express';
import dotenv from 'dotenv';
import db from './config/db.js';
import cors from 'cors';
import cookiePareser from "cookie-parser"

import authRouter from './routes/authRouter.js';

//Load from .env
dotenv.config({ path: './.env' });

const app = express();

const allowedOrigins = [
    'https://client-production-40ad.up.railway.app',
    'http://localhost:5173',
]

app.use(cors({
    origin: allowedOrigins,
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