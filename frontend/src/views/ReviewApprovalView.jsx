import { useState } from 'react';
import { CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

const statusStyle = {
  review: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
  testing: 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
};

export default function ReviewApprovalView({ tasks = [], users = [], currentUser, token, fetchAllData }) {
  const [feedbackText, setFeedbackText] = useState({});
  const [selectedReassignUser, setSelectedReassignUser] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const reviewTasks = safeTasks.filter(t => t.status === 'review' || t.status === 'testing' || t.status === 'done');

  const handleApprovalAction = async (taskId, action) => {
    setSubmittingId(taskId);
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action,
          feedback: feedbackText[taskId] || '',
          newAssigneeId: selectedReassignUser[taskId] || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute approval action.');

      toast.success(`Task action "${action}" completed successfully!`);
      fetchAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to execute approval action.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <section className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Admin Approval & Audit Center</h2>
        <p className="mt-1 text-sm text-[#475569] font-normal">Review tasks submitted for approval, approve, request changes, add feedback, reassign, or reopen with full audit history.</p>
      </div>

      {/* Review Tasks List */}
      <div className="space-y-6">
        {reviewTasks.length === 0 ? (
          <div className="rounded-2xl p-12 border border-slate-200 bg-white shadow-sm text-center text-xs text-[#475569] font-normal">
            No tasks currently submitted for review or approval.
          </div>
        ) : (
          reviewTasks.map(task => {
            const stat = task.status || 'review';
            return (
              <div key={task._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-md border border-blue-200 uppercase">
                        {task.taskId || 'TASK'}
                      </span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${statusStyle[stat] || statusStyle.review}`}>
                        {stat.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#0F172A] mt-1">{task.title}</h3>
                    <p className="text-xs text-[#475569] font-normal">{task.description}</p>
                  </div>

                  <div className="text-right text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0">
                    <span className="text-[#475569] block font-medium">Assignee</span>
                    <span className="font-semibold text-[#0F172A]">{task.assigneeId?.name || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Acceptance Criteria */}
                <div className="rounded-xl bg-blue-50/40 border border-blue-200 p-4 text-xs space-y-1">
                  <span className="font-bold text-[#2563EB] uppercase block">Acceptance Criteria:</span>
                  <p className="text-[#0F172A] leading-relaxed font-medium">{task.acceptanceCriteria || 'Standard acceptance criteria applies.'}</p>
                </div>

                {/* Feedback & Reassign controls for Admin */}
                {currentUser?.role === 'admin' && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Add review feedback / changes note..."
                        value={feedbackText[task._id] || ''}
                        onChange={e => setFeedbackText({ ...feedbackText, [task._id]: e.target.value })}
                        className={inputClass}
                      />
                      <div className="flex space-x-2">
                        <select
                          value={selectedReassignUser[task._id] || ''}
                          onChange={e => setSelectedReassignUser({ ...selectedReassignUser, [task._id]: e.target.value })}
                          className={inputClass}
                        >
                          <option value="">Reassign to...</option>
                          {safeUsers.filter(u => u.role === 'employee' || u.role === 'EMPLOYEE').map(u => (
                            <option key={u._id} value={u._id}>
                              {u.name} ({u.designation || 'Engineer'})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={submittingId === task._id}
                          onClick={() => handleApprovalAction(task._id, 'Reassign')}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
                        >
                          Reassign
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {task.status !== 'done' && (
                        <button
                          type="button"
                          disabled={submittingId === task._id}
                          onClick={() => handleApprovalAction(task._id, 'Approve')}
                          className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-indigo-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve (Move to Done)</span>
                        </button>
                      )}

                      {task.status !== 'done' && (
                        <button
                          type="button"
                          disabled={submittingId === task._id}
                          onClick={() => handleApprovalAction(task._id, 'Request Changes')}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Request Changes</span>
                        </button>
                      )}

                      {task.status === 'done' && (
                        <button
                          type="button"
                          disabled={submittingId === task._id}
                          onClick={() => handleApprovalAction(task._id, 'Reopen')}
                          className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition cursor-pointer disabled:opacity-60"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                          <span>Reopen Task</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Audit History Log */}
                {task.auditHistory && task.auditHistory.length > 0 && (
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-[#475569] uppercase">Audit History Log:</span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-2">
                      {task.auditHistory.map((audit, i) => (
                        <div key={i} className="text-[11px] bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-xs">
                          <span className="text-[#2563EB] font-semibold">
                            {audit.action}: <span className="text-[#0F172A] font-normal">{audit.details}</span>
                          </span>
                          <span className="text-[10px] text-[#475569] shrink-0">{new Date(audit.timestamp || Date.now()).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
