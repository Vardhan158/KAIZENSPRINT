import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, AlertCircle, ArrowRight, Lock, Mail, Eye, EyeOff, CheckCircle2, Kanban, Circle, ShieldCheck } from 'lucide-react';
import toast from './utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://kaizensprint.onrender.com/api';

export default function Login({ setToken, setCurrentUser }) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
      });
      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('jira_token', data.token);
        localStorage.setItem('jira_user', JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.name || 'User'}!`);

        if (data.user.role === 'employee' || data.user.role === 'EMPLOYEE') {
          navigate('/employee/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      } else {
        const errText = data.error || 'Invalid credentials. Please check email and password.';
        setErrorMessage(errText);
        toast.error(errText);
      }
    } catch {
      const netErr = 'Network error during sign in. Please verify connection and retry.';
      setErrorMessage(netErr);
      toast.error(netErr);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-white overflow-hidden">
      {/* LEFT SECTION: BRAND HERO & SPRINT BOARD ILLUSTRATION */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-[#172554] text-white p-12 flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#172554] via-[#1e3a8a] to-[#2563eb]">
        {/* Ambient Decorative Blur Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#4F46E5]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#2563EB]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-lg shadow-[#2563EB]/40 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">KAIZENSPRINT</span>
          </div>
          <span className="text-[11px] font-semibold bg-white/10 text-blue-200 px-3 py-1 rounded-full border border-white/15 backdrop-blur-md">
            Enterprise OS v2.5
          </span>
        </div>

        {/* Center Content & Sprint Board Illustration */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-xl">
          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Deliver High-Impact Software Sprints Faster with KaizenSprint.
            </h2>
            <p className="text-sm text-blue-100/80 leading-relaxed font-normal">
              The enterprise-grade agile operating system with real-time sprint boards, workload capacity heatmaps, and automated approval workflows.
            </p>
          </div>

          {/* Modern Sprint Board Illustration Widget */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-100">
            {/* Widget Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <Kanban className="w-4 h-4 text-blue-300" />
                <span className="font-bold text-xs text-white">Sprint 1: Core Engine Board</span>
              </div>
              <span className="text-[10px] bg-indigo-400/15 text-indigo-100 font-bold border border-indigo-300/25 px-2.5 py-1 rounded-full">
                Workflow preview
              </span>
            </div>

            {/* Columns Illustration */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              {[
                { title: 'Planned', tone: 'text-blue-200', icon: Circle, tasks: ['Shape the scope', 'Confirm owners'] },
                { title: 'In progress', tone: 'text-indigo-200', icon: Kanban, tasks: ['Build the workflow', 'Review changes'] },
                { title: 'Ready', tone: 'text-emerald-200', icon: CheckCircle2, tasks: ['Release with clarity', 'Share the outcome'] },
              ].map(({ title, tone, icon: StatusIcon, tasks }) => (
                <div key={title} className="bg-[#172554]/35 border border-white/10 p-3 rounded-xl space-y-2.5 min-w-0">
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${tone}`}>
                    <StatusIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{title}</span>
                  </div>
                  {tasks.map((task, index) => (
                    <div key={task} className="bg-white/10 p-2.5 rounded-lg border border-white/10 space-y-1.5">
                      <div className={`h-1.5 rounded-full ${index === 0 ? 'w-2/3 bg-blue-300/60' : 'w-1/2 bg-indigo-300/45'}`} />
                      <p className="text-[10px] leading-4 font-medium text-white/90">{task}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-blue-200/70 font-medium flex justify-between items-center">
          <span>KaizenSprint workspace</span>
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-blue-300" />
            <span>Secure sign-in</span>
          </span>
        </div>
      </div>

      {/* RIGHT SECTION: CLEAN ENTERPRISE LOGIN FORM */}
      <div className="w-full lg:w-1/2 xl:w-5/12 flex items-center justify-center p-6 sm:p-12 bg-slate-50/60 min-h-screen">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl border border-slate-200 shadow-xl space-y-6 relative">
          {/* Form Header */}
          <div className="space-y-1.5 text-center lg:text-left">
            <h1 className="text-2xl font-extrabold text-[#172554] tracking-tight">
              Sign In to Workspace
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Enter your corporate email and password to access KaizenSprint.
            </p>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form (20px Spacing Between Fields) */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl h-11 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#2563EB] hover:text-[#1d4ed8] font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-white text-slate-900 border border-slate-300 rounded-xl h-11 pl-11 pr-12 text-sm font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors cursor-pointer z-10"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-sm h-11 rounded-xl shadow-md shadow-[#2563EB]/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{submitting ? 'Signing in...' : 'Sign In to Workspace'}</span>
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Account Activation Footer Link */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Have an admin invitation code?{' '}
              <Link
                to="/activate-account"
                className="text-[#2563EB] hover:underline font-semibold"
              >
                Activate Employee Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
