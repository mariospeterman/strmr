import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { tenants, users } from '../../db/schema';
import { hashPassword, verifyPassword } from '../../utils/password';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  role: z.enum(['fan', 'creator']).default('fan'),
  displayName: z.string().min(1),
  tenantSlug: z.string().min(3).max(64),
  tenantName: z.string().min(1).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  tenantSlug: z.string().min(3).max(64)
});

export default async function authRoutes(fastify: FastifyInstance) {
  const issueToken = (user: { id: string; role: 'fan' | 'creator' | 'admin'; tenantId: string }, tenantSlug: string) =>
    fastify.jwt.sign(
      {
        sub: user.id,
        role: user.role,
        tenantId: user.tenantId,
        tenantSlug
      },
      { expiresIn: '1h' }
    );

  fastify.post('/signup', async (request, reply) => {
    const body = signUpSchema.parse(request.body);

    const [existingTenant] = await fastify.db.select().from(tenants).where(eq(tenants.slug, body.tenantSlug));
    const tenant =
      existingTenant ??
      (
        await fastify.db
          .insert(tenants)
          .values({
            name: body.tenantName ?? body.tenantSlug,
            slug: body.tenantSlug
          })
          .returning()
      )[0];

    const existingUser = await fastify.db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existingUser.length > 0) {
      return reply.code(409).send({ message: 'Email already registered' });
    }

    const passwordHash = await hashPassword(body.password);
    const stripeCustomer = await fastify.services.stripe.ensureCustomer(tenant.id, body.email, body.displayName);

    const [user] = await fastify.db
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        role: body.role,
        displayName: body.displayName,
        tenantId: tenant.id,
        stripeCustomerId: stripeCustomer.id
      })
      .returning();

    const token = issueToken(user, tenant.slug);
    return reply.code(201).send({
      token,
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        stripeCustomerId: user.stripeCustomerId
      }
    });
  });

  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const [tenant] = await fastify.db.select().from(tenants).where(eq(tenants.slug, body.tenantSlug));
    if (!tenant) {
      return reply.code(404).send({ message: 'Tenant not found' });
    }

    const [user] = await fastify.db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!user || user.tenantId !== tenant.id) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    if (!user.stripeCustomerId) {
      const customer = await fastify.services.stripe.ensureCustomer(tenant.id, user.email, user.displayName ?? undefined);
      await fastify.db.update(users).set({ stripeCustomerId: customer.id }).where(eq(users.id, user.id));
      user.stripeCustomerId = customer.id;
    }

    const token = issueToken(user, tenant.slug);
    return reply.send({
      token,
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        stripeCustomerId: user.stripeCustomerId
      }
    });
  });

  fastify.get('/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const [user] = await fastify.db.select().from(users).where(eq(users.id, request.user!.id));
    if (!user) {
      return reply.code(404).send({ message: 'User not found' });
    }
    const [tenant] = await fastify.db.select().from(tenants).where(eq(tenants.id, user.tenantId));
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        stripeCustomerId: user.stripeCustomerId
      },
      tenant
    };
  });
}
