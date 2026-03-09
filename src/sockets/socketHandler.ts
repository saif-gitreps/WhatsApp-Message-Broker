import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import config from "../config.js";
import { whatsappService } from "../services/whatsapp.services.js";
import logger from "../utils/logger.js";
import { WhatsAppStatus } from "../types/shared.js";

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
   const io = new SocketIOServer(httpServer, {
      cors: {
         origin: config.cors.allowedOrigins,
         methods: ["GET", "POST"],
      },
   });

   whatsappService.on("qr", (qrDataUrl: string) => {
      logger.info("Broadcasting QR to connected clients");
      io.emit("qr", qrDataUrl);
   });

   whatsappService.on("status_change", (status: WhatsAppStatus) => {
      logger.info("Broadcasting status change", { status });
      io.emit("status", status);
   });

   io.on("connection", (socket: Socket) => {
      logger.info("Socket client connected", { id: socket.id });

      socket.emit("status", whatsappService.getStatus());

      socket.on("disconnect", () => {
         logger.info("Socket client disconnected", { id: socket.id });
      });
   });

   return io;
}
