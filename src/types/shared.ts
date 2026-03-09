export enum WhatsAppStatus {
   INITIALIZING = "INITIALIZING",
   QR_READY = "QR_READY",
   AUTHENTICATED = "AUTHENTICATED",
   READY = "READY",
   DISCONNECTED = "DISCONNECTED",
   AUTH_FAILURE = "AUTH_FAILURE",
}

export class AppError extends Error {
   public readonly statusCode: number;
   public readonly isOperational: boolean;

   constructor(message: string, statusCode = 500, isOperational = true) {
      super(message);
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      Object.setPrototypeOf(this, new.target.prototype);
   }
}

export interface ApiResponse<T = unknown> {
   success: boolean;
   message: string;
   data?: T;
   error?: string;
}

export interface SendMessageRequest {
   phone: string;
   message: string;
}

export interface SendMessageResponse {
   messageId: string;
   phone: string;
   timestamp: string;
}

export interface StatusResponse {
   status: WhatsAppStatus;
   ready: boolean;
   uptime: number;
}

export interface QueuedMessage {
   id: string;
   phone: string;
   message: string;
   enqueuedAt: Date;
}
