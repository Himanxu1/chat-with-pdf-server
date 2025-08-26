import "./workers/pdf.worker.js"; // This imports and initializes the worker
import logger from "./utils/logger.js";

logger.info("PDF worker started and listening for jobs...");
