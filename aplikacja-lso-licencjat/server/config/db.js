import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const { Pool } = pkg

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV == 'production' ? { rejectUnauthorized: false } : false
});

const createTables = async () => {
    try{
        const CreateUserTable = 
        `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                login VARCHAR(16) UNIQUE NOT NULL,
                password VARCHAR(128) NOT NULL,
                isAdmin BOOLEAN DEFAULT FALSE
            );
        `; 

        const CreateEventsTable =
        `
            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                weekday VARCHAR(10) NOT NULL CHECK (
                    weekday IN (
                    'monday', 'tuesday', 'wednesday', 
                    'thursday', 'friday', 'saturday', 'sunday'
                    )
                ),
                time TIME NOT NULL,
                min_users INTEGER NOT NULL DEFAULT 1
            );
        `;
      

        const CreateUsersPreferencesTable = 
        `
            CREATE TABLE IF NOT EXISTS users_preferences (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                event_id INT NOT NULL,
                preference INT NOT NULL,
                is_sunday BOOLEAN NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                CONSTRAINT unique_user_event UNIQUE (user_id, event_id)
            );

        `;

        const CreateScheduleTable = 
        `
            CREATE TABLE IF NOT EXISTS schedule (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                event_id INT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
                CONSTRAINT unique_schedule_entry UNIQUE (user_id, event_id)
            );
        `;

    
        await pool.query(CreateUserTable);
        await pool.query(CreateEventsTable);
        await pool.query(CreateUsersPreferencesTable);
        await pool.query(CreateScheduleTable);

        console.log("User table successfully created or previously existed")

       await pool.query(`
        CREATE OR REPLACE FUNCTION set_is_sunday() 
        RETURNS TRIGGER AS $$
        BEGIN
            IF (SELECT weekday FROM events WHERE id = NEW.event_id) = 'sunday' THEN
                NEW.is_sunday := true;
            ELSE
                NEW.is_sunday := false;
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
        DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM pg_trigger 
                    WHERE tgname = 'trigger_set_is_sunday'
                ) THEN
                    CREATE TRIGGER trigger_set_is_sunday
                    BEFORE INSERT OR UPDATE ON users_preferences
                    FOR EACH ROW
                    EXECUTE FUNCTION set_is_sunday();
                END IF;
            END$$;

    `);

        console.log("Trigger successfully created");
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