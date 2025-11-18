import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { usageRecords } from '../db/schema';

export default fp(async (fastify: FastifyInstance) => {
  fastify.services.usage.on('usage', async (event) => {
    try {
      await fastify.db.insert(usageRecords).values({
        sessionId: event.sessionId,
        customerId: event.customerId,
        meterEvent: event.meterEvent,
        quantity: event.quantity
      });
      await fastify.services.stripe.recordUsage(event.meterEvent, event.quantity, event.customerId);
    } catch (error) {
      fastify.log.error({ error, event }, 'Failed to persist usage event');
    }
  });
});
