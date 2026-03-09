import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
   handleValidationErrors,
   sendMessageRules,
} from "../middlewares/validate.middleware.js";
import { getStatus, send } from "../controllers/message.controller.js";

const router = Router();

router.use(rateLimit);

router.get("/status", getStatus);

router.post("/message", sendMessageRules, handleValidationErrors, send);

export default router;
