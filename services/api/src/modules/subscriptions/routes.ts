import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { creators, users } from '../../db/schema';
import { eq } from 'drizzle-orm';

const checkoutSchema = z.object({
  creatorId: z.string().uuid(),
  successPath: z.string().default('/dashboard'),
  cancelPath: z.string().default('/')
});

export default async function subscriptionRoutes(fastify: FastifyInstance) {
  fastify.post('/checkout', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = checkoutSchema.parse(request.body);
    if (request.user?.role !== 'fan') {
      return reply.code(403).send({ message: 'Only fans can subscribe' });
    }

    const [creator] = await fastify.db.select().from(creators).where(eq(creators.id, body.creatorId));
    if (!creator) {
      return reply.code(404).send({ message: 'Creator not found' });
    }

    const [fan] = await fastify.db.select().from(users).where(eq(users.id, request.user.id));
    if (!fan?.stripeCustomerId) {
      return reply.code(400).send({ message: 'Fan missing Stripe customer id' });
    }

    const displayName =
      typeof creator.avatarMetadata?.name === 'string' ? (creator.avatarMetadata.name as string) : creator.heroImageUrl ?? creator.id;
    const { price } = await fastify.services.stripe.ensureCreatorPrice(creator.id, displayName, creator.pricePerMinute);

    const session = await fastify.services.stripe.createCheckoutSession({
      customerId: fan.stripeCustomerId,
      priceId: price.id,
      creatorId: creator.id,
      successUrl: `${fastify.config.APP_URL}${body.successPath}?status=success`,
      cancelUrl: `${fastify.config.APP_URL}${body.cancelPath}?status=cancelled`
    });

    return { url: session.url };
  });

  fastify.post('/portal', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const [user] = await fastify.db.select().from(users).where(eq(users.id, request.user!.id));
    if (!user?.stripeCustomerId) {
      return reply.code(400).send({ message: 'Missing customer' });
    }
    const portal = await fastify.services.stripe.createBillingPortalSession(user.stripeCustomerId, `${fastify.config.APP_URL}/dashboard`);
    return { url: portal.url };
  });
}

