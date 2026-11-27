import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Check } from 'lucide-react';

export default function ResetPasswordView() {
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen cinematic-bg flex items-center justify-center p-6">
      <div className="glass-card p-8 rounded-2xl w-full max-w-md border border-indigo-500/30 relative overflow-hidden">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-btn mb-3 shadow-lg shadow-indigo-500/30">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Reset Password</h1>
          <p className="text-xs text-slate-400 mt-1">Set a new password for your KaizenSprint account.</p>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs text-center space-y-2">
            <Check className="w-6 h-6 mx-auto text-emerald-400" />
            <p className="font-bold">Password Reset Successfully!</p>
            <p>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Reset Code / Token</label>
              <input
                type="text"
                required
                placeholder="Enter reset code"
                value={resetToken}
                onChange={e => setResetToken(e.target.value)}
                className="w-full cinematic-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full cinematic-input"
              />
            </div>
            <button type="submit" className="w-full gradient-btn text-white font-semibold py-3 rounded-xl shadow-lg">
              Confirm New Password
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          <Link to="/login" className="text-indigo-400 font-semibold hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
