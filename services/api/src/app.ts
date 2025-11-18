import Fastify from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import rawBody from 'fastify-raw-body';
import type { AppEnv } from './config/env';
import { createDb } from './db/client';
import authPlugin from './plugins/auth';
import servicesPlugin from './plugins/services';
import usageListener from './plugins/usage-listener';
import { registerRoutes } from './routes';

export const buildServer = (env: AppEnv) => {
  const fastify = Fastify({
    logger: true
  });

  fastify.decorate('config', env);

  const { db } = createDb(env);
  fastify.decorate('db', db);

  fastify.register(cors, { origin: true, credentials: true });
  fastify.register(sensible);
  fastify.register(websocket);
  fastify.register(swagger, {
    openapi: {
      info: {
        title: 'strmr.ai API',
        version: '0.1.0'
      }
    }
  });
  fastify.register(swaggerUi, {
    routePrefix: '/docs'
  });
  fastify.register(rawBody, {
    field: 'rawBody',
    global: true,
    runFirst: true
  });

  fastify.register(authPlugin);
  fastify.register(servicesPlugin);
  fastify.register(usageListener);

  fastify.register(registerRoutes, { prefix: '/v1' });

  return fastify;
};
