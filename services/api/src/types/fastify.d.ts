import 'fastify';
import { AppEnv } from '../config/env';
import { ServiceRegistry } from './services';

declare module 'fastify' {
  interface FastifyInstance {
    config: AppEnv;
    services: ServiceRegistry;
  }

  interface FastifyRequest {
    tenantId?: string;
    user?: {
      id: string;
      role: 'fan' | 'creator' | 'admin';
      tenantId: string;
    };
  }
}
