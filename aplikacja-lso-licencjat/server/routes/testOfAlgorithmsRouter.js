import { Router } from "express";
import { fillEvents, fillUsers, fillPreferences } from "../controllers/testOfAlgorithmsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const testOfAlgorithmsRouter = Router();

testOfAlgorithmsRouter.post("/fillEvents", fillEvents);
testOfAlgorithmsRouter.post("/fillUsers", fillUsers);
testOfAlgorithmsRouter.post("/fillPreferences", fillPreferences);

export default testOfAlgorithmsRouter;