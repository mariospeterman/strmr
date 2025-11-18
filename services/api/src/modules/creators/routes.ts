import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { creators } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

const onboardSchema = z.object({
  displayName: z.string().min(1),
  bio: z.string().optional(),
  avatarMetadata: z.record(z.any()).optional(),
  stripeAccountId: z.string().optional()
});

const startCloneSchema = z.object({
  uploadId: z.string(),
  cloneOptions: z.object({
    avatarStyle: z.string(),
    voiceClone: z.boolean().default(true),
    personalityProfile: z.string().optional()
  })
});

export default async function creatorRoutes(fastify: FastifyInstance) {
  fastify.post('/:userId/onboard', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = onboardSchema.parse(request.body);
    const { userId } = request.params as { userId: string };

    const [creator] = await fastify.db
      .insert(creators)
      .values({
        userId,
        tenantId: request.user?.tenantId ?? '00000000-0000-0000-0000-000000000000',
        bio: body.bio,
        avatarMetadata: body.avatarMetadata,
        stripeAccountId: body.stripeAccountId,
        status: 'processing'
      })
      .onConflictDoUpdate({
        target: creators.userId,
        set: {
          bio: body.bio,
          avatarMetadata: body.avatarMetadata,
          stripeAccountId: body.stripeAccountId,
          status: 'processing'
        }
      })
      .returning();

    return reply.code(201).send(creator);
  });

  fastify.post('/:creatorId/upload-dataset', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { creatorId } = request.params as { creatorId: string };
    const uploadId = randomUUID();
    // Real implementation would store metadata in object storage service.
    return reply.code(202).send({ creatorId, uploadId, files: [] });
  });

  fastify.post('/:creatorId/start-clone', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { creatorId } = request.params as { creatorId: string };
    const body = startCloneSchema.parse(request.body);
    const jobId = randomUUID();

    fastify.log.info({ creatorId, jobId, body }, 'clone job queued');

    return reply.code(202).send({ jobId });
  });

  fastify.get('/:creatorId/clone-status/:jobId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const { creatorId, jobId } = request.params as { creatorId: string; jobId: string };
    const [creator] = await fastify.db.select().from(creators).where(eq(creators.id, creatorId));
    if (!creator) return reply.code(404).send({ message: 'Creator not found' });
    return { jobId, status: creator.status, artifactUrls: creator.avatarMetadata ?? {} };
  });
}
