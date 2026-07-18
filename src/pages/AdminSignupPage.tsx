import { useState } from 'react';
import { UserPlus, Loader2, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from '../lib/router';

export function AdminSignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-ink-950 animate-fade-in">
        <div className="w-full max-w-sm rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <Check size={22} className="text-green-400" />
          </div>
          <h1 className="text-lg font-semibold text-ink-100 mb-2">Admin account created</h1>
          <p className="text-sm text-ink-400 mb-5">
            You can now sign in at the admin login page.
          </p>
          <button
            onClick={() => navigate('/admin/login')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
              <UserPlus size={15} className="text-ball-400" />
            </div>
            <h1 className="text-base font-semibold text-ink-100">Create Admin</h1>
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
                autoComplete="new-password"
                className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500 transition-colors"
                placeholder="At least 8 characters"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Confirm password</span>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                autoComplete="new-password"
                className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500 transition-colors"
                placeholder="Re-enter password"
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
              disabled={loading || !email || !password || !confirm}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
              {loading ? 'Creating…' : 'Create admin account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
