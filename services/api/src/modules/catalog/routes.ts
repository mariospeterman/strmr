import type { FastifyInstance } from 'fastify';
import { eq, like } from 'drizzle-orm';
import { creators, sessions } from '../../db/schema';

export default async function catalogRoutes(fastify: FastifyInstance) {
  fastify.get('/creators', async (request) => {
    const { query } = request.query as { query?: string };
    const baseQuery = fastify.db
      .select({
        id: creators.id,
        name: creators.id,
        status: creators.status,
        pricePerMin: creators.pricePerMinute,
        avatarMetadata: creators.avatarMetadata
      })
      .from(creators);
    const rows = await (query ? baseQuery.where(like(creators.bio, `%${query}%`)) : baseQuery);
    return rows;
  });

  fastify.get('/creator/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const [row] = await fastify.db.select().from(creators).where(eq(creators.id, id));
    if (!row) return reply.code(404).send({ message: 'Creator not found' });
    const liveSessions = await fastify.db.select().from(sessions).where(eq(sessions.creatorId, id));
    return { ...row, liveSessions };
  });
}
