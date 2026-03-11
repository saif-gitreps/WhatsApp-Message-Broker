import { EventEmitter } from "events";
import { Client, Message } from "whatsapp-web.js";
import pkg from "whatsapp-web.js";
import { AppError, WhatsAppStatus } from "../types/shared.js";
import config from "../config.js";
import logger from "../utils/logger.js";
import qrcode from "qrcode";
const { LocalAuth } = pkg;

class WhatsAppService extends EventEmitter {
   private client: Client | null = null;
   private status: WhatsAppStatus = WhatsAppStatus.INITIALIZING;
   private reconnectAttempts = 0;
   private readonly MAX_RECONNECT_ATTEMPTS = 5;
   private readonly RECONNECT_DELAY_MS = 5_000;

   public initialize(): void {
      logger.info("Initialising WhatsApp client");

      this.client = new Client({
         authStrategy: new LocalAuth({
            dataPath: config.whatsapp.sessionDataPath,
         }),
         puppeteer: {
            // TODO: ADD A REMAINDER IN README THAT the BELOW key-pair is optional and you may not need this to run the proj.
            executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
         },
      });

      this.registerEvents();
      this.client.initialize();
   }

   private registerEvents(): void {
      if (!this.client) return;

      // QR code generated then converts to data-URL and broadcasts TODO:CHECK FOR BUGS
      this.client.on("qr", async (qr: string) => {
         logger.info("QR code received – waiting for scan…");
         this.setStatus(WhatsAppStatus.QR_READY);
         try {
            const qrDataUrl = await qrcode.toDataURL(qr);
            this.emit("qr", qrDataUrl);
         } catch (err) {
            logger.error("Failed to generate QR data URL", { err });
         }
      });

      this.client.on("authenticated", () => {
         logger.info("WhatsApp authenticated ✓");
         this.setStatus(WhatsAppStatus.AUTHENTICATED);
         this.reconnectAttempts = 0;
      });

      this.client.on("ready", () => {
         logger.info("WhatsApp client is ready ✓");
         this.setStatus(WhatsAppStatus.READY);
      });

      this.client.on("auth_failure", (msg: string) => {
         logger.error("WhatsApp authentication failure", { msg });
         this.setStatus(WhatsAppStatus.AUTH_FAILURE);
      });

      this.client.on("disconnected", (reason: string) => {
         logger.warn("WhatsApp disconnected", { reason });
         this.setStatus(WhatsAppStatus.DISCONNECTED);
         this.handleReconnect();
      });
   }

   private handleReconnect(): void {
      if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
         logger.error("Max reconnection attempts reached.");
         return;
      }

      this.reconnectAttempts++;
      const delay = this.RECONNECT_DELAY_MS * this.reconnectAttempts;
      logger.info(
         `Reconnecting in ${delay / 1000}s… (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`,
      );

      setTimeout(() => {
         logger.info("Attempting reconnection…");
         this.initialize();
      }, delay);
   }

   public async sendMessage(phone: string, message: string): Promise<Message> {
      if (!this.client || this.status !== WhatsAppStatus.READY) {
         throw new AppError("WhatsApp client is not ready", 503);
      }

      const chatId = phone.includes("@c.us") ? phone : `${phone}@c.us`;

      try {
         const result = await this.client.sendMessage(chatId, message);
         logger.info("Message sent", { phone, messageId: result.id.id });
         return result;
      } catch (err) {
         logger.error("Failed to send message", { phone, err });
         throw new AppError(`Failed to send message: ${(err as Error).message}`, 500);
      }
   }

   private setStatus(status: WhatsAppStatus): void {
      this.status = status;
      this.emit("status_change", status);
   }

   public getStatus(): WhatsAppStatus {
      return this.status;
   }

   public isReady(): boolean {
      return this.status === WhatsAppStatus.READY;
   }
}

export const whatsappService = new WhatsAppService();
