import { useEffect, useMemo, useState } from 'react';
import { Clock, MessageSquare, X } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function DailyProgressView({ token }) {
  const [filters, setFilters] = useState({ employeeId: 'All', projectId: 'All', sprintId: 'All', date: '' });
  const [feed, setFeed] = useState({ employees: [], projects: [], sprints: [], dates: [], submissions: [] });
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const loadFeed = async () => {
    if (!token) return;
    setState('loading');
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value && value !== 'All') params.set(key, value); });
    try {
      const response = await fetch(`${API_BASE}/v1/standups/admin-feed?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load standup feed.');
      setFeed(data); setState('ready'); setError('');
    } catch (requestError) { setError(requestError.message); setState('error'); }
  };
  useEffect(() => { loadFeed(); }, [token, filters.employeeId, filters.projectId, filters.sprintId, filters.date]);
  useEffect(() => {
    if (!token) return undefined;
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on('progress_logged', loadFeed);
    return () => { socket.off('progress_logged', loadFeed); socket.disconnect(); };
  }, [token, filters.employeeId, filters.projectId, filters.sprintId, filters.date]);
  const availableSprints = useMemo(() => feed.sprints.filter(s => filters.projectId === 'All' || String(s.projectId?._id || s.projectId) === String(filters.projectId)), [feed.sprints, filters.projectId]);
  const setFilter = (key, value) => setFilters(current => ({ ...current, [key]: value, ...(key === 'projectId' ? { sprintId: 'All' } : {}) }));
  const clear = () => setFilters({ employeeId: 'All', projectId: 'All', sprintId: 'All', date: '' });
  return <div className="space-y-6 font-sans"><div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm"><h2 className="text-2xl font-extrabold text-[#0F172A]">Admin Daily Standups (Read-Only)</h2><p className="text-xs text-[#475569] mt-1">Live employee submissions from MongoDB Atlas.</p></div><div className="rounded-2xl p-4 border border-slate-200 bg-white shadow-sm flex flex-wrap items-center gap-3 text-xs"><FilterSelect label="Employee" value={filters.employeeId} onChange={v => setFilter('employeeId', v)} options={feed.employees} optionLabel={e => e.name} /><FilterSelect label="Project" value={filters.projectId} onChange={v => setFilter('projectId', v)} options={feed.projects} optionLabel={p => p.name} /><FilterSelect label="Sprint" value={filters.sprintId} onChange={v => setFilter('sprintId', v)} options={availableSprints} optionLabel={s => s.name} /><label className="flex items-center gap-2 font-semibold text-[#475569]">Date<select value={filters.date} onChange={e => setFilter('date', e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium"><option value="">All Dates</option>{feed.dates.map(date => <option key={date} value={date}>{date}</option>)}</select></label><button type="button" onClick={clear} className="ml-auto rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 font-semibold text-[#475569] flex items-center gap-1"><X className="w-3.5 h-3.5" />Clear Filters</button></div><div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-6"><div className="flex items-center justify-between border-b border-slate-200 pb-4"><h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2"><MessageSquare className="w-5 h-5 text-purple-600" />Centralized Team Standup Feed ({feed.submissions.length})</h3><span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-bold">Read-Only Admin View</span></div>{state === 'loading' ? <div className="py-16 text-center text-sm text-slate-500">Loading standup submissions…</div> : state === 'error' ? <div className="py-16 text-center text-sm text-rose-700">{error}</div> : feed.submissions.length === 0 ? <div className="py-16 text-center"><Clock className="mx-auto h-6 w-6 text-[#2563EB]" /><h3 className="mt-4 text-lg font-bold text-[#0F172A]">No standup logs found</h3><p className="mt-2 text-sm text-[#475569]">No submissions match the selected filters.</p></div> : <div className="space-y-4 max-h-[750px] overflow-y-auto pr-2">{feed.submissions.map(log => <StandupCard key={log._id} log={log} />)}</div>}</div></div>;
}
function FilterSelect({ label, value, onChange, options, optionLabel }) { return <label className="flex items-center gap-2 font-semibold text-[#475569]">{label}<select value={value} onChange={e => onChange(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium"><option value="All">All {label}s</option>{options.map(option => <option key={option._id} value={option._id}>{optionLabel(option)}</option>)}</select></label>; }
function StandupCard({ log }) { const task = log.relatedTaskId; const project = task?.projectId; const sprint = task?.sprintId; return <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3"><div className="flex items-center justify-between pb-3 border-b border-slate-200"><div className="flex items-center gap-3">{log.userId?.avatar ? <img src={log.userId.avatar} alt={log.userId.name} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">{(log.userId?.name || '?').slice(0, 1).toUpperCase()}</div>}<div><h4 className="text-sm font-bold text-[#0F172A]">{log.userId?.name || 'Unknown employee'}</h4><p className="text-[10px] text-[#475569]">{project?.name || 'No project'} · {sprint?.name || 'No sprint'} · Submitted {new Date(log.createdAt).toLocaleString()}</p></div></div><span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-bold">{log.hoursWorked || 0} hrs</span></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"><Work label="Completed Work" value={log.yesterday} color="text-emerald-700" /><Work label="Planned Work" value={log.today} color="text-[#2563EB]" /></div><div className="text-xs bg-slate-100 text-slate-800 p-3.5 rounded-xl border border-slate-200"><span className="font-bold text-slate-700 uppercase block">Blockers</span><p className="mt-1 text-[#0F172A]">{log.blockers || 'None'}</p></div></div>; }
function Work({ label, value, color }) { return <div className="rounded-xl border border-slate-200 bg-white p-3.5"><span className={`font-bold ${color} uppercase block`}>{label}</span><p className="mt-1 text-[#0F172A] leading-relaxed">{value || 'None'}</p></div>; }
