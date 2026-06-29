import { Router } from "express";
import { createEvent, getAllEvents, getEventById, createBulkEvents, verifyEventById } from "../controllers/events.controller";
import { methodNotAllowed } from "../middlewares/method-not-allowed.middleware";

const router = Router();


router.route("/")
  .get(getAllEvents)
  .post(createEvent)
  .all(methodNotAllowed); 
router.route("/:id/verify")
  .get(verifyEventById)
  .all(methodNotAllowed)

router.route("/bulk")
  .post(createBulkEvents)
  .all(methodNotAllowed); 


router.route("/:id")
  .get(getEventById)
  .all(methodNotAllowed); 

export default router;
