import PQueue from "p-queue";
import { AppError, QueuedMessage, SendMessageResponse } from "../types/shared.js";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
import { whatsappService } from "./whatsapp.services.js";

class QueueService {
   private queue: PQueue;
   private pendingJobs = new Map<string, QueuedMessage>();

   constructor() {
      this.queue = new PQueue({
         concurrency: 1,
         intervalCap: 10,
         interval: 1_000,
      });

      this.queue.on("active", () => {
         logger.debug(
            `Queue active – size: ${this.queue.size}, pending: ${this.queue.pending}`,
         );
      });
   }

   public async enqueue(phone: string, message: string): Promise<SendMessageResponse> {
      const id = uuidv4();
      const job: QueuedMessage = { id, phone, message, enqueuedAt: new Date() };
      this.pendingJobs.set(id, job);

      logger.info("Message enqueued", { id, phone, queueSize: this.queue.size });

      try {
         const result = await this.queue.add(async () => {
            return this.dispatch(job);
         });

         if (!result) throw new AppError("Queue job returned no result", 500);
         return result;
      } finally {
         this.pendingJobs.delete(id);
      }
   }

   private async dispatch(job: QueuedMessage): Promise<SendMessageResponse> {
      logger.info("Dispatching message", { id: job.id, phone: job.phone });

      const whatsappMessage = await whatsappService.sendMessage(job.phone, job.message);

      return {
         messageId: whatsappMessage.id.id,
         phone: job.phone,
         timestamp: new Date().toISOString(),
      };
   }

   public getStats() {
      return {
         queueSize: this.queue.size,
         pending: this.queue.pending,
         isPaused: this.queue.isPaused,
      };
   }
}

export const queueService = new QueueService();
