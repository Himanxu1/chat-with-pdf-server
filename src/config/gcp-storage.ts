import { Storage } from "@google-cloud/storage";
import { env } from "./env.js";
import logger from "../utils/logger.js";

import dotenv from "dotenv";

dotenv.config({ path: "../../.env " });

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: env.GCP_PROJECT_ID!,
  ...(env.GCP_KEY_FILE_PATH && { keyFilename: env.GCP_KEY_FILE_PATH }),
});

const bucketName = env.GCP_STORAGE_BUCKET!;
const bucket = storage.bucket(bucketName);

export interface UploadResult {
  filename: string;
  url: string;
  size: number;
  bucket: string;
}

export class GCPStorageService {
  /**
   * Upload a file to GCP Cloud Storage
   */
  static async uploadFile(
    filePath: string,
    destination: string,
    metadata?: Record<string, string>
  ): Promise<UploadResult> {
    try {
      const options = {
        destination,
        metadata: {
          contentType: "application/pdf",
          ...metadata,
        },
        resumable: false,
      };

      const [file] = await bucket.upload(filePath, options);

      // Make the file publicly readable (optional)
      await file.makePublic();

      const [metadata_result] = await file.getMetadata();

      logger.info(`File uploaded to GCS: ${destination}`);

      return {
        filename: destination,
        url: `https://storage.googleapis.com/${bucketName}/${destination}`,
        size: parseInt(metadata_result.size?.toString() || "0"),
        bucket: bucketName,
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
    try {
      await bucket.file(filename).delete();
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
    try {
      const [metadata] = await bucket.file(filename).getMetadata();
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
    try {
      const [url] = await bucket.file(filename).getSignedUrl({
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
