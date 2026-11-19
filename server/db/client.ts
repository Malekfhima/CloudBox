import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://cloudbox:cloudbox@localhost:5432/cloudbox';

export const sql = new Pool({
  connectionString,
  max: Number(process.env.DATABASE_POOL_MAX || 10),
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000,
});

export const db = drizzle(sql, { schema });
