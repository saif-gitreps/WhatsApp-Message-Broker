import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
   handleValidationErrors,
   sendMessageRules,
} from "../middlewares/validate.middleware.js";
import { getStatus, send } from "../controllers/message.controller.js";

const router = Router();

router.get("/status", getStatus);

router.post("/message/send", sendMessageRules, handleValidationErrors, send);

export default router;
