import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from '../../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://kaizensprint.onrender.com/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://kaizensprint.onrender.com';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function EmployeeTimeLogsView({ token }) {
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ taskId: '', hours: '', note: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/v1/work-logs/my`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load assigned tasks.');
      setTasks(data.tasks || []); setLogs(data.logs || []); setError('');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [token]);
  useEffect(() => {
    if (!token) return undefined;
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on('work_log_logged', load);
    return () => { socket.off('work_log_logged', load); socket.disconnect(); };
  }, [token]);

  const validHours = Number.isFinite(Number(form.hours)) && Number(form.hours) >= 0.5 && Number(form.hours) <= 24;
  const canSubmit = Boolean(form.taskId && validHours && !submitting);
  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true); setError('');
    try {
      const response = await fetch(`${API_BASE}/v1/work-logs/my`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ taskId: form.taskId, hours: Number(form.hours), note: form.note }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to log working hours.');
      setForm({ taskId: '', hours: '', note: '' }); await load(); toast.success('Working hours logged successfully.');
    } catch (err) { setError(err.message); toast.error(err.message); } finally { setSubmitting(false); }
  };

  return <div className="space-y-8 font-sans max-w-3xl mx-auto"><div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6"><div><h2 className="text-2xl font-extrabold text-[#0F172A]">Log Working Hours</h2><p className="text-xs text-[#475569] mt-1">Record hours against tasks assigned to your account.</p></div>{error && <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">{error}</div>}<form onSubmit={submit} className="space-y-4 text-xs"><div><label className={labelClass}>Select Task *</label><select required value={form.taskId} onChange={e => setForm({ ...form, taskId: e.target.value })} className={inputClass} disabled={loading}><option value="">{loading ? 'Loading assigned tasks…' : 'Select assigned task...'}</option>{tasks.map(task => <option key={task._id} value={task._id}>{task.taskId}: {task.title}</option>)}</select></div><div><label className={labelClass}>Hours Spent *</label><input type="number" step="0.5" min="0.5" max="24" required value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} className={inputClass} placeholder="0.5 to 24" /></div><div><label className={labelClass}>Work Description / Note</label><textarea rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputClass} placeholder="Describe the work completed..." /></div><button type="submit" disabled={!canSubmit} className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-6 py-3 text-sm font-semibold shadow-sm transition w-full disabled:opacity-60 disabled:cursor-not-allowed">{submitting ? 'Logging...' : 'Log Working Hours'}</button></form></div><div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6"><div><h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2"><Clock className="w-5 h-5 text-[#2563EB]" />My Time Log History ({logs.length})</h3><p className="text-xs text-[#475569] mt-0.5">Entries synchronized with MongoDB Atlas.</p></div>{logs.length === 0 ? <div className="p-12 text-center text-xs text-[#475569]">No time log history recorded yet.</div> : <div className="space-y-3">{logs.map((log, index) => <div key={log._id || index} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="flex items-center gap-2"><span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{log.taskId}</span><h4 className="font-bold text-[#0F172A] text-xs">{log.taskTitle}</h4></div><p className="text-xs text-[#475569] mt-1">{log.note || log.description || 'No description provided.'}</p></div><div className="flex items-center gap-4 text-xs"><span className="font-bold text-[#2563EB] bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">{log.hours} hrs</span><span className="text-slate-500">{new Date(log.loggedAt || log.createdAt).toLocaleDateString()}</span></div></div>)}</div>}</div></div>;
}
