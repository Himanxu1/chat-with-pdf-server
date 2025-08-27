import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default("3001"),
  DATABASE_URL: z
    .string()
    .default("mysql://admin:admin@localhost:3306/chatpdf"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().transform(Number).default("6379"),
  GOOGLE_API_KEY: z.string().default("AIzaSyBmR0hm2mOSFvscjtrCeT_ftKOeJ2P6cAk"),
  QDRANT_URL: z.string().default("http://localhost:6333"),
  QDRANT_COLLECTION: z.string().default("langchainjs-testing"),
  UPLOAD_MAX_SIZE: z.string().transform(Number).default("10485760"),

  // JWT Configuration
  JWT_SECRET: z.string().default("supersecretjwtkey"),

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
