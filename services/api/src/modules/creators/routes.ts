import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { creatorDatasets, creators } from '../../db/schema';

const profileSchema = z.object({
  displayName: z.string().min(1).optional(),
  bio: z.string().optional(),
  heroImageUrl: z.string().url().optional(),
  pricePerMinute: z.coerce.number().int().min(100).max(10_000).optional(),
  humeVoiceId: z.string().optional(),
  beyondPresenceAvatarId: z.string().optional(),
  persona: z.record(z.any()).optional()
});

const datasetUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1).default('application/octet-stream')
});

const datasetCompleteSchema = z.object({
  sizeBytes: z.coerce.number().int().positive(),
  checksum: z.string().optional()
});

const cloneRequestSchema = z.object({
  datasetId: z.string().uuid()
});

const creatorResponse = async (fastify: FastifyInstance, creatorId: string) => {
  const [creator] = await fastify.db.select().from(creators).where(eq(creators.id, creatorId));
  if (!creator) {
    return null;
  }
  const datasetsList = await fastify.db
    .select()
    .from(creatorDatasets)
    .where(eq(creatorDatasets.creatorId, creatorId));
  return {
    ...creator,
    datasets: datasetsList
  };
};

const ensureCreatorOwnership = async (fastify: FastifyInstance, creatorId: string, user: { tenantId: string }) => {
  const [creator] = await fastify.db
    .select()
    .from(creators)
    .where(and(eq(creators.id, creatorId), eq(creators.tenantId, user.tenantId)));
  if (!creator) {
    throw fastify.httpErrors.notFound('Creator not found');
  }
  return creator;
};

export default async function creatorRoutes(fastify: FastifyInstance) {
  fastify.post('/:userId/onboard', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const body = profileSchema.extend({ stripeAccountId: z.string().optional() }).parse(request.body);
    const { userId } = request.params as { userId: string };
    const tenantId = request.user?.tenantId ?? '';

    const [creator] = await fastify.db
      .insert(creators)
      .values({
        userId,
        tenantId,
        displayName: body.displayName,
        bio: body.bio,
        heroImageUrl: body.heroImageUrl,
        pricePerMinute: body.pricePerMinute ?? 500,
        avatarMetadata: body.persona,
        humeVoiceId: body.humeVoiceId,
        beyondPresenceAvatarId: body.beyondPresenceAvatarId,
        persona: body.persona,
        stripeAccountId: body.stripeAccountId,
        status: 'processing'
      })
      .onConflictDoUpdate({
        target: creators.userId,
        set: {
          displayName: body.displayName,
          bio: body.bio,
          heroImageUrl: body.heroImageUrl,
          pricePerMinute: body.pricePerMinute,
          avatarMetadata: body.persona,
          humeVoiceId: body.humeVoiceId,
          beyondPresenceAvatarId: body.beyondPresenceAvatarId,
          persona: body.persona,
          stripeAccountId: body.stripeAccountId,
          status: 'processing'
        }
      })
      .returning();

    return reply.code(201).send(creator);
  });

  fastify.get('/me', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
    const [creator] = await fastify.db
      .select()
      .from(creators)
      .where(and(eq(creators.userId, request.user.id), eq(creators.tenantId, request.user.tenantId)));
    if (!creator) return reply.code(404).send({ message: 'Creator profile not found' });
    const enriched = await creatorResponse(fastify, creator.id);
    return enriched;
  });

  fastify.patch('/:creatorId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
    const { creatorId } = request.params as { creatorId: string };
    const body = profileSchema.parse(request.body);
    await ensureCreatorOwnership(fastify, creatorId, request.user);

    const [updated] = await fastify.db
      .update(creators)
      .set({
        displayName: body.displayName,
        bio: body.bio,
        heroImageUrl: body.heroImageUrl,
        pricePerMinute: body.pricePerMinute,
        humeVoiceId: body.humeVoiceId,
        beyondPresenceAvatarId: body.beyondPresenceAvatarId,
        persona: body.persona
      })
      .where(eq(creators.id, creatorId))
      .returning();

    return reply.send(updated);
  });

  fastify.get('/:creatorId/assets', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
    const { creatorId } = request.params as { creatorId: string };
    await ensureCreatorOwnership(fastify, creatorId, request.user);
    const datasetsList = await fastify.db
      .select()
      .from(creatorDatasets)
      .where(eq(creatorDatasets.creatorId, creatorId));
    return datasetsList;
  });

  fastify.post('/:creatorId/assets/uploads', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
    const { creatorId } = request.params as { creatorId: string };
    const payload = datasetUploadSchema.parse(request.body);
    await ensureCreatorOwnership(fastify, creatorId, request.user);

    const objectKey = `creators/${creatorId}/${randomUUID()}-${payload.filename}`;
    const upload = await fastify.services.objectStore.getUploadUrl(objectKey, payload.contentType);
    const [dataset] = await fastify.db
      .insert(creatorDatasets)
      .values({
        tenantId: request.user.tenantId,
        creatorId,
        objectKey,
        contentType: payload.contentType,
        status: 'pending'
      })
      .returning();

    return reply.code(201).send({ uploadUrl: upload.url, dataset });
  });

  fastify.post('/:creatorId/assets/:datasetId/complete', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
    const payload = datasetCompleteSchema.parse(request.body);
    const { creatorId, datasetId } = request.params as { creatorId: string; datasetId: string };
    await ensureCreatorOwnership(fastify, creatorId, request.user);

    const [updated] = await fastify.db
      .update(creatorDatasets)
      .set({
        status: 'uploaded',
        sizeBytes: payload.sizeBytes,
        checksum: payload.checksum,
        updatedAt: new Date()
      })
      .where(and(eq(creatorDatasets.id, datasetId), eq(creatorDatasets.creatorId, creatorId)))
      .returning();

    if (!updated) return reply.code(404).send({ message: 'Dataset not found' });
    return updated;
  });

  fastify.post('/:creatorId/start-clone', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
    const { creatorId } = request.params as { creatorId: string };
    const body = cloneRequestSchema.parse(request.body);
    const creator = await ensureCreatorOwnership(fastify, creatorId, request.user);

    const [dataset] = await fastify.db
      .select()
      .from(creatorDatasets)
      .where(and(eq(creatorDatasets.id, body.datasetId), eq(creatorDatasets.creatorId, creatorId)));
    if (!dataset) return reply.code(404).send({ message: 'Dataset not found' });
    if (dataset.status !== 'uploaded' && dataset.status !== 'ready') {
      return reply.code(400).send({ message: 'Dataset is not ready for cloning' });
    }

    const jobId = randomUUID();
    await fastify.services.orchestrator.enqueueCloneJob({
      jobId,
      creatorId,
      tenantId: creator.tenantId,
      datasetKey: dataset.objectKey,
      humeVoiceId: creator.humeVoiceId,
      beyondPresenceAvatarId: creator.beyondPresenceAvatarId,
      persona: creator.persona
    });

    await fastify.db
      .update(creators)
      .set({ lastCloneJobId: jobId, lastCloneStatus: 'processing', lastCloneAt: new Date() })
      .where(eq(creators.id, creatorId));

    await fastify.db
      .update(creatorDatasets)
      .set({ status: 'processing', updatedAt: new Date(), lastJobId: jobId })
      .where(eq(creatorDatasets.id, dataset.id));

    return reply.code(202).send({ jobId });
  });

  fastify.get('/:creatorId/clone-status/:jobId', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    if (!request.user) return reply.code(401).send({ message: 'Unauthorized' });
    const { creatorId, jobId } = request.params as { creatorId: string; jobId: string };
    await ensureCreatorOwnership(fastify, creatorId, request.user);
    try {
      const status = await fastify.services.orchestrator.getJobStatus(jobId);
      const normalized = status.status?.toLowerCase?.() ?? 'unknown';
      if (normalized === 'success' || normalized === 'ready') {
        await fastify.db
          .update(creators)
          .set({ lastCloneStatus: 'ready', lastCloneAt: new Date() })
          .where(eq(creators.id, creatorId));
        await fastify.db
          .update(creatorDatasets)
          .set({ status: 'ready', updatedAt: new Date() })
          .where(and(eq(creatorDatasets.creatorId, creatorId), eq(creatorDatasets.lastJobId, jobId)));
      } else if (normalized === 'failure' || normalized === 'failed') {
        await fastify.db
          .update(creators)
          .set({ lastCloneStatus: 'failed', lastCloneAt: new Date() })
          .where(eq(creators.id, creatorId));
        await fastify.db
          .update(creatorDatasets)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(and(eq(creatorDatasets.creatorId, creatorId), eq(creatorDatasets.lastJobId, jobId)));
      }
      return status;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Unable to fetch clone status' });
    }
  });
}
