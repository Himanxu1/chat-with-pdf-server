import type { Request, Response, NextFunction } from "express";
import logger from "../utils/logger.js";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
    };

    if (res.statusCode >= 400) {
      logger.warn("Request completed with error", logData);
    } else {
      logger.info("Request completed", logData);
    }
  });

  next();
};
