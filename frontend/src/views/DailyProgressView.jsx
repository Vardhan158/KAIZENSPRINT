import { useState } from 'react';
import { Clock, MessageSquare, AlertTriangle, Send, Calendar, User, Search, Filter, X } from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function DailyProgressView({ progressLogs = [], tasks = [], users = [], projects = [], sprints = [], currentUser, token, fetchAllData }) {
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [sprintFilter, setSprintFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [adminResponseText, setAdminResponseText] = useState({});
  const [respondingId, setRespondingId] = useState(null);

  const safeLogs = Array.isArray(progressLogs) ? progressLogs : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeSprints = Array.isArray(sprints) ? sprints : [];

  const handleClearFilters = () => {
    setEmployeeFilter('All');
    setProjectFilter('All');
    setSprintFilter('All');
    setDateFilter('');
    toast.success('All filters cleared.');
  };

  const filteredLogs = safeLogs.filter(log => {
    const userId = log.userId?._id || log.userId;
    if (employeeFilter !== 'All' && String(userId) !== String(employeeFilter)) return false;
    if (dateFilter && String(log.date || '').slice(0, 10) !== dateFilter) return false;

    if (projectFilter !== 'All' || sprintFilter !== 'All') {
      const relTask = safeTasks.find(t => String(t._id) === String(log.relatedTaskId?._id || log.relatedTaskId));
      if (!relTask) return false;
      if (projectFilter !== 'All') {
        const pId = relTask.projectId?._id || relTask.projectId;
        if (String(pId) !== String(projectFilter)) return false;
      }
      if (sprintFilter !== 'All') {
        const sId = relTask.sprintId?._id || relTask.sprintId;
        if (String(sId) !== String(sprintFilter)) return false;
      }
    }

    return true;
  });

  const handleAdminResponse = async (logId) => {
    const text = adminResponseText[logId];
    if (!text || !text.trim()) {
      toast.warning('Please enter a response message.');
      return;
    }

    setRespondingId(logId);
    try {
      const res = await fetch(`${API_BASE}/progress/${logId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminResponse: text.trim() })
      });
      if (res.ok) {
        toast.success('Response to blocker sent successfully!');
        if (fetchAllData) fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to respond to blocker.');
      }
    } catch {
      toast.error('Failed to respond to blocker.');
    } finally {
      setRespondingId(null);
    }
  };

  const updateCountLabel = filteredLogs.length === 1 ? '1 Update' : `${filteredLogs.length} Updates`;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Admin Daily Standups (Read-Only)</h2>
          <p className="text-xs text-[#475569] mt-1">Review employee standup submissions, completed work, planned work, blockers, and submission dates.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl p-4 border border-slate-200 bg-white shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#475569]">Employee:</span>
            <select
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB]"
            >
              <option value="All">All Employees</option>
              {safeUsers.filter(u => u.role === 'employee' || u.role === 'EMPLOYEE').map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#475569]">Project:</span>
            <select
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB]"
            >
              <option value="All">All Projects</option>
              {safeProjects.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#475569]">Sprint:</span>
            <select
              value={sprintFilter}
              onChange={e => setSprintFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB]"
            >
              <option value="All">All Sprints</option>
              {safeSprints.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#475569]">Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleClearFilters}
          className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-100 transition cursor-pointer flex items-center space-x-1 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
          <span>Clear Filters</span>
        </button>
      </div>

      {/* Centralized Team Standup Feed (Strictly Read-Only for Admin) */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-base font-bold text-[#0F172A] flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <span>Centralized Team Standup Feed ({updateCountLabel})</span>
          </h3>
          <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-bold">
            Read-Only Admin View
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#2563EB]">
              <Clock className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#0F172A]">No standup logs found</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#475569]">
              No employee standup submissions match the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[750px] overflow-y-auto pr-2">
            {filteredLogs.map(log => (
              <div key={log._id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center space-x-3">
                    <img
                      src={log.userId?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A]">{log.userId?.name || 'Team Member'}</h4>
                      <p className="text-[10px] text-[#475569]">{log.userId?.designation || 'Engineer'} • Submission Date: {log.date}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-bold">{log.hoursWorked || 8} hrs logged</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-1">
                    <span className="font-bold text-emerald-700 uppercase block">Completed Work (Yesterday):</span>
                    <p className="text-[#0F172A] font-normal leading-relaxed">{log.yesterday}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-1">
                    <span className="font-bold text-[#2563EB] uppercase block">Planned Work (Today):</span>
                    <p className="text-[#0F172A] font-normal leading-relaxed">{log.today}</p>
                  </div>
                </div>

                {log.relatedTaskId && (
                  <div className="text-xs bg-blue-50 text-[#2563EB] px-3 py-1.5 rounded-lg border border-blue-200 inline-block font-medium">
                    📌 Related Task: <strong>{log.relatedTaskId.taskId || 'Task'}: {log.relatedTaskId.title}</strong>
                  </div>
                )}

                <div className="text-xs bg-slate-100 text-slate-800 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 uppercase block">Blockers:</span>
                  <p className="text-[#0F172A] font-medium">{log.blockers || 'None'}</p>
                </div>

                {/* Admin Response */}
                {log.adminResponse ? (
                  <div className="mt-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-1">
                    <span className="text-[10px] font-bold text-[#2563EB] uppercase block">Admin Resolution Response:</span>
                    <p className="text-xs text-[#0F172A] font-normal">{log.adminResponse}</p>
                  </div>
                ) : currentUser?.role === 'admin' && (
                  <div className="mt-2 pt-2 border-t border-slate-200 flex space-x-2">
                    <input
                      type="text"
                      placeholder="Type response to blocker..."
                      value={adminResponseText[log._id] || ''}
                      onChange={e => setAdminResponseText({ ...adminResponseText, [log._id]: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                    />
                    <button
                      type="button"
                      disabled={respondingId === log._id}
                      onClick={() => handleAdminResponse(log._id)}
                      className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-4 py-2 text-xs font-semibold shadow-sm whitespace-nowrap flex items-center space-x-1 cursor-pointer disabled:opacity-60 transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>{respondingId === log._id ? 'Sending…' : 'Respond'}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
