const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
};

const request = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Request failed');
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
};

export type AuthResponse = {
  token: string;
  tenant: { id: string; slug: string; name: string };
  user: {
    id: string;
    email: string;
    role: 'fan' | 'creator' | 'admin';
    displayName?: string | null;
    stripeCustomerId?: string | null;
  };
};

export const signup = (payload: { email: string; password: string; displayName: string; tenantSlug: string; tenantName?: string }) =>
  request<AuthResponse>('/auth/signup', { method: 'POST', body: payload });

export const login = (payload: { email: string; password: string; tenantSlug: string }) =>
  request<AuthResponse>('/auth/login', { method: 'POST', body: payload });

export type MeResponse = Omit<AuthResponse, 'token'>;

export const fetchMe = (token: string) => request<MeResponse>('/auth/me', { token });

export type Creator = {
  id: string;
  displayName: string | null;
  bio: string | null;
  heroImageUrl: string | null;
  livekitRoomSlug: string | null;
  pricePerMinute: number;
  status: string;
  avatarMetadata: Record<string, unknown> | null;
};

export const listCreators = (token: string, query?: string) =>
  request<Creator[]>(`/catalog/creators${query ? `?query=${encodeURIComponent(query)}` : ''}`, { token });

export type CreatorDataset = {
  id: string;
  objectKey: string;
  status: string;
  sizeBytes?: number | null;
  checksum?: string | null;
  contentType?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatorProfile = Creator & {
  humeVoiceId?: string | null;
  beyondPresenceAvatarId?: string | null;
  persona?: Record<string, unknown> | null;
  datasets: CreatorDataset[];
  lastCloneJobId?: string | null;
  lastCloneStatus?: string | null;
  lastCloneAt?: string | null;
};

export const fetchCreatorProfile = (token: string) => request<CreatorProfile>('/creators/me', { token });

export const updateCreatorProfile = (
  token: string,
  creatorId: string,
  payload: Partial<{
    displayName: string;
    bio: string;
    heroImageUrl: string;
    pricePerMinute: number;
    humeVoiceId: string;
    beyondPresenceAvatarId: string;
    persona: Record<string, unknown>;
  }>
) => request(`/creators/${creatorId}`, { method: 'PATCH', token, body: payload });

export const requestDatasetUpload = (
  token: string,
  creatorId: string,
  payload: { filename: string; contentType: string }
) => request<{ uploadUrl: string; dataset: CreatorDataset }>(`/creators/${creatorId}/assets/uploads`, {
  method: 'POST',
  token,
  body: payload
});

export const completeDatasetUpload = (
  token: string,
  creatorId: string,
  datasetId: string,
  payload: { sizeBytes: number; checksum?: string }
) => request<CreatorDataset>(`/creators/${creatorId}/assets/${datasetId}/complete`, {
  method: 'POST',
  token,
  body: payload
});

export const listCreatorDatasets = (token: string, creatorId: string) =>
  request<CreatorDataset[]>(`/creators/${creatorId}/assets`, { token });

export const startCloneJob = (token: string, creatorId: string, datasetId: string) =>
  request<{ jobId: string }>(`/creators/${creatorId}/start-clone`, { method: 'POST', token, body: { datasetId } });

export const fetchCloneStatus = (token: string, creatorId: string, jobId: string) =>
  request<{ status: string; result?: unknown }>(`/creators/${creatorId}/clone-status/${jobId}`, { token });

export type CreateSessionResponse = {
  sessionId: string;
  roomId: string;
  joinTokens: {
    fan: string;
    agent: string;
  };
};

export const createSession = (token: string, params: { creatorId: string; paymentMethodId: string; customerEmail: string }) =>
  request<CreateSessionResponse>('/sessions', { method: 'POST', token, body: params });

export const heartbeat = (token: string, sessionId: string, minutes: number) =>
  request<void>(`/sessions/${sessionId}/heartbeat`, { method: 'POST', token, body: { minutes } });

export const terminateSession = (token: string, sessionId: string) =>
  request<void>(`/sessions/${sessionId}/terminate`, { method: 'POST', token });

export const createCheckout = (token: string, creatorId: string) =>
  request<{ url: string }>('/subscriptions/checkout', {
    method: 'POST',
    token,
    body: { creatorId, successPath: '/dashboard', cancelPath: '/' }
  });

export const openBillingPortal = (token: string) => request<{ url: string }>('/subscriptions/portal', { method: 'POST', token });

export const sendTip = (token: string, payload: { sessionId: string; amountCents: number; paymentMethodId: string; currency?: string; message?: string }) =>
  request('/chat/tip', { method: 'POST', token, body: payload });
