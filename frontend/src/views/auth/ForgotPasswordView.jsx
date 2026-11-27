import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Check, Sparkles } from 'lucide-react';

export default function ForgotPasswordView() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen cinematic-bg flex items-center justify-center p-6">
      <div className="glass-card p-8 rounded-2xl w-full max-w-md border border-indigo-500/30 relative overflow-hidden">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-btn mb-3 shadow-lg shadow-indigo-500/30">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Forgot Password</h1>
          <p className="text-xs text-slate-400 mt-1">Enter your registered email to receive a password reset link.</p>
        </div>

        {sent ? (
          <div className="p-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs text-center space-y-2">
            <Check className="w-6 h-6 mx-auto text-emerald-400" />
            <p className="font-bold">Password Reset Email Sent!</p>
            <p>Please check your inbox or <Link to="/reset-password" className="text-indigo-300 underline font-semibold">click here to reset password</Link>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Registered Email</label>
              <input
                type="email"
                required
                placeholder="name@kaizensprint.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full cinematic-input"
              />
            </div>
            <button type="submit" className="w-full gradient-btn text-white font-semibold py-3 rounded-xl shadow-lg">
              Send Reset Link
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          Remember password? <Link to="/login" className="text-indigo-400 font-semibold hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
