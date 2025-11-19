import { S3Client, S3ClientConfig, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AppEnv } from '../config/env';

export type ObjectStoreService = ReturnType<typeof createObjectStoreService>;

export const createObjectStoreService = (env: AppEnv) => {
  const config: S3ClientConfig = {
    region: env.OBJECT_STORE_REGION ?? 'us-east-1'
  };

  if (env.OBJECT_STORE_ENDPOINT) {
    config.endpoint = env.OBJECT_STORE_ENDPOINT;
    config.forcePathStyle = true;
  }

  if (env.OBJECT_STORE_ACCESS_KEY_ID && env.OBJECT_STORE_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: env.OBJECT_STORE_ACCESS_KEY_ID,
      secretAccessKey: env.OBJECT_STORE_SECRET_ACCESS_KEY
    };
  }

  const client = new S3Client(config);

  const getUploadUrl = async (key: string, contentType: string, expiresInSeconds = 60 * 10) => {
    const command = new PutObjectCommand({
      Bucket: env.OBJECT_STORE_BUCKET,
      Key: key,
      ContentType: contentType
    });

    const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    return { url, key, expiresAt: Date.now() + expiresInSeconds * 1000 };
  };

  const getDownloadUrl = async (key: string, expiresInSeconds = 60 * 10) => {
    const command = new GetObjectCommand({
      Bucket: env.OBJECT_STORE_BUCKET,
      Key: key
    });
    const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    return { url, key, expiresAt: Date.now() + expiresInSeconds * 1000 };
  };

  return {
    bucket: env.OBJECT_STORE_BUCKET,
    getUploadUrl,
    getDownloadUrl
  };
};

