import { Router } from "express";

import { createSchedule, getAllUsersPreferences } from "../controllers/schedulerController.js"
import { authMiddleware } from "../middleware/authMiddleware.js";

const scheduleRouter = Router();

scheduleRouter.post("/createSchedule", createSchedule);
scheduleRouter.get("/getAllUsersPreferences", getAllUsersPreferences);

export default scheduleRouter;