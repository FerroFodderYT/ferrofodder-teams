import { useState } from 'react';
import { Lock, ShieldCheck, Loader2, AlertCircle, KeyRound, ArrowLeft, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../lib/auth';
import { useNavigate } from '../lib/router';

type Step = 'credentials' | 'enroll-qr' | 'enroll-verify' | 'verify' | 'done';

export function AdminLoginPage() {
  const { refresh } = useAdmin();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal.currentLevel === 'aal2') {
      await refresh();
      navigate('/');
      return;
    }

    const { data: factors } = await supabase.auth.mfa.listFactors();
    const unverified = factors.unverified ?? [];
    const verified = factors.totp ?? [];

    if (verified.length > 0) {
      setStep('verify');
      return;
    }

    if (unverified.length > 0) {
      const f = unverified[0];
      setFactorId(f.id);
      const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: f.id });
      if (challenge) setStep('enroll-verify');
      return;
    }

    const { data: newFactor, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (enrollError) {
      setError(enrollError.message);
      return;
    }
    setFactorId(newFactor.id);
    setQrUrl(newFactor.totp.qr ?? null);
    setStep('enroll-qr');
  };

  const submitEnrollCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setLoading(true);
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: (await supabase.auth.mfa.challenge({ factorId })).data!.id,
      code,
    });
    setLoading(false);
    if (verifyError) {
      setError('Invalid code. Try again.');
      setCode('');
      return;
    }
    await refresh();
    setStep('done');
    setTimeout(() => navigate('/'), 1200);
  };

  const submitVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors.totp ?? [];
      if (verified.length > 0) setFactorId(verified[0].id);
    }
    if (!factorId) {
      setError('No authenticator factor found.');
      return;
    }
    setError(null);
    setLoading(true);
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setLoading(false);
      setError(challengeError.message);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    setLoading(false);
    if (verifyError) {
      setError('Incorrect code. Try again.');
      setCode('');
      return;
    }
    await refresh();
    setStep('done');
    setTimeout(() => navigate('/'), 1000);
  };

  const copySecret = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-ink-950 animate-fade-in">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100 mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to site
        </button>

        <div className="rounded-2xl border border-ink-800 bg-ink-900 shadow-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-5 border-b border-ink-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ball-500/15 border border-ball-500/30 flex items-center justify-center">
                <Lock size={18} className="text-ball-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-ink-100">Admin Sign In</h1>
                <p className="text-xs text-ink-500">Authorized personnel only</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {step === 'credentials' && (
              <form onSubmit={login} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Email</span>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500"
                    placeholder="admin@example.com"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wider text-ink-400">Password</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-sm text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500"
                    placeholder="••••••••••••"
                  />
                </label>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-ball-300">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                  {loading ? 'Signing in…' : 'Continue'}
                </button>
              </form>
            )}

            {step === 'enroll-qr' && (
              <div className="flex flex-col gap-4">
                <div className="text-sm text-ink-300">
                  <p className="font-medium text-ink-100 mb-1">Set up two-factor authentication</p>
                  <p className="text-ink-400 text-xs leading-relaxed">
                    Scan this QR code with Google Authenticator or Authy. This is required for admin access and will only be shown once.
                  </p>
                </div>

                {qrUrl && (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                      alt="TOTP QR code"
                      className="w-48 h-48 rounded-lg bg-white p-2"
                    />
                    <button
                      onClick={copySecret}
                      className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-100"
                    >
                      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy secret URI'}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setStep('enroll-verify')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 transition-colors"
                >
                  <KeyRound size={15} />
                  I've scanned it
                </button>
              </div>
            )}

            {step === 'enroll-verify' && (
              <form onSubmit={submitEnrollCode} className="flex flex-col gap-4">
                <div className="text-sm text-ink-300">
                  <p className="font-medium text-ink-100 mb-1">Enter your 6-digit code</p>
                  <p className="text-ink-400 text-xs">From Google Authenticator or Authy.</p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-center text-lg tracking-[0.4em] text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500"
                  placeholder="000000"
                />
                {error && (
                  <div className="flex items-start gap-2 text-sm text-ball-300">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                  {loading ? 'Verifying…' : 'Verify & Sign In'}
                </button>
              </form>
            )}

            {step === 'verify' && (
              <form onSubmit={submitVerifyCode} className="flex flex-col gap-4">
                <div className="text-sm text-ink-300">
                  <p className="font-medium text-ink-100 mb-1">Two-factor authentication</p>
                  <p className="text-ink-400 text-xs">Enter the 6-digit code from your authenticator app.</p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="bg-ink-800 border border-ink-700 rounded-lg px-3 py-2.5 text-center text-lg tracking-[0.4em] text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ball-500"
                  placeholder="000000"
                />
                {error && (
                  <div className="flex items-start gap-2 text-sm text-ball-300">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-ink-100 bg-ball-500 hover:bg-ball-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                  {loading ? 'Verifying…' : 'Verify'}
                </button>
              </form>
            )}

            {step === 'done' && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <ShieldCheck size={24} className="text-green-400" />
                </div>
                <p className="text-sm font-medium text-ink-100">Signed in. Redirecting…</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
