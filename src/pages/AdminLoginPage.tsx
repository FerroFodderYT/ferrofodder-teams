import { useEffect, useState } from 'react';
import { Lock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAdmin } from '../lib/auth';
import { useNavigate } from '../lib/router';

export function AdminLoginPage() {
  const { signIn, isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) navigate('/');
  }, [isAdmin, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
      setPassword('');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-ink-950 animate-fade-in">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100 transition-colors mb-6"
        >
          <ArrowLeft size={15} />
          Back to site
        </button>

        <div className="rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl animate-scale-in">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-ink-800">
            <div className="w-8 h-8 rounded-lg bg-ball-500/15 border border-ball-500/30 flex items-center justify-center">
              <Lock size={15} className="text-ball-400" />
            </div>
            <h1 className="text-base font-semibold text-ink-100">Admin Login</h1>
          </div>

          <form onSubmit={submit} className="p-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Email</span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                autoComplete="email"
                className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500 transition-colors"
                placeholder="admin@example.com"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                autoComplete="current-password"
                className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500 transition-colors"
                placeholder="••••••••••••"
              />
            </label>

            {error && (
              <div className="flex items-center gap-2 text-sm text-ball-300">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
