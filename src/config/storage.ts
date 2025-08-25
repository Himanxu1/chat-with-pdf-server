// src/config/storage.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "./env.js";
import { GCPStorageService } from "./gcp-storage.js";
import logger from "../utils/logger.js";

// Ensure uploads directory exists for temporary storage
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Custom storage engine that uploads to GCP after local save
const gcpStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Middleware to handle GCP upload after multer
export const uploadToGCP = async (req: any, _res: any, next: any) => {
  logger.info("here");
  if (!req.file) {
    return next();
  }

  try {
    // Only upload to GCP if GCP is configured
    if (env.GCP_PROJECT_ID && env.GCP_STORAGE_BUCKET) {
      const gcpFilename = `pdfs/${req.file.filename}`;
      const uploadResult = await GCPStorageService.uploadFile(
        req.file.path,
        gcpFilename,
        {
          originalName: req.file.originalname,
          uploadedBy: req.ip || "unknown",
          uploadedAt: new Date().toISOString(),
        }
      );

      // Add GCP info to the file object
      req.file.gcpUrl = uploadResult.url;
      req.file.gcpFilename = uploadResult.filename;
      req.file.gcpBucket = uploadResult.bucket;

      logger.info(`File uploaded to GCP: ${uploadResult.url}`);

      // Clean up local file after GCP upload
      fs.unlinkSync(req.file.path);
      req.file.path = uploadResult.url; // Update path to GCP URL
    }
  } catch (error) {
    logger.error("Error uploading to GCP:", error);
    // Continue with local file if GCP upload fails
  }

  next();
};

export const upload = multer({
  storage: gcpStorage,
  limits: {
    fileSize: env.UPLOAD_MAX_SIZE, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});
