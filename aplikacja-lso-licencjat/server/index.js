import "./config/db.js";
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookiePareser from "cookie-parser"
import authRouter from './routes/authRouter.js';
import eventRouter from './routes/eventsRouter.js';
import scheduleRouter from './routes/schedulerRouter.js';
import testOfAlgorithmsRouter from './routes/testOfAlgorithmsRouter.js';

import algorithmsRouter from './services/algorithms.js';

import { authMiddleware } from './middleware/authMiddleware.js';

// Wczytuje dane z pliku .env
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
app.use(eventRouter)
app.use(scheduleRouter)
app.use(testOfAlgorithmsRouter)

app.use('/algorithms', algorithmsRouter);

app.use(authMiddleware)


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});