import db from "../config/db.js"

const createEvent = async (req, res) => {

    const { title, weekday, time } = req.body;

    if( !title || !weekday || !time ){
        return res.status(400).json({ error: "all informations are required" })
    }

    try{
        const newEventQuery = await db.query("INSERT INTO events (title, weekday, time) VALUES ($1, $2, $3) RETURNING *", 
        [title, weekday, time]
    );


        res.status(201).json({message: "event successfully created!", event: newEventQuery.rows[0] });
    }
    catch(err){
        console.log("create event error ", err);
        res.status(500).json({error: "server error"});
    }

}

const getAllEvents = async (req, res) => {
    try {
        const allEvents = await db.query("SELECT * FROM events;");
        res.status(200).json({ message: "All events selected!", events: allEvents.rows });
    } catch (err) {
        console.log("get event error", err);
        res.status(500).json({ error: "Server error while fetching events" });
    }
};


const setUserPreferences = async (req, res) => {
    const { userId, eventId, preference } = req.body;

    if (!userId || !eventId || !preference) {
        return res.status(400).json({ error: "All information is required" });
    }

    try {
        const newPreferenceQuery = await db.query(
            "INSERT INTO users_preferences (user_id, event_id, preference) VALUES ($1, $2, $3) ON CONFLICT (user_id, event_id) DO UPDATE SET preference = EXCLUDED.preference RETURNING *",
            [userId, eventId, preference]
        );

        res.status(201).json({
            message: "Preferences successfully set!",
            preference: newPreferenceQuery.rows[0]
        });
    } catch (err) {
        console.log("Error setting user preferences:", err);
        res.status(500).json({ error: "Server error while setting preferences" });
    }
};



export {createEvent, getAllEvents, setUserPreferences}; 