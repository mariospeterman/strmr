import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const preauthorizeSchema = z.object({
  customerId: z.string(),
  paymentMethodId: z.string(),
  priceId: z.string()
});

const usageSchema = z.object({
  sessionId: z.string(),
  customerId: z.string(),
  meterEvent: z.string(),
  quantity: z.number().positive()
});

export default async function billingRoutes(fastify: FastifyInstance) {
  fastify.post('/preauthorize', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = preauthorizeSchema.parse(request.body);
    const intent = await fastify.services.stripe.createPreAuthorization(body.customerId, body.priceId);
    return reply.code(201).send(intent);
  });

  fastify.post('/usage', async (request, reply) => {
    const body = usageSchema.parse(request.body);
    fastify.services.usage.emitUsage({
      tenantId: request.user?.tenantId ?? 'tenant-default',
      sessionId: body.sessionId,
      metric: 'minutes',
      meterEvent: body.meterEvent,
      quantity: body.quantity,
      customerId: body.customerId
    });
    await fastify.services.stripe.recordUsage(body.meterEvent, body.quantity, body.customerId);
    return reply.code(202).send({ status: 'recorded' });
  });
}
