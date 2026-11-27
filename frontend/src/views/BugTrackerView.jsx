import { useState } from 'react';
import { Bug, Plus, Search } from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const workflowSteps = ['Reported', 'Triaged', 'Assigned', 'In Progress', 'Retesting', 'Closed', 'Reopened'];

const severityStyle = {
  Minor: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  Major: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  Critical: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
  Blocker: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
};

const statusStyle = {
  Reported: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  Triaged: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  Assigned: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium',
  'In Progress': 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
  Retesting: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
  Closed: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
  Reopened: 'bg-rose-50 text-rose-700 border-rose-200 font-medium'
};

export default function BugTrackerView({ bugs = [], users = [], currentUser, token, fetchAllData, onReportBug }) {
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBugs = bugs.filter(b => {
    const matchesSev = filterSeverity === 'All' || b.severity === filterSeverity;
    const matchesStat = filterStatus === 'All' || b.workflowStatus === filterStatus;
    const matchesSearch = !searchTerm.trim() ||
      String(b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(b.bugId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(b.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSev && matchesStat && matchesSearch;
  });

  const updateBugWorkflow = async (bugId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/bugs/${bugId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workflowStatus: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update bug status.');

      toast.success(`Bug workflow updated to ${newStatus}.`);
      fetchAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to update bug status.');
    }
  };

  const isAdmin = String(currentUser?.role || '').toLowerCase() === 'admin';

  return (
    <section className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Bug & Defect Management</h2>
          <p className="mt-1 text-xs text-[#475569] font-normal">Track defects through the 7-step workflow: Reported ➔ Triaged ➔ Assigned ➔ In Progress ➔ Retesting ➔ Closed / Reopened.</p>
        </div>
        {(onReportBug || isAdmin) && (
          <button
            type="button"
            onClick={onReportBug || (() => {})}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-100 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Report Bug
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Controls Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by Bug ID, title or description..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0F172A] font-normal placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB]"
            >
              <option value="All">All Severities</option>
              <option value="Minor">Minor</option>
              <option value="Major">Major</option>
              <option value="Critical">Critical</option>
              <option value="Blocker">Blocker</option>
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB]"
            >
              <option value="All">All Statuses</option>
              {workflowSteps.map(step => <option key={step} value={step}>{step}</option>)}
            </select>
          </div>
        </div>

        {/* Empty State */}
        {bugs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Bug className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#0F172A]">No bugs reported yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#475569] font-normal">
              Report the first defect to start tracking quality assurance and bug triage workflow.
            </p>
          </div>
        ) : filteredBugs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <Bug className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#0F172A]">No matching bugs</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#475569] font-normal">
              Adjust the search or severity/status filter to find another bug report.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-[#475569] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Bug ID</th>
                  <th className="px-6 py-3.5">Defect Title</th>
                  <th className="px-6 py-3.5">Severity</th>
                  <th className="px-6 py-3.5">Workflow Status</th>
                  <th className="px-6 py-3.5">Assigned Developer</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBugs.map(bug => {
                  const sev = bug.severity || 'Major';
                  const stat = bug.workflowStatus || 'Reported';
                  return (
                    <tr key={bug._id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-rose-600">
                        {bug.bugId || 'BUG-101'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-[#0F172A] block">{bug.title}</span>
                        {bug.description && (
                          <span className="text-xs text-[#475569] font-normal truncate max-w-sm block mt-0.5">{bug.description}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${severityStyle[sev] || severityStyle.Major}`}>
                          {sev}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${statusStyle[stat] || statusStyle.Reported}`}>
                          {stat}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-[#0F172A]">
                        {bug.assignedTo?.name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={stat}
                          onChange={e => updateBugWorkflow(bug._id, e.target.value)}
                          className="bg-white text-xs text-[#0F172A] font-medium rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                        >
                          {workflowSteps.map(step => (
                            <option key={step} value={step}>{step}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
