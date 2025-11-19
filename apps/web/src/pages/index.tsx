import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { CreatorCard } from '../components/CreatorCard';
import { LiveSession } from '../components/LiveSession';
import { SessionPaywall } from '../components/SessionPaywall';
import { TipForm } from '../components/TipForm';
import { useAuth } from '../context/AuthContext';
import type { Creator } from '../lib/api';
import { createCheckout, heartbeat, listCreators } from '../lib/api';

type CallState = {
  creatorId: string;
  sessionId: string;
  token: string;
  roomUrl: string;
};

export default function Home() {
  const { token, user, tenant, login, signup, logout, loading: authLoading } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string>();
  const [call, setCall] = useState<CallState | undefined>();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ email: '', password: '', displayName: '', tenantSlug: '', tenantName: '' });

  useEffect(() => {
    if (!token) {
      setCreators([]);
      setSelectedCreator(undefined);
      setCall(undefined);
      return;
    }
    listCreators(token)
      .then(setCreators)
      .catch((err) => setStatus(err.message));
  }, [token]);

  useEffect(() => {
    if (!call || !token) return;
    const interval = setInterval(() => {
      heartbeat(token, call.sessionId, 0.25).catch(() => {});
    }, 15_000);
    return () => clearInterval(interval);
  }, [call, token]);

  const heroCta = useMemo(() => {
    if (authLoading) return 'Loading your studio...';
    if (user) return `Welcome back, ${user.displayName ?? user.email}`;
    return 'Launch your AI influencer studio';
  }, [authLoading, user]);

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (authMode === 'login') {
        await login({ email: form.email, password: form.password, tenantSlug: form.tenantSlug });
      } else {
        await signup({
          email: form.email,
          password: form.password,
          displayName: form.displayName || form.email,
          tenantSlug: form.tenantSlug,
          tenantName: form.tenantName || undefined
        });
      }
      setStatus(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  const handleSubscribe = async (creatorId: string) => {
    if (!token) return;
    try {
      const { url } = await createCheckout(token, creatorId);
      window.location.href = url;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to open checkout');
    }
  };

  const handleSessionReady = (payload: { fanToken: string; roomUrl: string; sessionId: string }) => {
    if (!selectedCreator) return;
    setStatus('Session ready — connecting to LiveKit...');
    setCall({
      creatorId: selectedCreator,
      sessionId: payload.sessionId,
      token: payload.fanToken,
      roomUrl: payload.roomUrl
    });
  };

  return (
    <>
      <Head>
        <title>strmr.ai — Multi-tenant AI influencer studio</title>
      </Head>
      <main className="landing">
        <section className="hero">
          <div>
            <p className="eyebrow">strmr.ai</p>
            <h1>Programmable AI influencer streams for every community.</h1>
            <p className="lead">
              Spin up photoreal avatars, gate access with Stripe Agent Toolkit billing, and drop them into a LiveKit-powered studio in seconds.
            </p>
            <div className="hero__cta">
              <span>{heroCta}</span>
              {user && <button onClick={logout}>Log out</button>}
            </div>
            {!user && (
              <div className="auth-panel">
                <div className="auth-tabs">
                  <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>
                    Fan / Creator Login
                  </button>
                  <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>
                    Onboard your studio
                  </button>
                </div>
                <form onSubmit={handleAuthSubmit}>
                  <label>Email</label>
                  <input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required type="email" />
                  <label>Password</label>
                  <input value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required type="password" minLength={8} />
                  {authMode === 'signup' && (
                    <>
                      <label>Display name</label>
                      <input value={form.displayName} onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))} />
                      <label>Tenant slug</label>
                      <input value={form.tenantSlug} onChange={(e) => setForm((prev) => ({ ...prev, tenantSlug: e.target.value.toLowerCase() }))} required />
                      <label>Studio name</label>
                      <input value={form.tenantName} onChange={(e) => setForm((prev) => ({ ...prev, tenantName: e.target.value }))} />
                    </>
                  )}
                  {authMode === 'login' && (
                    <>
                      <label>Tenant slug</label>
                      <input value={form.tenantSlug} onChange={(e) => setForm((prev) => ({ ...prev, tenantSlug: e.target.value.toLowerCase() }))} required />
                    </>
                  )}
                  <button type="submit">{authMode === 'login' ? 'Enter studio' : 'Create studio'}</button>
                </form>
              </div>
            )}
            {status && <p className="status">{status}</p>}
          </div>
          <div className="stats">
            <div>
              <strong>15ms</strong>
              <span>glass-to-glass latency via LiveKit SFU</span>
            </div>
            <div>
              <strong>Stripe Agent Toolkit</strong>
              <span>usage-based minutes + tipping</span>
            </div>
            <div>
              <strong>Hume EVI + Beyond Presence</strong>
              <span>emotional speech to photoreal avatar</span>
            </div>
          </div>
        </section>

        {user && (
          <>
            <section className="creators">
              <div className="section-header">
                <div>
                  <p className="eyebrow">Creator catalog</p>
                  <h2>Your AI roster</h2>
                </div>
                <p>Tenant: {tenant?.name}</p>
              </div>
              <div className="grid">
                {creators.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    id={creator.id}
                    name={String((creator.avatarMetadata as Record<string, unknown> | undefined)?.name ?? `Creator ${creator.id.slice(0, 4)}`)}
                    pricePerMinute={creator.pricePerMinute}
                    bio={creator.bio}
                    heroImageUrl={creator.heroImageUrl}
                    onStart={(id) => {
                      setSelectedCreator(id);
                    }}
                    onSubscribe={handleSubscribe}
                  />
                ))}
                {creators.length === 0 && <p>No creators yet. Use the dashboard API to register one.</p>}
              </div>
            </section>

            <section className="call">
              <div className="section-header">
                <p className="eyebrow">Call studio</p>
                <h2>Launch a session</h2>
              </div>
              {!selectedCreator && <p>Select a creator to begin billing + session setup.</p>}
              {selectedCreator && !call && token && (
                <SessionPaywall
                  creatorId={selectedCreator}
                  tenantEmail={user.email}
                  authToken={token}
                  onSessionReady={handleSessionReady}
                />
              )}
              {call && (
                <>
                  <LiveSession
                    token={call.token}
                    serverUrl={call.roomUrl}
                    onDisconnected={() => {
                      setCall(undefined);
                      setSelectedCreator(undefined);
                    }}
                  />
                  <TipForm sessionId={call.sessionId} authToken={token} />
                  <button className="ghost" onClick={() => setCall(undefined)}>
                    End session
                  </button>
                </>
              )}
            </section>
          </>
        )}

        <section className="features">
          <div>
            <h3>Stripe Agent Toolkit</h3>
            <p>Per-minute metered billing, tipping, and subscription funnels are routed through Stripe&apos;s Agent Toolkit so you can forward usage costs directly to your fans.</p>
          </div>
          <div>
            <h3>LiveKit Agents</h3>
            <p>Server-side participants stream Hume EVI emotional speech into Beyond Presence avatars and broadcast via LiveKit&apos;s SFU with full multi-tenant token gating.</p>
          </div>
          <div>
            <h3>Compliance-ready</h3>
            <p>Tenant-scoped JWTs, webhook signature validation, and role-based policies keep creators, fans, and billing data isolated out of the box.</p>
          </div>
        </section>
      </main>
    </>
  );
}
