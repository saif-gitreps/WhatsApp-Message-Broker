import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import config from "./config.js";
import path from "path";
import http from "http";
import { handleError, handleNotFound } from "./middlewares/error.middleware.js";
import logger from "./utils/logger.js";
import { initSocketServer } from "./sockets/socketHandler.js";
import { whatsappService } from "./services/whatsapp.services.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.cors.allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/server-status", (_req: Request, res: Response) => {
   res.json({ success: true, message: "Server is running", uptime: process.uptime() });
});

app.use(handleNotFound);
app.use(handleError);

const httpServer = http.createServer(app);
initSocketServer(httpServer);

httpServer.listen(config.server.port, () => {
   logger.info(`server running on http://localhost:${config.server.port}`);
   logger.info(`   environment : ${config.server.nodeEnv}`);
   logger.info(`   socket.IO   : enabled`);
});

whatsappService.initialize();

// const shutdown = (signal: string) => {
//    logger.info(`Received ${signal} – shutting down gracefully…`);
//    httpServer.close(() => {
//       logger.info("HTTP server closed.");
//       process.exit(0);
//    });
// };

// process.on("SIGTERM", () => shutdown("SIGTERM"));
// process.on("SIGINT", () => shutdown("SIGINT"));

// process.on("unhandledRejection", (reason) => {
//    logger.error("Unhandled promise rejection", { reason });
// });
