import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sessions } from '../../db/schema';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

const createSessionSchema = z.object({
  creatorId: z.string().uuid(),
  mode: z.enum(['one2one', 'one2many']).default('one2one'),
  paymentMethodId: z.string(),
  customerEmail: z.string().email()
});

const heartbeatSchema = z.object({
  minutes: z.number().positive(),
  meterEvent: z.string().default('live_minutes')
});

export default async function sessionRoutes(fastify: FastifyInstance) {
  fastify.post('/', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = createSessionSchema.parse(request.body);
    const roomId = `session-${randomUUID()}`;

    await fastify.services.livekit.ensureRoom(roomId, { creatorId: body.creatorId, mode: body.mode });

    const customer = await fastify.services.stripe.ensureCustomer(
      request.user?.tenantId ?? 'tenant-default',
      body.customerEmail
    );

    await fastify.services.stripe.createPreAuthorization(customer.id, fastify.config.STRIPE_PRICE_PER_MINUTE ?? '');

    const [session] = await fastify.db.insert(sessions).values({
      roomId,
      creatorId: body.creatorId,
      fanId: request.user?.id ?? '00000000-0000-0000-0000-000000000000',
      tenantId: request.user?.tenantId ?? 'tenant-default',
      billingCustomerId: customer.id,
      status: 'created'
    }).returning();

    const fanToken = fastify.services.livekit.createToken({
      roomName: roomId,
      identity: `fan-${session.fanId}`,
      metadata: { role: 'fan', sessionId: session.id }
    });

    const agentToken = fastify.services.livekit.createToken({
      roomName: roomId,
      identity: `agent-${body.creatorId}`,
      metadata: { role: 'agent', sessionId: session.id }
    });

    await fastify.services.sessionManager.enqueueAgentStart({
      sessionId: session.id,
      roomId,
      agentToken,
      creatorId: body.creatorId
    });

    return reply.code(201).send({
      sessionId: session.id,
      roomId,
      joinTokens: {
        fan: fanToken,
        agent: agentToken
      }
    });
  });

  fastify.post('/:sessionId/join', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const [session] = await fastify.db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return reply.code(404).send({ message: 'Session not found' });

    const token = fastify.services.livekit.createToken({
      roomName: session.roomId,
      identity: `${request.user?.role}-${request.user?.id}`,
      metadata: { role: request.user?.role, sessionId }
    });

    return { livekitToken: token, roomName: session.roomId };
  });

  fastify.post('/:sessionId/heartbeat', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const body = heartbeatSchema.parse(request.body);

    const [session] = await fastify.db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return reply.code(404).send({ message: 'Session not found' });

    const newMinutes = (session.minutesConsumed ?? 0) + body.minutes;
    await fastify.db.update(sessions).set({ minutesConsumed: newMinutes, status: 'active' }).where(eq(sessions.id, sessionId));

    fastify.services.usage.emitUsage({
      tenantId: session.tenantId,
      sessionId: session.id,
      metric: 'minutes',
      meterEvent: body.meterEvent,
      quantity: body.minutes,
      customerId: session.billingCustomerId ?? ''
    });

    return reply.code(204).send();
  });

  fastify.post('/:sessionId/terminate', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const [session] = await fastify.db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return reply.code(404).send({ message: 'Session not found' });
    await fastify.services.livekit.endRoom(session.roomId).catch(() => undefined);
    await fastify.db.update(sessions).set({ status: 'ended', endedAt: new Date() }).where(eq(sessions.id, sessionId));
    if (session.minutesConsumed && session.billingCustomerId) {
      fastify.services.usage.emitUsage({
        tenantId: session.tenantId,
        sessionId: session.id,
        metric: 'minutes',
        meterEvent: 'live_minutes_final',
        quantity: session.minutesConsumed,
        customerId: session.billingCustomerId
      });
    }
    return reply.code(204).send();
  });
}
