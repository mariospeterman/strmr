import type { FastifyInstance, FastifyRequest } from 'fastify';
import Stripe from 'stripe';

export default async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post('/stripe', async (request, reply) => {
    const signature = request.headers['stripe-signature'];
    if (!signature) return reply.code(400).send({ message: 'Missing signature' });

    const rawBody = (request as FastifyRequest & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(request.body));

    let event: Stripe.Event;
    try {
      event = fastify.services.stripe.client.webhooks.constructEvent(
        rawBody,
        signature,
        fastify.config.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      return reply.code(400).send({ message: 'Invalid signature' });
    }

    fastify.log.info({ type: event.type }, 'stripe webhook received');

    switch (event.type) {
      case 'meter.event.summary.available': {
        const summary = event.data.object as Stripe.MeterEventSummary;
        fastify.log.info({ summary }, 'meter summary ready');
        break;
      }
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        if (intent.metadata?.sessionId) {
          fastify.log.info({ sessionId: intent.metadata.sessionId, intent: intent.id }, 'tip payment confirmed');
        }
        break;
      }
      default:
        fastify.log.debug({ type: event.type }, 'unhandled stripe event');
    }

    return reply.code(200).send({ received: true });
  });
}
