import { Router } from "express";
import { createEvent, getAllEvents, getEventById } from "../controllers/events.controller";
import { methodNotAllowed } from "../middlewares/method-not-allowed.middleware";

const router = Router();

router.post("/", createEvent);
router.get("/", getAllEvents);
router.get("/:id", getEventById);

router.put("/", methodNotAllowed);
router.patch("/", methodNotAllowed);
router.delete("/", methodNotAllowed);
router.put("/:id", methodNotAllowed);
router.patch("/:id", methodNotAllowed);
router.delete("/:id", methodNotAllowed);

export default router;