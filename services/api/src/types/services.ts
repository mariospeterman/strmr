import { LiveKitServerService } from '../services/livekit';
import { StripeBillingService } from '../services/stripe';
import { UsageEventEmitter } from '../services/usage';
import { ModerationService } from '../services/moderation';
import { SessionManagerService } from '../services/session-manager';
import { ObjectStoreService } from '../services/object-store';
import { OrchestratorClient } from '../services/orchestrator';

export type ServiceRegistry = {
  livekit: LiveKitServerService;
  stripe: StripeBillingService;
  usage: UsageEventEmitter;
  moderation: ModerationService;
  sessionManager: SessionManagerService;
  objectStore: ObjectStoreService;
  orchestrator: OrchestratorClient;
};
