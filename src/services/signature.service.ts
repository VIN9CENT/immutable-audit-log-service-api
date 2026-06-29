import { createHmac } from 'crypto';

export type SignableEvent = {
  id: string;
  timestamp: Date | string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  before_state: unknown;
  after_state: unknown;
};

export function generateSignature(data: SignableEvent, secret: string): string {
  const ISOStringTimestamp = data.timestamp instanceof Date 
    ? data.timestamp.toISOString() 
    : data.timestamp;

  const payload = JSON.stringify({
    id: data.id,
    timestamp: ISOStringTimestamp,
    actor_id: data.actor_id,
    action: data.action,
    resource_type: data.resource_type,
    resource_id: data.resource_id,
    before_state: data.before_state,
    after_state: data.after_state,
  });

  return createHmac('sha256', secret).update(payload).digest('hex');
}