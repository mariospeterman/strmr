import 'fastify';
import type { DbClient } from '../db/client';

declare module 'fastify' {
  interface FastifyInstance {
    db: DbClient;
  }
}
