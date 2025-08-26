import { Storage } from "@google-cloud/storage";
import { env } from "./env.js";
import logger from "../utils/logger.js";

// Check if GCP is properly configured
const isGCPConfigured = Boolean(env.GCP_PROJECT_ID && env.GCP_STORAGE_BUCKET);

// Initialize Google Cloud Storage only if configured
let storage: Storage | null = null;
let bucket: any = null;

if (isGCPConfigured && env.GCP_PROJECT_ID && env.GCP_STORAGE_BUCKET) {
  try {
    storage = new Storage({
      projectId: env.GCP_PROJECT_ID,
      ...(env.GCP_KEY_FILE_PATH && { keyFilename: env.GCP_KEY_FILE_PATH }),
    });
    
    bucket = storage.bucket(env.GCP_STORAGE_BUCKET);
    logger.info(`GCP Storage initialized for bucket: ${env.GCP_STORAGE_BUCKET}`);
  } catch (error) {
    logger.error("Failed to initialize GCP Storage:", error);
    storage = null;
    bucket = null;
  }
} else {
  logger.warn("GCP Storage not configured. Missing GCP_PROJECT_ID or GCP_STORAGE_BUCKET");
}

export interface UploadResult {
  filename: string;
  url: string;
  size: number;
  bucket: string;
}

export class GCPStorageService {
  /**
   * Check if GCP storage is available
   */
  static isAvailable(): boolean {
    return isGCPConfigured && storage !== null && bucket !== null;
  }

  /**
   * Upload a file to GCP Cloud Storage
   */
  static async uploadFile(
    filePath: string,
    destination: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    if (!this.isAvailable()) {
      throw new Error("GCP Storage is not configured or available");
    }

    if (!env.GCP_STORAGE_BUCKET) {
      throw new Error("GCP Storage bucket is not configured");
    }

    try {
      const options = {
        destination,
        metadata: {
          contentType: "application/pdf",
          ...metadata,
        },
        resumable: false,
      };

      const [file] = await bucket!.upload(filePath, options);

      // Make the file publicly readable (optional)
      await file.makePublic();

      const [metadata_result] = await file.getMetadata();

      logger.info(`File uploaded to GCS: ${destination}`);

      return {
        filename: destination,
        url: `https://storage.googleapis.com/${env.GCP_STORAGE_BUCKET}/${destination}`,
        size: parseInt(metadata_result.size?.toString() || "0"),
        bucket: env.GCP_STORAGE_BUCKET,
      };
    } catch (error) {
      logger.error("Error uploading file to GCS:", error);
      throw new Error(`Failed to upload file to GCS: ${error}`);
    }
  }

  /**
   * Delete a file from GCP Cloud Storage
   */
  static async deleteFile(filename: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error("GCP Storage is not configured or available");
    }

    try {
      await bucket!.file(filename).delete();
      logger.info(`File deleted from GCS: ${filename}`);
    } catch (error) {
      logger.error("Error deleting file from GCS:", error);
      throw new Error(`Failed to delete file from GCS: ${error}`);
    }
  }

  /**
   * Get file metadata from GCP Cloud Storage
   */
  static async getFileMetadata(filename: string) {
    if (!this.isAvailable()) {
      throw new Error("GCP Storage is not configured or available");
    }

    try {
      const [metadata] = await bucket!.file(filename).getMetadata();
      return metadata;
    } catch (error) {
      logger.error("Error getting file metadata from GCS:", error);
      throw new Error(`Failed to get file metadata from GCS: ${error}`);
    }
  }

  /**
   * Generate a signed URL for temporary access
   */
  static async generateSignedUrl(
    filename: string,
    expirationMinutes: number = 60
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error("GCP Storage is not configured or available");
    }

    try {
      const [url] = await bucket!.file(filename).getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + expirationMinutes * 60 * 1000,
      });
      return url;
    } catch (error) {
      logger.error("Error generating signed URL:", error);
      throw new Error(`Failed to generate signed URL: ${error}`);
    }
  }
}
