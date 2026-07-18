import { createContext, useContext, useState, type ReactNode } from 'react';

const SESSION_KEY = 'ff_admin';
const SESSION_PW_KEY = 'ff_admin_pw';

interface AdminContextValue {
  isAdmin: boolean;
  verify: (password: string) => Promise<boolean>;
  revoke: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
  });

  const verify = async (password: string): Promise<boolean> => {
    try {
      const res = await adminCall({ action: 'ping', password });
      if (res.ok) {
        setIsAdmin(true);
        try {
          sessionStorage.setItem(SESSION_KEY, '1');
          // Store password in sessionStorage so subsequent writes can use it.
          // sessionStorage is tab-scoped and not accessible cross-origin.
          sessionStorage.setItem(SESSION_PW_KEY, password);
        } catch { /* ignore */ }
        return true;
      }
    } catch { /* network error */ }
    return false;
  };

  const revoke = () => {
    setIsAdmin(false);
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_PW_KEY);
    } catch { /* ignore */ }
  };

  return (
    <AdminContext.Provider value={{ isAdmin, verify, revoke }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}

// ---------------------------------------------------------------------------
// Shared helper — calls the teams-admin edge function.
// Automatically injects the stored admin password.
// Returns { ok: true, data } on success, { ok: false, error } on failure.
// ---------------------------------------------------------------------------
export async function adminCall(
  body: Record<string, unknown>
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  // Read the password from sessionStorage if not already in the payload.
  let payload = body;
  if (!payload.password) {
    try {
      const pw = sessionStorage.getItem(SESSION_PW_KEY);
      if (pw) payload = { ...body, password: pw };
    } catch { /* ignore */ }
  }

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/teams-admin`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.error) {
    return { ok: false, error: json.error ?? `HTTP ${res.status}` };
  }
  return { ok: true, data: json };
}
