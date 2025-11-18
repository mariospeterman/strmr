import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { users } from '../../db/schema';
import { hashPassword, verifyPassword } from '../../utils/password';
import { eq } from 'drizzle-orm';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  role: z.enum(['fan', 'creator']).default('fan'),
  displayName: z.string().min(1)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/signup', async (request, reply) => {
    const body = signUpSchema.parse(request.body);

    const passwordHash = await hashPassword(body.password);
    const [user] = await fastify.db.insert(users).values({
      email: body.email,
      passwordHash,
      role: body.role,
      displayName: body.displayName,
      tenantId: request.tenantId ?? '00000000-0000-0000-0000-000000000000'
    }).returning();

    return reply.code(201).send({
      userId: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName
    });
  });

  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const [user] = await fastify.db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (!user) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ message: 'Invalid credentials' });
    }

    const token = fastify.jwt.sign({
      sub: user.id,
      role: user.role,
      tenantId: user.tenantId
    });

    return { token, user: { id: user.id, role: user.role, displayName: user.displayName } };
  });

  fastify.post('/verify', { onRequest: [fastify.authenticate] }, async (_request, reply) => {
    // Placeholder for KYC / identity verification webhook trigger
    return reply.code(202).send({ status: 'pending' });
  });
}
