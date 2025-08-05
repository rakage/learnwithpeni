import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ServerSideEncryption,
  createPresignedPost,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// AWS S3 Configuration
export const AWS_CONFIG = {
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  bucketName: process.env.AWS_S3_BUCKET_NAME!,
};

// Initialize S3 Client
const s3Client = new S3Client({
  region: AWS_CONFIG.region,
  credentials: {
    accessKeyId: AWS_CONFIG.accessKeyId,
    secretAccessKey: AWS_CONFIG.secretAccessKey,
  },
});

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export class S3Helper {
  // Upload file to S3
  static async uploadFile(
    file: File | Buffer,
    key: string,
    contentType?: string
  ): Promise<UploadResult> {
    try {
      console.log(`📤 Uploading file to S3: ${key}`);

      // Validate bucket name
      if (!AWS_CONFIG.bucketName) {
        const error =
          "AWS S3 bucket name is not configured. Please check your environment variables.";
        console.error("❌ S3 Configuration Error:", {
          bucketName: AWS_CONFIG.bucketName,
          rawBucketName: process.env.AWS_S3_BUCKET_NAME,
          allEnvVars: {
            AWS_REGION: process.env.AWS_REGION,
            AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID
              ? "SET"
              : "NOT SET",
            AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
              ? "SET"
              : "NOT SET",
            AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
          },
        });
        return {
          success: false,
          error,
        };
      }

      // Convert File to Buffer to avoid streaming issues
      let fileBody: Buffer;
      if (file instanceof File) {
        console.log(
          `🔄 Converting File to Buffer for upload: ${file.name} (${file.size} bytes)`
        );
        const arrayBuffer = await file.arrayBuffer();
        fileBody = Buffer.from(arrayBuffer);
      } else {
        fileBody = file;
      }

      const uploadParams = {
        Bucket: AWS_CONFIG.bucketName,
        Key: key,
        Body: fileBody,
        ContentType:
          contentType ||
          (file instanceof File ? file.type : "application/octet-stream"),
        CacheControl: "max-age=31536000", // Cache for 1 year
        ServerSideEncryption: ServerSideEncryption.AES256, // Server-side encryption
      };

      console.log(`🚀 Starting S3 upload for key: ${key}`);
      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      const url = this.getPublicUrl(key);

      console.log(`✅ File uploaded successfully: ${url}`);
      return {
        success: true,
        url,
        key,
      };
    } catch (error) {
      console.error("❌ S3 upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown upload error",
      };
    }
  }

  // Get public URL for a file
  static getPublicUrl(key: string): string {
    return `https://${AWS_CONFIG.bucketName}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`;
  }

  // Generate pre-signed URL for secure uploads (alternative method)
  static async generatePresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600 // 1 hour
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: AWS_CONFIG.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }
  
  // Generate pre-signed POST for direct browser uploads
  static async createPresignedPost(
    key: string,
    contentType: string,
    maxFileSize: number = 8000000, // 8MB default
    expiresIn: number = 600 // 10 minutes
  ): Promise<{
    url: string;
    fields: Record<string, string>;
  }> {
    if (!AWS_CONFIG.bucketName) {
      throw new Error("AWS S3 bucket name is not configured");
    }

    // Create the presigned POST request
    const presignedPost = await createPresignedPost(s3Client, {
      Bucket: AWS_CONFIG.bucketName,
      Key: key,
      Conditions: [
        ["content-length-range", 1024, maxFileSize], // Min 1KB, Max from parameter
        ["eq", "$Content-Type", contentType],
      ],
      Fields: {
        "Content-Type": contentType,
        "x-amz-server-side-encryption": "AES256",
      },
      Expires: expiresIn,
    });

    return presignedPost;
  }

  // Delete file from S3
  static async deleteFile(key: string): Promise<boolean> {
    try {
      console.log(`🗑️ Deleting file from S3: ${key}`);

      const command = new DeleteObjectCommand({
        Bucket: AWS_CONFIG.bucketName,
        Key: key,
      });

      await s3Client.send(command);
      console.log(`✅ File deleted successfully: ${key}`);
      return true;
    } catch (error) {
      console.error("❌ S3 delete error:", error);
      return false;
    }
  }

  // Generate unique file path
  static generateFilePath(
    category: "videos" | "documents" | "images" | "archives" | "other",
    originalFileName: string,
    courseId?: string
  ): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalFileName.split(".").pop();
    const sanitizedName = originalFileName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .substring(0, 50);

    const fileName = `${timestamp}-${randomString}-${sanitizedName}`;

    if (courseId) {
      return `courses/${courseId}/${category}/${fileName}`;
    }

    return `course-content/${category}/${fileName}`;
  }

  // Get file category based on MIME type
  static getFileCategory(
    mimeType: string
  ): "videos" | "documents" | "images" | "archives" | "other" {
    if (mimeType.startsWith("video/")) return "videos";
    if (mimeType.startsWith("image/")) return "images";
    if (
      mimeType.includes("pdf") ||
      mimeType.includes("document") ||
      mimeType.includes("text") ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("presentation")
    )
      return "documents";
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("7z")
    )
      return "archives";
    return "other";
  }

  // Upload with automatic path generation
  static async uploadCourseFile(
    file: File,
    courseId?: string
  ): Promise<UploadResult> {
    const category = this.getFileCategory(file.type);
    const filePath = this.generateFilePath(category, file.name, courseId);

    return await this.uploadFile(file, filePath, file.type);
  }

  // Validate AWS configuration
  static validateConfig(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!AWS_CONFIG.accessKeyId) missing.push("AWS_ACCESS_KEY_ID");
    if (!AWS_CONFIG.secretAccessKey) missing.push("AWS_SECRET_ACCESS_KEY");
    if (!AWS_CONFIG.bucketName) missing.push("AWS_S3_BUCKET_NAME");
    if (!AWS_CONFIG.region) missing.push("AWS_REGION");

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  // Test S3 connection
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to list objects to test connection
      const { S3Client, ListObjectsV2Command } = await import(
        "@aws-sdk/client-s3"
      );

      const command = new ListObjectsV2Command({
        Bucket: AWS_CONFIG.bucketName,
        MaxKeys: 1,
      });

      await s3Client.send(command);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown connection error",
      };
    }
  }
}

export default S3Helper;
