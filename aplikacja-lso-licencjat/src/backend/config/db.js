import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const { Pool } = pkg;

console.log("Database URL:", process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Zmienna z Railway
    ssl: {
        rejectUnauthorized: false, // Railway wymaga SSL
    },
});



const createTables = async () => {
    try {
        const CreateUserTable = `
        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(16) UNIQUE NOT NULL,
        password VARCHAR(128) NOT NULL
        );
        `;

        await pool.query(CreateUserTable);
        console.log("User table successfully created or previously existed");
    } catch (err) {
        console.log("Error creating tables:", err);
    }
};

pool.connect()
    .then(() => {
        console.log("Connected to PostgreSQL database");
        createTables();
    })
    .catch(err => console.error("Database connection error:", err));

export default pool;
