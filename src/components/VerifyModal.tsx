import { useState } from 'react';
import { ShieldCheck, X, Lock, AlertCircle, LogOut, Loader2 } from 'lucide-react';
import { useAdmin } from '../lib/auth';

export function VerifyButton() {
  const { isAdmin, revoke } = useAdmin();
  const [open, setOpen] = useState(false);

  if (isAdmin) {
    return (
      <button
        onClick={revoke}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-ink-300 hover:text-ball-300 hover:bg-ink-800 transition-colors"
        title="Revoke admin access"
      >
        <LogOut size={15} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-ink-300 hover:text-ink-100 hover:bg-ink-800 border border-ink-700 hover:border-ink-600 transition-colors"
      >
        <ShieldCheck size={15} className="text-ink-400" />
        <span className="hidden sm:inline">Verify</span>
      </button>
      {open && <VerifyModal onClose={() => setOpen(false)} />}
    </>
  );
}

function VerifyModal({ onClose }: { onClose: () => void }) {
  const { verify } = useAdmin();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setChecking(true);
    const ok = await verify(password);
    setChecking(false);
    if (ok) {
      onClose();
    } else {
      setError(true);
      setPassword('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl animate-scale-in ${shake ? 'animate-[shake_0.4s_ease]' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={shake ? { animation: 'shake 0.4s ease' } : {}}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ball-500/15 border border-ball-500/30 flex items-center justify-center">
              <Lock size={15} className="text-ball-400" />
            </div>
            <h2 className="text-base font-semibold text-ink-100">Admin Verification</h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-ink-500 hover:text-ink-100 hover:bg-ink-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <p className="text-sm text-ink-400">Enter the admin password to unlock editing.</p>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Password</span>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              autoComplete="current-password"
              className={`bg-ink-800 border rounded-lg px-3 py-2.5 text-sm text-ink-100 placeholder-ink-500 focus:outline-none transition-colors ${
                error ? 'border-ball-500 focus:border-ball-400' : 'border-ink-700 focus:border-ball-500'
              }`}
              placeholder="••••••••••••"
            />
          </label>

          {error && (
            <div className="flex items-center gap-2 text-sm text-ball-300">
              <AlertCircle size={15} className="shrink-0" />
              Incorrect password.
            </div>
          )}

          <button
            type="submit"
            disabled={checking || !password}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {checking ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            {checking ? 'Checking…' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
}
