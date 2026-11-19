import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(1209600),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().min(1).default('cloudbox'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.preprocess((value) => {
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return value;
  }, z.boolean()).default(true),
  REDIS_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(overrides: Partial<NodeJS.ProcessEnv> = process.env): Env {
  const parsed = envSchema.safeParse({
    ...overrides,
    JWT_ACCESS_SECRET: overrides.JWT_ACCESS_SECRET || 'development-access-secret-change-before-production',
    JWT_REFRESH_SECRET: overrides.JWT_REFRESH_SECRET || 'development-refresh-secret-change-before-production',
  });
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }
  return parsed.data;
}
