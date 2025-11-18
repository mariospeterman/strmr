import { EventEmitter } from 'node:events';

type UsageEvent = {
  tenantId: string;
  sessionId: string;
  metric: 'minutes' | 'tokens';
  meterEvent: string;
  quantity: number;
  customerId: string;
};

export class UsageEventEmitter extends EventEmitter {
  emitUsage(event: UsageEvent) {
    this.emit('usage', event);
  }
}

export const createUsageEmitter = () => new UsageEventEmitter();
