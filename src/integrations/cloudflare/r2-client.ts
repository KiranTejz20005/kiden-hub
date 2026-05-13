import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface R2ClientConfig {
  accountId: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucketName: string;
}

class R2Client {
  private client: S3Client;
  private bucketName: string;
  private endpoint: string;

  constructor(config: R2ClientConfig) {
    this.bucketName = config.bucketName;
    this.endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;

    this.client = new S3Client({
      region: "auto",
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.accessKeySecret,
      },
    });
  }

  /**
   * Upload a file to R2
   */
  async uploadFile(
    key: string,
    file: Blob | Buffer,
    contentType?: string
  ): Promise<{ success: boolean; publicUrl: string; error?: string }> {
    try {
      const buffer = file instanceof Blob ? await file.arrayBuffer() : file;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: new Uint8Array(buffer),
        ContentType: contentType || "application/octet-stream",
      });

      await this.client.send(command);

      // Generate public URL (R2 provides automatic public URL)
      const publicUrl = `${this.endpoint}/${this.bucketName}/${key}`;

      return {
        success: true,
        publicUrl,
      };
    } catch (error: any) {
      console.error("R2 upload error:", error);
      return {
        success: false,
        publicUrl: "",
        error: error.message || "Failed to upload file to R2",
      };
    }
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);

      return { success: true };
    } catch (error: any) {
      console.error("R2 delete error:", error);
      return {
        success: false,
        error: error.message || "Failed to delete file from R2",
      };
    }
  }

  /**
   * Generate a signed URL for temporary access
   */
  async getSignedUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<{ url: string; error?: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn,
      });

      return { url };
    } catch (error: any) {
      console.error("R2 signed URL error:", error);
      return {
        url: "",
        error: error.message || "Failed to generate signed URL",
      };
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    return `${this.endpoint}/${this.bucketName}/${key}`;
  }
}

// Initialize R2 client with environment variables
const initializeR2Client = (): R2Client => {
  const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID;
  const accessKeySecret = import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_SECRET;
  const bucketName = import.meta.env.VITE_CLOUDFLARE_R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !accessKeySecret || !bucketName) {
    console.error(
      "Cloudflare R2 configuration missing. Check .env file for: VITE_CLOUDFLARE_ACCOUNT_ID, VITE_CLOUDFLARE_ACCESS_KEY_ID, VITE_CLOUDFLARE_ACCESS_KEY_SECRET, VITE_CLOUDFLARE_R2_BUCKET_NAME"
    );
  }

  return new R2Client({
    accountId: accountId || "",
    accessKeyId: accessKeyId || "",
    accessKeySecret: accessKeySecret || "",
    bucketName: bucketName || "",
  });
};

export const r2Client = initializeR2Client();
export default R2Client;
