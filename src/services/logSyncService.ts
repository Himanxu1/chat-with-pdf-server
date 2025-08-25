import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

export class LogSyncService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    if (!env.GCP_PROJECT_ID || !env.LOG_SYNC_BUCKET) {
      throw new Error("GCP configuration required for log sync service");
    }

    this.storage = new Storage({
      projectId: env.GCP_PROJECT_ID!,
      ...(env.GCP_KEY_FILE_PATH && { keyFilename: env.GCP_KEY_FILE_PATH }),
    });

    this.bucketName = env.LOG_SYNC_BUCKET;
  }

  /**
   * Sync logs to GCP Cloud Storage
   */
  async syncLogs(): Promise<void> {
    try {
      logger.info("Starting log sync to GCP Cloud Storage");

      const logDirs = [
        path.join(process.cwd(), "logs"),
        path.join(process.cwd(), ".logs"),
      ];

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const dateFolder =
        new Date().toISOString().split("T")[0]?.replace(/-/g, "/") || "";
      const gcpPath = `logs/${dateFolder}/${timestamp}`;

      const bucket = this.storage.bucket(this.bucketName);

      for (const logDir of logDirs) {
        if (!fs.existsSync(logDir)) {
          logger.warn(`Log directory does not exist: ${logDir}`);
          continue;
        }

        const files = fs.readdirSync(logDir);

        for (const file of files) {
          if (file.endsWith(".log")) {
            const filePath = path.join(logDir, file);
            const stats = fs.statSync(filePath);

            // Only sync files that are not empty and have been modified recently
            if (
              stats.size > 0 &&
              stats.mtime > new Date(Date.now() - 24 * 60 * 60 * 1000)
            ) {
              const gcpFilePath = `${gcpPath}/${file}`;

              await bucket.upload(filePath, {
                destination: gcpFilePath,
                metadata: {
                  contentType: "text/plain",
                  metadata: {
                    originalPath: filePath,
                    fileSize: stats.size.toString(),
                    lastModified: stats.mtime.toISOString(),
                    syncedAt: new Date().toISOString(),
                  },
                },
              });

              logger.info(
                `Synced log file: ${file} to gs://${this.bucketName}/${gcpFilePath}`,
              );
            }
          }
        }
      }

      // Create sync summary
      const summary = {
        syncTime: new Date().toISOString(),
        server: process.env["HOSTNAME"] || "unknown",
        project: "ChatPDF Server",
        gcpPath,
        bucket: this.bucketName,
      };

      await bucket
        .file(`${gcpPath}/sync_summary.json`)
        .save(JSON.stringify(summary, null, 2), {
          metadata: {
            contentType: "application/json",
          },
        });

      logger.info("Log sync completed successfully");
    } catch (error) {
      logger.error("Error syncing logs to GCP:", error);
      throw error;
    }
  }

  /**
   * Clean up old local logs
   */
  async cleanupOldLogs(daysToKeep: number = 7): Promise<void> {
    try {
      const logDirs = [
        path.join(process.cwd(), "logs"),
        path.join(process.cwd(), ".logs"),
      ];

      const cutoffDate = new Date(
        Date.now() - daysToKeep * 24 * 60 * 60 * 1000,
      );

      for (const logDir of logDirs) {
        if (!fs.existsSync(logDir)) {
          continue;
        }

        const files = fs.readdirSync(logDir);

        for (const file of files) {
          if (file.endsWith(".log")) {
            const filePath = path.join(logDir, file);
            const stats = fs.statSync(filePath);

            if (stats.mtime < cutoffDate) {
              fs.unlinkSync(filePath);
              logger.info(`Deleted old log file: ${file}`);
            }
          }
        }
      }
    } catch (error) {
      logger.error("Error cleaning up old logs:", error);
    }
  }

  /**
   * Start periodic log sync
   */
  startPeriodicSync(): void {
    if (!env.LOG_SYNC_ENABLED) {
      logger.info("Log sync is disabled");
      return;
    }

    const intervalMs = env.LOG_SYNC_INTERVAL_HOURS * 60 * 60 * 1000;

    logger.info(
      `Starting periodic log sync every ${env.LOG_SYNC_INTERVAL_HOURS} hours`,
    );

    // Initial sync
    this.syncLogs().catch((error) => {
      logger.error("Initial log sync failed:", error);
    });

    // Set up periodic sync
    setInterval(async () => {
      try {
        await this.syncLogs();
        await this.cleanupOldLogs();
      } catch (error) {
        logger.error("Periodic log sync failed:", error);
      }
    }, intervalMs);
  }
}
