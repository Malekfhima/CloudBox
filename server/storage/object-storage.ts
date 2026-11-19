import crypto from 'node:crypto';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Env } from '../config/env';

export class ObjectStorage {
  private readonly client: S3Client;

  constructor(private readonly env: Env) {
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials:
        env.S3_ACCESS_KEY && env.S3_SECRET_KEY
          ? { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY }
          : undefined,
    });
  }

  createObjectKey(userId: string, originalName: string): string {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180);
    return `users/${userId}/${crypto.randomUUID()}/${safeName}`;
  }

  async createUploadUrl(objectKey: string, mimeType: string, sizeBytes: number) {
    const command = new PutObjectCommand({
      Bucket: this.env.S3_BUCKET,
      Key: objectKey,
      ContentType: mimeType,
      ContentLength: sizeBytes,
    });
    return getSignedUrl(this.client, command, { expiresIn: 900 });
  }

  async createDownloadUrl(objectKey: string, fileName: string) {
    const command = new GetObjectCommand({
      Bucket: this.env.S3_BUCKET,
      Key: objectKey,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    });
    return getSignedUrl(this.client, command, { expiresIn: 300 });
  }

  async downloadObject(objectKey: string): Promise<Uint8Array> {
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.env.S3_BUCKET,
      Key: objectKey,
    }));
    if (!response.Body) throw new Error('Object body is unavailable');
    return response.Body.transformToByteArray();
  }

  async uploadObject(objectKey: string, body: Uint8Array, mimeType: string) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.env.S3_BUCKET,
      Key: objectKey,
      Body: body,
      ContentType: mimeType,
    }));
  }

  async verifyObject(objectKey: string, expectedSize: number, sha256?: string) {
    const head = await this.client.send(new HeadObjectCommand({
      Bucket: this.env.S3_BUCKET,
      Key: objectKey,
    }));
    if (head.ContentLength !== expectedSize) {
      throw new Error('Object size does not match the completed upload');
    }
    if (sha256 && head.ChecksumSHA256 !== sha256) {
      throw new Error('Object checksum does not match the completed upload');
    }
  }

  async deleteObject(objectKey: string) {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.env.S3_BUCKET,
      Key: objectKey,
    }));
  }
}
