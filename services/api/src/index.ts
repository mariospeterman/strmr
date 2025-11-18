import dotenv from 'dotenv';
import path from 'node:path';
import { buildServer } from './app';
import { loadEnv } from './config/env';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const env = loadEnv();
const server = buildServer(env);

const start = async () => {
  try {
    await server.listen({ port: env.PORT, host: '0.0.0.0' });
    server.log.info(`API listening on :${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

void start();
