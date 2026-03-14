import { create } from 'zustand';

interface JwtPayload {
  userId: string;
  familyId: string;
  role: string;
}

function decodeToken(token: string): JwtPayload | null {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part)) as JwtPayload;
  } catch {
    return null;
  }
}

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  familyId: string | null;
  role: string | null;
  isLoggedIn: boolean;
  setAuth: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  familyId: null,
  role: null,
  isLoggedIn: false,

  setAuth(accessToken, refreshToken) {
    const payload = decodeToken(accessToken);
    localStorage.setItem('ebbe_access', accessToken);
    localStorage.setItem('ebbe_refresh', refreshToken);
    set({
      accessToken,
      userId: payload?.userId ?? null,
      familyId: payload?.familyId ?? null,
      role: payload?.role ?? null,
      isLoggedIn: true,
    });
  },

  clearAuth() {
    localStorage.removeItem('ebbe_access');
    localStorage.removeItem('ebbe_refresh');
    set({ accessToken: null, userId: null, familyId: null, role: null, isLoggedIn: false });
  },

  hydrate() {
    const token = localStorage.getItem('ebbe_access');
    if (!token) return;
    const payload = decodeToken(token);
    if (!payload) return;
    // Check not expired (exp is in seconds)
    const exp = (payload as JwtPayload & { exp?: number }).exp;
    if (exp && exp * 1000 < Date.now()) return;
    set({ accessToken: token, userId: payload.userId, familyId: payload.familyId, role: payload.role, isLoggedIn: true });
  },
}));
