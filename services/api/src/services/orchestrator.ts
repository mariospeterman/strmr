import type { AppEnv } from '../config/env';

export type OrchestratorClient = ReturnType<typeof createOrchestratorClient>;

export type CloneJobRequest = {
  jobId: string;
  creatorId: string;
  tenantId: string;
  datasetKey: string;
  humeVoiceId?: string | null;
  beyondPresenceAvatarId?: string | null;
  persona?: Record<string, unknown> | null;
};

export const createOrchestratorClient = (env: AppEnv) => {
  const baseUrl = env.ORCHESTRATOR_URL.replace(/\/$/, '');

  const enqueueCloneJob = async (payload: CloneJobRequest) => {
    const response = await fetch(`${baseUrl}/jobs/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: payload.jobId,
        creator_id: payload.creatorId,
        tenant_id: payload.tenantId,
        dataset_key: payload.datasetKey,
        hume_voice_id: payload.humeVoiceId,
        beyond_presence_avatar_id: payload.beyondPresenceAvatarId,
        persona: payload.persona
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to enqueue clone job: ${text || response.statusText}`);
    }

    return response.json() as Promise<{ task_id: string }>;
  };

  const getJobStatus = async (taskId: string) => {
    const response = await fetch(`${baseUrl}/jobs/${taskId}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch job status: ${text || response.statusText}`);
    }
    return response.json() as Promise<{ status: string; result?: unknown }>;
  };

  return {
    enqueueCloneJob,
    getJobStatus
  };
};

