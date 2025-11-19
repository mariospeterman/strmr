import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResponse } from '../lib/api';
import { login as loginRequest, signup as signupRequest, fetchMe } from '../lib/api';

type AuthState = {
  token?: string;
  user?: AuthResponse['user'];
  tenant?: AuthResponse['tenant'];
  loading: boolean;
  login: (payload: { email: string; password: string; tenantSlug: string }) => Promise<void>;
  signup: (payload: { email: string; password: string; displayName: string; tenantSlug: string; tenantName?: string }) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = 'strmr.auth';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | undefined>();
  const [user, setUser] = useState<AuthResponse['user']>();
  const [tenant, setTenant] = useState<AuthResponse['tenant']>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      const parsed = JSON.parse(stored) as { token: string; user: AuthResponse['user']; tenant: AuthResponse['tenant'] };
      setToken(parsed.token);
      setUser(parsed.user);
      setTenant(parsed.tenant);
    }
    setLoading(false);
  }, []);

  const persist = useCallback((payload: AuthResponse) => {
    setToken(payload.token);
    setUser(payload.user);
    setTenant(payload.tenant);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  }, []);

  const login = useCallback(
    async (payload: { email: string; password: string; tenantSlug: string }) => {
      const response = await loginRequest(payload);
      persist(response);
    },
    [persist]
  );

  const signup = useCallback(
    async (payload: { email: string; password: string; displayName: string; tenantSlug: string; tenantName?: string }) => {
      const response = await signupRequest(payload);
      persist(response);
    },
    [persist]
  );

  const logout = useCallback(() => {
    setToken(undefined);
    setUser(undefined);
    setTenant(undefined);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      if (!token) return;
      try {
        const response = await fetchMe(token);
        persist({ ...response, token });
      } catch {
        logout();
      }
    };
    hydrate();
  }, [token, persist, logout]);

  const value = useMemo(
    () => ({
      token,
      user,
      tenant,
      loading,
      login,
      signup,
      logout
    }),
    [token, user, tenant, loading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};

