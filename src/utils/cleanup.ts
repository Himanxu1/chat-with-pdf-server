import fs from "fs";
import path from "path";
import logger from "./logger.js";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
const FILE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export const cleanupOldFiles = () => {
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return;
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    const now = Date.now();
    let cleanedCount = 0;

    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtime.getTime() > FILE_MAX_AGE) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(
        `Cleaned up ${cleanedCount} old files from uploads directory`,
      );
    }
  } catch (error) {
    logger.error("Error during file cleanup:", error);
  }
};

// Start cleanup scheduler
export const startCleanupScheduler = () => {
  setInterval(cleanupOldFiles, CLEANUP_INTERVAL);
  logger.info("File cleanup scheduler started");
};
