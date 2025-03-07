import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const { Pool } = pkg

const connectionString = "postgresql://postgres:ZDwgSgYVOZOCyeTUcPUgDIcrIxGYtHJr@postgres.railway.internal:5432/railway"

const pool = new Pool({
    connectionString
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