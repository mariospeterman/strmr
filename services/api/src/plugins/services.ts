import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { createLiveKitService } from '../services/livekit';
import { createStripeBillingService } from '../services/stripe';
import { createUsageEmitter } from '../services/usage';
import { createModerationService } from '../services/moderation';
import { createSessionManager } from '../services/session-manager';
import { createObjectStoreService } from '../services/object-store';
import { createOrchestratorClient } from '../services/orchestrator';

export default fp(async (fastify: FastifyInstance) => {
  const livekit = createLiveKitService(fastify.config);
  const stripe = createStripeBillingService(fastify.config);
  const usage = createUsageEmitter();
  const moderation = createModerationService(fastify.config);
  const sessionManager = createSessionManager(fastify.config);
  const objectStore = createObjectStoreService(fastify.config);
  const orchestrator = createOrchestratorClient(fastify.config);

  fastify.decorate('services', {
    livekit,
    stripe,
    usage,
    moderation,
    sessionManager,
    objectStore,
    orchestrator
  });
});
