import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Bug, Calendar, Eye } from 'lucide-react';
import toast from '../../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://kaizensprint.onrender.com';

const severityStyle = {
  Minor: 'bg-slate-100 text-slate-700 border-slate-200',
  Major: 'bg-blue-50 text-blue-700 border-blue-200',
  Critical: 'bg-amber-50 text-amber-700 border-amber-200',
  Blocker: 'bg-rose-50 text-rose-700 border-rose-200'
};

const statusStyle = {
  Reported: 'bg-slate-100 text-slate-700 border-slate-200',
  Triaged: 'bg-blue-50 text-blue-700 border-blue-200',
  Assigned: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'In Progress': 'bg-purple-50 text-purple-700 border-purple-200',
  Retesting: 'bg-amber-50 text-amber-700 border-amber-200',
  Closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Reopened: 'bg-rose-50 text-rose-700 border-rose-200'
};

export default function EmployeeBugsView({ currentUser, bugs = [], projects = [], token, fetchAllData }) {
  const [bugForm, setBugForm] = useState({
    title: '', projectId: projects[0]?._id || '', taskId: '',
    severity: 'Major', environment: 'Testing', description: '',
    stepsToReproduce: '', expectedResult: '', actualResult: ''
  });
  const [bugSubmitting, setBugSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedBugDetails, setSelectedBugDetails] = useState(null);
  const [bugTab, setBugTab] = useState('reported');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [bugUpdating, setBugUpdating] = useState(false);

  useEffect(() => {
    if (projects.length > 0 && (!bugForm.projectId || !projects.some(p => p._id === bugForm.projectId))) {
      setBugForm(prev => ({ ...prev, projectId: projects[0]._id }));
    }
  }, [projects]);

  const myUserId = currentUser?.id || currentUser?._id;
  const myBugs = bugs.filter(b => String(b.reportedBy?._id || b.reportedBy) === String(myUserId));
  const assignedBugs = bugs.filter(b => String(b.assignedTo?._id || b.assignedTo) === String(myUserId));
  const visibleBugs = bugTab === 'assigned' ? assignedBugs : myBugs;

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(SOCKET_URL, { auth: { token } });
    const refresh = () => fetchAllData?.();
    socket.on('bug_created', refresh); socket.on('bug_updated', refresh);
    return () => { socket.off('bug_created', refresh); socket.off('bug_updated', refresh); socket.disconnect(); };
  }, [token, fetchAllData]);

  const updateAssignedBug = async (workflowStatus) => {
    if (!selectedBugDetails) return;
    setBugUpdating(true);
    try {
      const body = new FormData();
      body.append('workflowStatus', workflowStatus);
      body.append('resolutionNotes', resolutionNotes);
      if (evidence) body.append('evidence', evidence);
      const res = await fetch(`${API_BASE}/bugs/${selectedBugDetails._id}/work`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to update assigned bug.');
      setSelectedBugDetails(data); setEvidence(null); fetchAllData?.(); toast.success('Bug update submitted for Admin verification.');
    } catch (err) { toast.error(err.message); } finally { setBugUpdating(false); }
  };

  const handleBugSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!bugForm.title.trim() || !bugForm.projectId || !bugForm.description.trim()) {
      setErrorMsg('Title, project and description are required.');
      toast.warning('Title, project and description are required.');
      return;
    }

    try {
      setBugSubmitting(true);
      const res = await fetch(`${API_BASE}/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bugForm)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to report bug.');
      }

      setSuccessMsg('Defect reported to quality assurance lead successfully.');
      toast.success('Defect reported successfully.');
      setBugForm({
        title: '', projectId: projects[0]?._id || '', taskId: '',
        severity: 'Major', environment: 'Testing', description: '',
        stepsToReproduce: '', expectedResult: '', actualResult: ''
      });
      if (fetchAllData) fetchAllData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to report bug.');
      toast.error(err.message || 'Failed to report bug.');
    } finally {
      setBugSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-3xl mx-auto">
      {/* Bug Report Form Card */}
      <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A]">Report Defect or Bug</h2>
          <p className="text-xs text-[#475569] mt-1">Submit bug tickets to the QA and engineering lead.</p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-fadeIn">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold animate-fadeIn">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleBugSubmit} className="space-y-4 text-xs">
          <div>
            <label className={labelClass}>Bug Title *</label>
            <input
              type="text"
              required
              value={bugForm.title}
              onChange={e => setBugForm({ ...bugForm, title: e.target.value })}
              className={inputClass}
              placeholder="e.g. NullPointerException on login form"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Project *</label>
              <select
                required
                value={bugForm.projectId}
                onChange={e => setBugForm({ ...bugForm, projectId: e.target.value })}
                className={inputClass}
              >
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Severity *</label>
              <select
                value={bugForm.severity}
                onChange={e => setBugForm({ ...bugForm, severity: e.target.value })}
                className={inputClass}
              >
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
                <option value="Blocker">Blocker</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Description *</label>
            <textarea
              rows={3}
              required
              value={bugForm.description}
              onChange={e => setBugForm({ ...bugForm, description: e.target.value })}
              className={inputClass}
              placeholder="Detailed explanation of the issue..."
            />
          </div>

          <div>
            <label className={labelClass}>Steps to Reproduce</label>
            <textarea
              rows={2}
              value={bugForm.stepsToReproduce}
              onChange={e => setBugForm({ ...bugForm, stepsToReproduce: e.target.value })}
              className={inputClass}
              placeholder="1. Open app, 2. Click login..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Expected Result</label>
              <input
                type="text"
                value={bugForm.expectedResult}
                onChange={e => setBugForm({ ...bugForm, expectedResult: e.target.value })}
                className={inputClass}
                placeholder="User logged in successfully"
              />
            </div>
            <div>
              <label className={labelClass}>Actual Result</label>
              <input
                type="text"
                value={bugForm.actualResult}
                onChange={e => setBugForm({ ...bugForm, actualResult: e.target.value })}
                className={inputClass}
                placeholder="Application crashes"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={bugSubmitting}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 text-sm font-semibold shadow-sm transition cursor-pointer w-full disabled:opacity-60"
          >
            {bugSubmitting ? 'Submitting...' : 'Submit Bug Ticket'}
          </button>
        </form>
      </div>

      {/* My Bug History Section */}
      <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
            <Bug className="w-5 h-5 text-rose-600" />
            <span>{bugTab === 'assigned' ? `Assigned Bugs (${assignedBugs.length})` : `My Reported Bugs (${myBugs.length})`}</span>
          </h3>
          <p className="text-xs text-[#475569] mt-0.5">Defect tickets reported by your account and persisted in MongoDB Atlas.</p>
        </div>

        <div className="flex gap-2 border-b border-slate-200 pb-3"><button type="button" onClick={() => setBugTab('reported')} className={`rounded-xl px-3 py-2 text-xs font-semibold ${bugTab === 'reported' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-slate-500'}`}>My Reported Bugs</button><button type="button" onClick={() => setBugTab('assigned')} className={`rounded-xl px-3 py-2 text-xs font-semibold ${bugTab === 'assigned' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-slate-500'}`}>Assigned Bugs</button></div>

        {visibleBugs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#475569]">{bugTab === 'assigned' ? 'No bugs are currently assigned to you.' : 'No bug tickets reported yet.'}</div>
        ) : (
          <div className="space-y-4">
            {visibleBugs.map((b, i) => (
              <div key={b._id || i} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">{b.bugId || 'BUG-101'}</span>
                    <h4 className="font-bold text-[#0F172A] text-sm">{b.title}</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${statusStyle[b.workflowStatus] || statusStyle.Reported}`}>
                      {b.workflowStatus || 'Reported'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedBugDetails(b)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 font-semibold hover:bg-blue-100 transition text-[11px] flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#475569] font-normal line-clamp-2">{b.description}</p>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                  <span className="text-[#475569]">Project: <strong className="text-[#0F172A]">{b.projectId?.name || 'Project'}</strong></span>
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${severityStyle[b.severity] || severityStyle.Major}`}>{b.severity}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BUG DETAILS MODAL */}
      {selectedBugDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl space-y-6 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-2">
                <Bug className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-bold text-[#0F172A]">Bug Details ({selectedBugDetails.bugId})</h3>
              </div>
              <button type="button" onClick={() => setSelectedBugDetails(null)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[#475569] font-medium uppercase">Title</span>
                <p className="font-bold text-[#0F172A] text-sm">{selectedBugDetails.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[#475569] font-medium uppercase">Severity</span>
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${severityStyle[selectedBugDetails.severity]}`}>
                    {selectedBugDetails.severity}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[#475569] font-medium uppercase">Workflow Status</span>
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${statusStyle[selectedBugDetails.workflowStatus]}`}>
                    {selectedBugDetails.workflowStatus}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[#475569] font-medium uppercase">Description</span>
                <p className="text-[#0F172A] font-normal leading-relaxed">{selectedBugDetails.description}</p>
              </div>

              {selectedBugDetails.stepsToReproduce && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[#475569] font-medium uppercase">Steps to Reproduce</span>
                  <p className="text-[#0F172A] font-normal leading-relaxed whitespace-pre-wrap">{selectedBugDetails.stepsToReproduce}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[#475569] font-medium uppercase">Expected Result</span>
                  <p className="text-[#0F172A] font-normal">{selectedBugDetails.expectedResult || '—'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[#475569] font-medium uppercase">Actual Result</span>
                  <p className="text-[#0F172A] font-normal">{selectedBugDetails.actualResult || '—'}</p>
                </div>
              </div>
            </div>

            {String(selectedBugDetails.assignedTo?._id || selectedBugDetails.assignedTo) === String(myUserId) && (
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <label className={labelClass}>Resolution Notes</label>
                <textarea rows={3} value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} className={inputClass} placeholder="Describe the fix and verification details..." />
                <label className={labelClass}>Supporting Evidence</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setEvidence(e.target.files?.[0] || null)} className="w-full text-xs" />
                <div className="flex flex-wrap gap-2"><button type="button" disabled={bugUpdating} onClick={() => updateAssignedBug('In Progress')} className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Mark In Progress</button><button type="button" disabled={bugUpdating} onClick={() => updateAssignedBug('Retesting')} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">Submit for Admin Verification</button></div>
                {selectedBugDetails.resolutionNotes && <p className="text-xs text-slate-600">Current notes: {selectedBugDetails.resolutionNotes}</p>}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedBugDetails(null)}
                className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-5 py-2 font-semibold shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
