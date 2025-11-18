import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { tips, moderationEvents } from '../../db/schema';

const tipSchema = z.object({
  sessionId: z.string().uuid(),
  paymentMethodId: z.string(),
  amountCents: z.number().int().positive(),
  currency: z.string().default('usd'),
  message: z.string().max(300).optional()
});

export default async function chatRoutes(fastify: FastifyInstance) {
  fastify.get('/ws', { websocket: true }, (connection, request) => {
    connection.socket.on('message', (raw) => {
      void (async () => {
        const message = JSON.parse(raw.toString());
        const text = typeof message.text === 'string' ? message.text : '';
        const moderation = await fastify.services.moderation.moderateText(text);
        if (moderation.flagged) {
          await fastify.db.insert(moderationEvents).values({
            sessionId: message.sessionId,
            messageId: message.messageId ?? randomUUID(),
            label: Object.keys(moderation.categories).find((key) => moderation.categories[key]) ?? 'flagged',
            severity: 1,
            payload: moderation
          });
          connection.socket.send(JSON.stringify({ type: 'chat.moderation', reason: moderation.categories }));
          return;
        }

        const payload = {
          ...message,
          from: request.user?.id ?? 'anonymous',
          tenantId: request.user?.tenantId ?? 'tenant-default'
        };
        connection.socket.send(JSON.stringify(payload));
      })().catch((error) => fastify.log.error({ error }, 'chat handler error'));
    });
  });

  fastify.post('/tip', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = tipSchema.parse(request.body);

    const paymentIntent = await fastify.services.stripe.client.paymentIntents.create({
      amount: body.amountCents,
      currency: body.currency,
      payment_method: body.paymentMethodId,
      confirm: true,
      metadata: {
        sessionId: body.sessionId,
        type: 'tip'
      }
    });

    const [tip] = await fastify.db
      .insert(tips)
      .values({
        sessionId: body.sessionId,
        senderId: request.user?.id ?? 'anonymous',
        amountCents: body.amountCents,
        currency: body.currency,
        message: body.message
      })
      .returning();

    return reply.code(201).send({ tipId: tip.id, status: paymentIntent.status });
  });
}
