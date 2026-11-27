import { useEffect, useMemo, useState } from 'react';
import { Bug, CheckCircle2, Clock3, Eye, Plus, Search, ShieldAlert, X } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from '../../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://kaizensprint.onrender.com/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://kaizensprint.onrender.com';
const statuses = ['Reported', 'Triaged', 'Assigned', 'In Progress', 'Retesting', 'Closed', 'Reopened'];
const severities = ['Minor', 'Major', 'Critical', 'Blocker'];
const field = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function EmployeeBugsView({ currentUser, bugs = [], projects = [], token, fetchAllData }) {
  const userId = currentUser?.id || currentUser?._id;
  const [tab, setTab] = useState('assigned');
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('All');
  const [status, setStatus] = useState('All');
  const [reportOpen, setReportOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState({ title: '', projectId: '', severity: 'Major', environment: 'Testing', description: '', stepsToReproduce: '', expectedResult: '', actualResult: '' });

  const assigned = bugs.filter(b => String(b.assignedTo?._id || b.assignedTo) === String(userId));
  const reported = bugs.filter(b => String(b.reportedBy?._id || b.reportedBy) === String(userId));
  const resolved = assigned.filter(b => b.workflowStatus === 'Closed');
  const counts = { assigned: assigned.length, progress: assigned.filter(b => b.workflowStatus === 'In Progress').length, retesting: assigned.filter(b => b.workflowStatus === 'Retesting').length, closed: resolved.length };
  const source = tab === 'assigned' ? assigned : tab === 'reported' ? reported : resolved;
  const visible = useMemo(() => source.filter(b => (!search.trim() || `${b.bugId} ${b.title} ${b.description}`.toLowerCase().includes(search.toLowerCase())) && (severity === 'All' || b.severity === severity) && (status === 'All' || b.workflowStatus === status)), [source, search, severity, status]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(SOCKET_URL, { auth: { token } });
    const refresh = () => fetchAllData?.();
    socket.on('bug_created', refresh); socket.on('bug_updated', refresh);
    return () => { socket.off('bug_created', refresh); socket.off('bug_updated', refresh); socket.disconnect(); };
  }, [token, fetchAllData]);

  const submitReport = async e => {
    e.preventDefault();
    if (!report.title.trim() || !report.projectId || !report.description.trim()) return toast.warning('Title, project and description are required.');
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/bugs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(report) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to report bug.');
      setReportOpen(false); setReport({ title: '', projectId: '', severity: 'Major', environment: 'Testing', description: '', stepsToReproduce: '', expectedResult: '', actualResult: '' }); fetchAllData?.(); toast.success('Bug reported successfully.');
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const openBug = bug => { setSelected(bug); setResolutionNotes(bug.resolutionNotes || ''); setEvidence(null); };
  const updateBug = async workflowStatus => {
    if (!selected) return;
    setSaving(true);
    try {
      const body = new FormData(); body.append('workflowStatus', workflowStatus); body.append('resolutionNotes', resolutionNotes); if (evidence) body.append('evidence', evidence);
      const response = await fetch(`${API_BASE}/bugs/${selected._id}/work`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Unable to update bug.');
      setSelected(data); setEvidence(null); fetchAllData?.(); toast.success('Bug update submitted for Admin verification.');
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return <div className="space-y-6 font-sans"><header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Bug & Defect Management</h2><p className="mt-1 text-xs text-[#475569]">Track assigned defects, submit fixes, and follow verification progress.</p></div><button type="button" onClick={() => setReportOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700"><Plus className="h-4 w-4" /> Report Bug</button></header>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<ShieldAlert className="h-5 w-5" />} label="Assigned Bugs" value={counts.assigned} tone="text-indigo-600" /><Metric icon={<Clock3 className="h-5 w-5" />} label="In Progress" value={counts.progress} tone="text-purple-600" /><Metric icon={<Eye className="h-5 w-5" />} label="Retesting" value={counts.retesting} tone="text-amber-600" /><Metric icon={<CheckCircle2 className="h-5 w-5" />} label="Closed Bugs" value={counts.closed} tone="text-emerald-600" /></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4"><Tab active={tab === 'assigned'} onClick={() => setTab('assigned')}>Assigned Bugs</Tab><Tab active={tab === 'reported'} onClick={() => setTab('reported')}>My Reported Bugs</Tab><Tab active={tab === 'resolved'} onClick={() => setTab('resolved')}>Resolved Bugs</Tab></div><div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bug ID, title or description..." className={`${field} pl-9`} /></div><select value={severity} onChange={e => setSeverity(e.target.value)} className={field + ' md:w-44'}><option value="All">All Severities</option>{severities.map(v => <option key={v}>{v}</option>)}</select><select value={status} onChange={e => setStatus(e.target.value)} className={field + ' md:w-44'}><option value="All">All Statuses</option>{statuses.map(v => <option key={v}>{v}</option>)}</select></div>{visible.length === 0 ? <Empty tab={tab} /> : <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">{visible.map(bug => <BugCard key={bug._id} bug={bug} assigned={assigned.some(a => a._id === bug._id)} onOpen={() => openBug(bug)} />)}</div>}</section>
    {reportOpen && <ReportModal report={report} setReport={setReport} projects={projects} saving={saving} onClose={() => setReportOpen(false)} onSubmit={submitReport} />}
    {selected && <ResolveModal bug={selected} notes={resolutionNotes} setNotes={setResolutionNotes} evidence={evidence} setEvidence={setEvidence} saving={saving} onClose={() => setSelected(null)} onUpdate={updateBug} />}
  </div>;
}

function Metric({ icon, label, value, tone }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-3 flex items-center justify-between ${tone}`}><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>{icon}</div><strong className="text-3xl font-extrabold text-[#0F172A]">{value}</strong></div>; }
function Tab({ active, onClick, children }) { return <button type="button" onClick={onClick} className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${active ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}>{children}</button>; }
function Empty({ tab }) { return <div className="p-16 text-center text-sm text-slate-500"><Bug className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3">{tab === 'assigned' ? 'No bugs are currently assigned to you.' : tab === 'reported' ? 'You have not reported any bugs yet.' : 'No resolved bugs found.'}</p></div>; }
function BugCard({ bug, assigned, onOpen }) { return <article className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-600">{bug.bugId}</span><span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">{bug.severity}</span></div><h3 className="mt-2 text-sm font-bold text-[#0F172A]">{bug.title}</h3></div><span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase text-indigo-700">{bug.workflowStatus}</span></div><p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#475569]">{bug.description}</p><div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-xs"><span className="text-slate-500">{bug.projectId?.name || 'Project'}</span>{assigned && <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-2 font-semibold text-white hover:bg-indigo-700"><Eye className="h-3.5 w-3.5" /> View & Resolve</button>}</div></article>; }

function ReportModal({ report, setReport, projects, saving, onClose, onSubmit }) { const set = (key, value) => setReport({ ...report, [key]: value }); return <Modal title="Report a Bug" onClose={onClose}><form onSubmit={onSubmit} className="space-y-4 text-xs"><Input label="Bug Title *" value={report.title} onChange={v => set('title', v)} /><div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block font-semibold uppercase tracking-wide text-slate-500">Project *</span><select required value={report.projectId} onChange={e => set('projectId', e.target.value)} className={field}><option value="">Select project</option>{projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select></label><label><span className="mb-1.5 block font-semibold uppercase tracking-wide text-slate-500">Severity</span><select value={report.severity} onChange={e => set('severity', e.target.value)} className={field}>{severities.map(v => <option key={v}>{v}</option>)}</select></label></div><TextArea label="Description *" value={report.description} onChange={v => set('description', v)} required /><TextArea label="Steps to Reproduce" value={report.stepsToReproduce} onChange={v => set('stepsToReproduce', v)} /><div className="grid grid-cols-2 gap-3"><Input label="Expected Result" value={report.expectedResult} onChange={v => set('expectedResult', v)} /><Input label="Actual Result" value={report.actualResult} onChange={v => set('actualResult', v)} /></div><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600">Cancel</button><button disabled={saving} className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? 'Submitting...' : 'Submit Bug'}</button></div></form></Modal>; }
function ResolveModal({ bug, notes, setNotes, evidence, setEvidence, saving, onClose, onUpdate }) { return <Modal title={`${bug.bugId} · ${bug.title}`} onClose={onClose}><div className="space-y-4 text-xs"><Info label="Description" value={bug.description} /><Info label="Steps to Reproduce" value={bug.stepsToReproduce || 'Not provided'} /><Info label="Expected Result" value={bug.expectedResult || 'Not provided'} /><Info label="Actual Result" value={bug.actualResult || 'Not provided'} /><label><span className="mb-1.5 block font-semibold uppercase tracking-wide text-slate-500">Resolution Notes</span><textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} className={field} placeholder="Describe the fix..." /></label><label><span className="mb-1.5 block font-semibold uppercase tracking-wide text-slate-500">Supporting Evidence</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setEvidence(e.target.files?.[0] || null)} className="w-full text-xs" /></label><div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-600">Close</button><button type="button" disabled={saving} onClick={() => onUpdate('In Progress')} className="rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white disabled:opacity-60">In Progress</button><button type="button" disabled={saving} onClick={() => onUpdate('Retesting')} className="rounded-xl bg-amber-600 px-4 py-2 font-semibold text-white disabled:opacity-60">Submit for Verification</button></div></div></Modal>; }
function Modal({ title, onClose, children }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-4"><h3 className="text-lg font-bold text-[#0F172A]">{title}</h3><button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button></div>{children}</div></div>; }
function Input({ label, value, onChange }) { return <label><span className="mb-1.5 block font-semibold uppercase tracking-wide text-slate-500">{label}</span><input value={value} onChange={e => onChange(e.target.value)} className={field} /></label>; }
function TextArea({ label, value, onChange, required }) { return <label><span className="mb-1.5 block font-semibold uppercase tracking-wide text-slate-500">{label}</span><textarea rows={3} required={required} value={value} onChange={e => onChange(e.target.value)} className={field} /></label>; }
function Info({ label, value }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><span className="font-semibold uppercase tracking-wide text-slate-500">{label}</span><p className="mt-1 whitespace-pre-wrap leading-relaxed text-[#0F172A]">{value}</p></div>; }
