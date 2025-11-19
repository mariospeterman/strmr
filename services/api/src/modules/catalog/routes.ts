import type { FastifyInstance } from 'fastify';
import { and, eq, like } from 'drizzle-orm';
import { creators, sessions, tenants } from '../../db/schema';

export default async function catalogRoutes(fastify: FastifyInstance) {
  fastify.get('/creators', { onRequest: [fastify.authenticate] }, async (request) => {
    const { query } = request.query as { query?: string };
    const rows = await fastify.db
      .select({
        id: creators.id,
        bio: creators.bio,
        heroImageUrl: creators.heroImageUrl,
        livekitRoomSlug: creators.livekitRoomSlug,
        pricePerMinute: creators.pricePerMinute,
        status: creators.status,
        avatarMetadata: creators.avatarMetadata
      })
      .from(creators)
      .where(
        and(
          eq(creators.tenantId, request.user!.tenantId),
          query ? like(creators.bio ?? '', `%${query}%`) : undefined
        )
      );
    return rows;
  });

  fastify.get('/creator/:id', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [row] = await fastify.db
      .select({
        creator: creators,
        tenant: tenants
      })
      .from(creators)
      .innerJoin(tenants, eq(tenants.id, creators.tenantId))
      .where(and(eq(creators.id, id), eq(creators.tenantId, request.user!.tenantId)));
    if (!row) return reply.code(404).send({ message: 'Creator not found' });
    const liveSessions = await fastify.db.select().from(sessions).where(eq(sessions.creatorId, id));
    return { ...row.creator, tenant: row.tenant, liveSessions };
  });
}
