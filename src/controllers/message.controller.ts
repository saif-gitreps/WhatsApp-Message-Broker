import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger.js";
import {
   ApiResponse,
   SendMessageRequest,
   SendMessageResponse,
   StatusResponse,
} from "../types/shared.js";
import { queueService } from "../services/queue.services.js";
import { whatsappService } from "../services/whatsapp.services.js";

export async function send(
   req: Request,
   res: Response,
   next: NextFunction,
): Promise<void> {
   try {
      const { phone, message } = req.body as SendMessageRequest;

      logger.info("Send message request received", { phone });

      const result: SendMessageResponse = await queueService.enqueue(phone, message);

      const response: ApiResponse<SendMessageResponse> = {
         success: true,
         message: "Message sent successfully",
         data: result,
      };

      res.status(200).json(response);
   } catch (err) {
      next(err);
   }
}

export async function getStatus(
   req: Request,
   res: Response,
   next: NextFunction,
): Promise<void> {
   try {
      const status = whatsappService.getStatus();
      const queueStats = queueService.getStats();

      const response: ApiResponse<StatusResponse & typeof queueStats> = {
         success: true,
         message: "Status retrieved",
         data: {
            status,
            ready: whatsappService.isReady(),
            uptime: Math.floor(process.uptime()),
            ...queueStats,
         },
      };

      res.status(200).json(response);
   } catch (err) {
      next(err);
   }
}
