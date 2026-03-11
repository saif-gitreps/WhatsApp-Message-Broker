import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import messageRoutes from "./routes/message.routes.js";
import { handleError, handleNotFound } from "./middlewares/error.middleware.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import config from "./config.js";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware.js";

function initalizeApp(): Application {
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = dirname(__filename);

   const app = express();

   app.use(
      helmet({
         contentSecurityPolicy: {
            directives: {
               defaultSrc: ["'self'"],
               scriptSrc: ["'self'", "https://cdn.socket.io", "'unsafe-inline'"],
               connectSrc: ["'self'", "ws:", "wss:", "https://cdn.socket.io"],
            },
         },
      }),
   );
   app.use(cors({ origin: config.cors.allowedOrigins }));
   app.use(express.json());
   app.use(express.urlencoded({ extended: true }));

   app.use(express.static(path.join(__dirname, "..", "public")));

   app.use(apiRateLimiter);

   app.get("/server-status", (_req: Request, res: Response) => {
      res.json({
         success: true,
         message: "Server is running",
         uptime: process.uptime(),
      });
   });

   app.use("/api", messageRoutes);

   app.use(handleNotFound);
   app.use(handleError);

   return app;
}

export default initalizeApp;
