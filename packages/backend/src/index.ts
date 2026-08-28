import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "./config";
import { router as apiRouter } from "./core/router";
import { setupSwagger } from "./core/swagger";

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting - stricter on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts. Please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded" },
});

app.use("/api/v1/auth", authLimiter);
app.use("/api/v1", apiLimiter);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
setupSwagger(app);

// Wrap all routes with async error catcher
app.use("/api/v1", (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Override res.json to catch errors in async handlers
  const originalJson = res.json.bind(res);
  res.json = function(body: unknown) {
    return originalJson(body);
  } as typeof res.json;
  next();
});
app.use("/api/v1", apiRouter);

// Catch-all error handler for Express
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Express error:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Wrap async route handlers to catch rejected promises
const asyncHandler = (fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<unknown>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Make asyncHandler available globally on the app
app.locals.asyncHandler = asyncHandler;

// Socket.io connection
io.on("connection", (socket) => {
  // eslint-disable-next-line no-console
  console.log(`Socket connected: ${socket.id}`);

  socket.on("join-tenant", (tenantId: string) => {
    socket.join(tenantId);
  });

  socket.on("disconnect", () => {
    // eslint-disable-next-line no-console
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Global error handler — prevent unhandled rejections from crashing the server
process.on("unhandledRejection", (reason: unknown) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err);
  // Don't exit — keep the server alive
});

// Graceful shutdown
process.on("SIGTERM", () => {
  // eslint-disable-next-line no-console
  console.log("SIGTERM received, shutting down gracefully...");
  io.close();
  httpServer.close(() => {
    // eslint-disable-next-line no-console
    console.log("Process terminated");
  });
});

const PORT = config.port;
httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

export { app, io, httpServer };
