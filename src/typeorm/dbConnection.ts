import { getDataSource, closeDataSource } from "./config/ormConfig.js";
import logger from "../utils/logger.js";

let dataSource: any = null;

export async function initializeDatabase() {
  try {
    dataSource = await getDataSource();
    logger.info("Database connected successfully");
    return dataSource;
  } catch (error) {
    logger.error("Failed to connect to database:", error);
    throw error;
  }
}

export async function getDatabaseConnection() {
  if (!dataSource || !dataSource.isInitialized) {
    await initializeDatabase();
  }
  return dataSource;
}

export async function closeDatabaseConnection() {
  try {
    await closeDataSource();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Error closing database connection:", error);
  }
}
