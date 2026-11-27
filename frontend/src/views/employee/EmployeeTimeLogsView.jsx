import { useState } from 'react';
import { Clock, Calendar } from 'lucide-react';
import toast from '../../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function EmployeeTimeLogsView({ currentUser, tasks = [], token, fetchAllData }) {
  const myTasks = tasks.filter(t => t.assigneeId && (t.assigneeId._id === currentUser.id || t.assigneeId === currentUser.id));
  const [timeLogForm, setTimeLogForm] = useState({ taskId: '', hours: '', note: '' });
  const [timeLogSubmitting, setTimeLogSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const myUserId = currentUser?.id || currentUser?._id;

  // Extract all time logs logged by the current user across all tasks
  const myTimeLogs = [];
  tasks.forEach(t => {
    if (Array.isArray(t.workLogs)) {
      t.workLogs.forEach(w => {
        const authorId = w.author?._id || w.author;
        if (String(authorId) === String(myUserId)) {
          myTimeLogs.push({
            ...w,
            taskId: t.taskId,
            taskTitle: t.title,
            taskMongoId: t._id
          });
        }
      });
    }
  });

  myTimeLogs.sort((a, b) => new Date(b.loggedAt || b.createdAt || 0) - new Date(a.loggedAt || a.createdAt || 0));

  const handleTimeLogSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!timeLogForm.taskId || !timeLogForm.hours) {
      setErrorMsg('Please select a task and enter hours.');
      toast.warning('Please select a task and enter hours.');
      return;
    }

    try {
      setTimeLogSubmitting(true);
      const res = await fetch(`${API_BASE}/tasks/${timeLogForm.taskId}/worklogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hours: Number(timeLogForm.hours), note: timeLogForm.note, description: timeLogForm.note })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to log working hours.');
      }

      setSuccessMsg('Working hours logged successfully.');
      toast.success('Working hours logged successfully.');
      setTimeLogForm({ taskId: '', hours: '', note: '' });
      if (fetchAllData) fetchAllData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to log working hours.');
      toast.error(err.message || 'Failed to log working hours.');
    } finally {
      setTimeLogSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-3xl mx-auto">
      {/* Time Log Form Card */}
      <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A]">Log Working Hours</h2>
          <p className="text-xs text-[#475569] mt-1">Record timesheet hours against your assigned tasks.</p>
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

        <form onSubmit={handleTimeLogSubmit} className="space-y-4 text-xs">
          <div>
            <label className={labelClass}>Select Task *</label>
            <select
              required
              value={timeLogForm.taskId}
              onChange={e => setTimeLogForm({ ...timeLogForm, taskId: e.target.value })}
              className={inputClass}
            >
              <option value="">Select assigned task...</option>
              {myTasks.map(t => (
                <option key={t._id} value={t._id}>{t.taskId}: {t.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Hours Spent *</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              required
              value={timeLogForm.hours}
              onChange={e => setTimeLogForm({ ...timeLogForm, hours: e.target.value })}
              className={inputClass}
              placeholder="e.g. 4.5"
            />
          </div>

          <div>
            <label className={labelClass}>Work Description / Note</label>
            <textarea
              rows={2}
              value={timeLogForm.note}
              onChange={e => setTimeLogForm({ ...timeLogForm, note: e.target.value })}
              className={inputClass}
              placeholder="Implemented unit tests..."
            />
          </div>

          <button
            type="submit"
            disabled={timeLogSubmitting}
            className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-6 py-3 text-sm font-semibold shadow-sm transition cursor-pointer w-full disabled:opacity-60"
          >
            {timeLogSubmitting ? 'Logging...' : 'Log Working Hours'}
          </button>
        </form>
      </div>

      {/* My Time Log History Section */}
      <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#2563EB]" />
            <span>My Time Log History ({myTimeLogs.length})</span>
          </h3>
          <p className="text-xs text-[#475569] mt-0.5">Your past timesheet entries synchronized with task work logs in MongoDB Atlas.</p>
        </div>

        {myTimeLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#475569]">No time log history recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {myTimeLogs.map((log, i) => (
              <div key={log._id || i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{log.taskId || 'TASK'}</span>
                    <h4 className="font-bold text-[#0F172A] text-xs">{log.taskTitle}</h4>
                  </div>
                  <p className="text-xs text-[#475569] font-normal">{log.note || log.description || 'No description provided.'}</p>
                </div>

                <div className="flex items-center space-x-4 shrink-0 text-xs">
                  <span className="font-bold text-[#2563EB] bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">{log.hours} hrs</span>
                  <span className="text-slate-500">{new Date(log.loggedAt || log.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
