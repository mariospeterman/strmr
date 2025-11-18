import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { AppEnv } from '../config/env';
import * as schema from './schema';

export const createDb = (env: AppEnv) => {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  return { db, pool };
};

export type DbClient = ReturnType<typeof createDb>['db'];
