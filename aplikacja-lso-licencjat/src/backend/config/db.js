import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const { Pool } = pkg

const pool = new Pool({
    user: process.env.DB_USER,          // Twój użytkownik PostgreSQL (np. postgres)
    host: process.env.DB_HOST,          // Zwykle localhost
    database: process.env.DB_NAME,      // Nazwa bazy danych (np. lso_db)
    password: process.env.DB_PASSWORD,  // Hasło do bazy
    port: process.env.DB_PORT,  // Port (domyślnie 5432)
});

const createTables = async () => {
    try{
        const CreateUserTable = 
        `
        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        login VARCHAR(16) UNIQUE NOT NULL,
        password VARCHAR(128) NOT NULL
        );
    `;

    await pool.query(CreateUserTable);
    console.log("User table successfully created or previously existed")
    }
    catch(err){
        console.log("error creating tables", err)
    }
}

pool.connect()
  .then(() => console.log("Połączono z bazą danych PostgreSQL"))
  .catch(err => console.error("Błąd połączenia z bazą:", err));

createTables();

export default pool