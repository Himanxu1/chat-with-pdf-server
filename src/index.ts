import "reflect-metadata";
import * as http from "http";
import logger from "./utils/logger.js";
import app from "./server.js";
import {
  closeDatabaseConnection,
  initializeDatabase,
} from "./typeorm/dbConnection.js";
import { pdfWorker } from "./workers/pdf.worker.js";
import { planInitializerService } from "./services/planInitializer.js";
// import { startCleanupScheduler } from "./utils/cleanup.js";
// import { LogSyncService } from "./services/logSyncService.js";
// import { env } from "./config/env.js";

const main = async () => {
  try {
    logger.info("Starting Chat with PDF server...");
    await initializeDatabase();
    logger.info("Database initialized successfully");

    // Initialize plans with limits
    await planInitializerService.initializePlans();
    logger.info("Plans initialized successfully");

    logger.info("Starting PDF worker...");

    // startCleanupScheduler();

    // Start log sync service if enabled
    // if (env.LOG_SYNC_ENABLED) {
    //   try {
    //     const logSyncService = new LogSyncService();
    //     logSyncService.startPeriodicSync();
    //     logger.info("Log sync service started");
    //   } catch (error) {
    //     logger.warn("Failed to start log sync service:", error);
    //   }
    // }

    const server = http.createServer(app);

    server.listen(3001, () => {
      logger.info(`Server is running on http://localhost:${3001}`);
      console.log(`Server is running on http://localhost:${3001}`);
    });

    server.on("close", () => {
      logger.info("Server is shutting down...");
    });

    server.on("error", (err) => {
      logger.error("Server error:", err);
      console.error("Server error:", err);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        try {
          await closeDatabaseConnection();
          await pdfWorker.close();
          logger.info("Graceful shutdown completed");
          process.exit(0);
        } catch (error) {
          logger.error("Error during shutdown:", error);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

main();
