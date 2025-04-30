import db from "../config/db.js"

const createSchedule = async (req, res) => {

}

const getAllUsersPreferences = async (req, res) => {
    try {
        const userPreferences = await db.query(`
            SELECT up.*
            FROM users_preferences up
            JOIN users u ON u.id = up.user_id
            WHERE u.isadmin <> $1;
        `, [true]);
        const preferencesArray = userPreferences.rows.map(pref => ({
            userId: pref.user_id,
            eventId: pref.event_id,
            preference: pref.preference,
            isSunday: pref.is_sunday
        }));

        res.status(200).json({
            message: "User preferences successfully fetched!",
            preferences: preferencesArray
        });
    } catch (err) {
        console.log("Error fetching user preferences:", err);
        res.status(500).json({ error: "Server error while fetching preferences" });
    }
};



export {createSchedule, getAllUsersPreferences}; 