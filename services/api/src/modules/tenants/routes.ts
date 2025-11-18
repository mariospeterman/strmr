import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { tenants } from '../../db/schema';
import { eq } from 'drizzle-orm';

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1)
});

export default async function tenantRoutes(fastify: FastifyInstance) {
  fastify.post('/', async (request, reply) => {
    const body = createTenantSchema.parse(request.body);
    const [tenant] = await fastify.db.insert(tenants).values(body).returning();
    return reply.code(201).send(tenant);
  });

  fastify.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const [tenant] = await fastify.db.select().from(tenants).where(eq(tenants.slug, slug));
    if (!tenant) return reply.code(404).send({ message: 'Tenant not found' });
    return tenant;
  });
}
