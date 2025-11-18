export type CreateSessionResponse = {
  sessionId: string;
  roomId: string;
  joinTokens: {
    fan: string;
    agent: string;
  };
};

export type CreateSessionParams = {
  creatorId: string;
  paymentMethodId: string;
  customerEmail: string;
};

export const createSession = async (params: CreateSessionParams): Promise<CreateSessionResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!response.ok) {
    throw new Error('Failed to create session');
  }
  return response.json();
};

export const heartbeat = async (sessionId: string, minutes: number) => {
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minutes })
  });
};

export const sendTip = async (payload: { sessionId: string; amountCents: number; paymentMethodId: string; currency?: string; message?: string }) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/tip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('Failed to send tip');
  }
  return response.json();
};
