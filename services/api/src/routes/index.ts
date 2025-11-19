import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import authRoutes from '../modules/auth/routes';
import creatorRoutes from '../modules/creators/routes';
import sessionRoutes from '../modules/sessions/routes';
import billingRoutes from '../modules/billing/routes';
import catalogRoutes from '../modules/catalog/routes';
import webhookRoutes from '../modules/webhooks/routes';
import chatRoutes from '../modules/chat/routes';
import tenantRoutes from '../modules/tenants/routes';
import subscriptionRoutes from '../modules/subscriptions/routes';

export const registerRoutes = async (fastify: FastifyInstance, _opts: FastifyPluginOptions) => {
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(tenantRoutes, { prefix: '/tenants' });
  fastify.register(creatorRoutes, { prefix: '/creators' });
  fastify.register(sessionRoutes, { prefix: '/sessions' });
  fastify.register(billingRoutes, { prefix: '/billing' });
  fastify.register(catalogRoutes, { prefix: '/catalog' });
  fastify.register(chatRoutes, { prefix: '/chat' });
  fastify.register(webhookRoutes, { prefix: '/webhooks' });
  fastify.register(subscriptionRoutes, { prefix: '/subscriptions' });
};
