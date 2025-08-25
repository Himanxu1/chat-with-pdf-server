import "reflect-metadata";
import express from "express";
import cors from "cors";
import appRouter from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { generalRateLimiter } from "./middleware/rateLimiter.js";
import { requestLogger } from "./middleware/requestLogger.js";
import logger from "./utils/logger.js";
import { env } from "./config/env.js";
import { redisConnection } from "./config/redis.js";
import { getDatabaseConnection } from "./typeorm/dbConnection.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(generalRateLimiter);

// Routes
app.get("/", (_req, res) => {
  res.send("Welcome to the ChatPDF server!");
});

app.get("/health", async (_req, res) => {
  try {
    const healthChecks = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: env.NODE_ENV,
      services: {} as Record<string, string>,
    };

    // Check Redis
    try {
      const { Redis } = await import("ioredis");
      const redis = new Redis(redisConnection);
      await redis.ping();
      await redis.disconnect();
      healthChecks.services["redis"] = "connected";
    } catch (error) {
      healthChecks.services["redis"] = "disconnected";
      healthChecks.status = "degraded";
    }

    // Check Database
    try {
      const dataSource = await getDatabaseConnection();
      await dataSource.query("SELECT 1");
      healthChecks.services["database"] = "connected";
    } catch (error) {
      healthChecks.services["database"] = "disconnected";
      healthChecks.status = "degraded";
    }

    // Check Qdrant
    try {
      const response = await fetch(
        `${env.QDRANT_URL}/collections/${env.QDRANT_COLLECTION}`
      );
      if (response.ok) {
        healthChecks.services["qdrant"] = "connected";
      } else {
        healthChecks.services["qdrant"] = "disconnected";
        healthChecks.status = "degraded";
      }
    } catch (error) {
      healthChecks.services["qdrant"] = "disconnected";
      healthChecks.status = "degraded";
    }

    const statusCode = healthChecks.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(healthChecks);
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      error: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

app.use("/api/v1", appRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
