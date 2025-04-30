import { Router } from "express";

import { createEvent, getAllEvents, setUserPreferences } from "../controllers/eventsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const eventRouter = Router();

eventRouter.post("/createEvent", createEvent);
eventRouter.get("/getAllEvents", getAllEvents);
eventRouter.post("/setUserPreferences", async (req, res) => {
    try {
        await setUserPreferences(req, res);
    } catch (err) {
        res.status(500).json({ error: 'Error in setting preferences' });
    }
});



export default eventRouter;