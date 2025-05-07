import db from "../config/db.js";
import bcrypt from "bcrypt";

// Clears and refills events table, now assigning random min_users between 1 and 4
const fillEvents = async (req, res) => {
    const { numOfSundayEvents, numOfWeekEvents } = req.body;
  
    try {
      // Usuń wszystkie istniejące eventy
      await db.query("DELETE FROM events");
    } catch (err) {
      console.error("Error clearing events table:", err);
      return res.status(500).json({ error: "Could not clear events" });
    }
  
    // Pomocnicza funkcja tworząca jeden event
    const createOne = async ({ title, weekday, time, minUsers }) => {
      if (!title || !weekday || !time || typeof minUsers !== 'number') {
        throw new Error("title, weekday, time i minUsers są wymagane");
      }
  
      // Sprawdź duplikaty
      const { rows: existing } = await db.query(
        `SELECT id FROM events WHERE title = $1`,
        [title]
      );
      if (existing.length > 0) {
        console.log(`Skipping duplicate event: ${title} (${weekday} @ ${time})`);
        return null;
      }
  
      // Właściwy INSERT z losowym min_users
      const { rows } = await db.query(
        `INSERT INTO events (title, weekday, time, min_users)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [title, weekday, time, minUsers]
      );
      return rows[0];
    };
  
    // Funkcja do generowania losowego minUsers w przedziale [1,4]
    const randomMinUsers = () => Math.floor(Math.random() * 4) + 1;
  
    // Tworzenie eventów niedzielnych
    for (let i = 0; i < numOfSundayEvents; ++i) {
      try {
        const now = new Date().toLocaleTimeString();
        const title = `sunday-event-${i}`;
        const weekday = "sunday";
        const minUsers = randomMinUsers();
        const event = await createOne({ title, weekday, time: now, minUsers });
        if (event) console.log("Created:", event);
      } catch (err) {
        console.error("Failed to create sunday event:", err.message);
      }
    }
  
    const WEEKDAYS = ["monday","tuesday","wednesday","thursday","friday","saturday"];
    // Tworzenie eventów w dni powszednie
    for (let i = 0; i < numOfWeekEvents; ++i) {
      try {
        const now = new Date().toLocaleTimeString();
        const weekday = WEEKDAYS[i % WEEKDAYS.length];
        const title = `week-event-${i}`;
        const minUsers = randomMinUsers();
        const event = await createOne({ title, weekday, time: now, minUsers });
        if (event) console.log("Created:", event);
      } catch (err) {
        console.error("Failed to create weekday event:", err.message);
      }
    }
  
    res.status(201).json({ message: "Events processing finished" });
  };
  
// Clears users (except admin1) before filling
const fillUsers = async (req, res) => {
    const { numOfUsers } = req.body;
    const created = [];
    try {
        // Remove all users except admin1
        await db.query("DELETE FROM users WHERE isadmin <> $1", [true]);
    } catch (err) {
        console.error("Error clearing users table:", err);
        return res.status(500).json({ error: "Could not clear users" });
    }

    for (let i = 0; i < numOfUsers; i++) {
        const login = `user_${i}`;
        const password = `user_${i}`;

        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const { rows } = await db.query(
                `INSERT INTO users (login, password) VALUES ($1, $2) RETURNING id, login`,
                [login, hashedPassword]
            );
            created.push(rows[0]);
        } catch (err) {
            console.error(`Error creating user ${login}:`, err);
        }
    }

    res.status(201).json({ message: "Users successfully created", count: created.length, users: created });
};

const fillPreferences = async (req, res) => {
  try {
      // Usuń wszystkie istniejące preferencje
      await db.query(`DELETE FROM users_preferences`);

      // Pobierz tylko zwykłych użytkowników (nie adminów)
      const { rows: users } = await db.query(`
          SELECT id FROM users WHERE isadmin = false
      `);
      if (users.length === 0) {
          return res.status(400).json({ error: "No non-admin users found" });
      }

      const { rows: events } = await db.query(`SELECT id FROM events`);
      if (events.length === 0) {
          return res.status(400).json({ error: "No events found" });
      }

      let count = 0;
      for (const user of users) {
          for (const event of events) {
              const preference = Math.floor(Math.random() * 5) + 1;
              await db.query(
                  `INSERT INTO users_preferences (user_id, event_id, preference)
                   VALUES ($1, $2, $3)
                   ON CONFLICT (user_id, event_id)
                   DO UPDATE SET preference = EXCLUDED.preference`,
                  [user.id, event.id, preference]
              );
              count++;
          }
      }

      res.status(201).json({ message: "Preferences reset and set for all non-admin user-event pairs", total: count });
  } catch (err) {
      console.error("fillPreferences error:", err);
      res.status(500).json({ error: "Server error during fillPreferences" });
  }
};


export { fillEvents, fillUsers, fillPreferences };
