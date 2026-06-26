import { Router } from "express";
import { createEvent } from "../controllers/events.controller";

const router = Router();

router.post("/", createEvent);

export default router;