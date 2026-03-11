import config from "./config.js";
import http from "http";
import logger from "./utils/logger.js";
import { initSocketServer } from "./sockets/socketHandler.js";
import { whatsappService } from "./services/whatsapp.services.js";
import initalizeApp from "./app.js";

const app = initalizeApp();
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
