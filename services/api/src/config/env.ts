import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
  REDIS_URL: z.string().min(1),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
  LIVEKIT_HOST: z.string().url().optional(),
  LIVEKIT_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_PER_MINUTE: z.string().optional(),
  HUME_API_KEY: z.string().min(1),
  HUME_CLIENT_ID: z.string().optional(),
  HUME_CLIENT_SECRET: z.string().optional(),
  BEYOND_PRESENCE_API_KEY: z.string().min(1),
  BEYOND_PRESENCE_AVATAR_ID: z.string().optional(),
  OBJECT_STORE_BUCKET: z.string().min(1),
  OBJECT_STORE_ENDPOINT: z.string().url().optional(),
  OBJECT_STORE_REGION: z.string().optional(),
  OBJECT_STORE_ACCESS_KEY_ID: z.string().optional(),
  OBJECT_STORE_SECRET_ACCESS_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  QDRANT_URL: z.string().url().default('http://localhost:6333'),
  QDRANT_API_KEY: z.string().optional(),
  APP_URL: z.string().url().default('http://localhost:3000'),
  ORCHESTRATOR_URL: z.string().url().default('http://localhost:8000')
});

export type AppEnv = z.infer<typeof envSchema> & { LIVEKIT_HOST: string };

export const loadEnv = (overrides?: Record<string, string | undefined>): AppEnv => {
  const result = envSchema.safeParse({
    ...process.env,
    ...overrides
  });

  if (!result.success) {
    console.error('Invalid environment configuration', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  const data = result.data;
  if (!data.LIVEKIT_HOST) {
    if (data.LIVEKIT_URL) {
      data.LIVEKIT_HOST = data.LIVEKIT_URL;
    } else {
      throw new Error('LIVEKIT_HOST or LIVEKIT_URL must be provided');
    }
  }
  return data;
};
