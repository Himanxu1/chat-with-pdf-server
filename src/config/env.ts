import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default("3001"),
  DATABASE_URL: z.string(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().transform(Number),
  GOOGLE_API_KEY: z.string(),
  QDRANT_URL: z.string(),
  QDRANT_COLLECTION: z.string(),
  UPLOAD_MAX_SIZE: z.string().transform(Number),

  // JWT Configuration
  JWT_SECRET: z.string(),

  // GCP Configuration
  GCP_PROJECT_ID: z.string().optional(),
  GCP_KEY_FILE_PATH: z.string().optional(),
  GCP_STORAGE_BUCKET: z.string().optional(),

  // Log Sync Configuration
  LOG_SYNC_ENABLED: z.string().transform(Boolean).default("false"),
  LOG_SYNC_BUCKET: z.string().optional(),
  LOG_SYNC_INTERVAL_HOURS: z.string().transform(Number).default("10"),
});

export const env = envSchema.parse(process.env);
