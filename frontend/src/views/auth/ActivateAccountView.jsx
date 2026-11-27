import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Key } from 'lucide-react';

export default function ActivateAccountView() {
  const [searchParams] = useSearchParams();
  const [activationCode, setActivationCode] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  const handleActivate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/v1/auth/activate-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: activationCode, newPassword })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to activate account.');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen cinematic-bg flex items-center justify-center p-6">
      <div className="glass-card p-8 rounded-2xl w-full max-w-md border border-indigo-500/30 relative overflow-hidden">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-btn mb-3 shadow-lg shadow-indigo-500/30">
            <Key className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Activate Employee Account</h1>
          <p className="text-xs text-slate-400 mt-1">Enter your activation code sent via email to set your password.</p>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs text-center space-y-2">
            <Check className="w-6 h-6 mx-auto text-emerald-400" />
            <p className="font-bold">Account Activated Successfully!</p>
            <p>Redirecting to login page...</p>
          </div>
        ) : (
          <form onSubmit={handleActivate} className="space-y-4">
            {error && <p className="rounded-xl border border-rose-500/40 bg-rose-500/20 p-3 text-xs text-rose-200">{error}</p>}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Activation Code / Employee ID</label>
              <input
                type="text"
                required
                placeholder="EMP-2025-XXXX"
                value={activationCode}
                onChange={e => setActivationCode(e.target.value)}
                className="w-full cinematic-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Create Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full cinematic-input"
              />
            </div>
            <button disabled={submitting} type="submit" className="w-full gradient-btn text-white font-semibold py-3 rounded-xl shadow-lg disabled:opacity-60">
              {submitting ? 'Activating…' : 'Activate Account'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          Already activated? <Link to="/login" className="text-indigo-400 font-semibold hover:underline">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
