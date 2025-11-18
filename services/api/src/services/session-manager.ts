import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import type { AppEnv } from '../config/env';

export type SessionManagerService = ReturnType<typeof createSessionManager>;

export const createSessionManager = (env: AppEnv) => {
  const connection = new IORedis(env.REDIS_URL);

  const sessionQueue = new Queue('session-start', {
    connection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 100
    }
  });

  const enqueueAgentStart = async (payload: {
    sessionId: string;
    roomId: string;
    agentToken: string;
    creatorId: string;
  }) => {
    await sessionQueue.add('agent-start', payload, {
      attempts: 3
    });
  };

  return {
    enqueueAgentStart,
    queue: sessionQueue
  };
};
