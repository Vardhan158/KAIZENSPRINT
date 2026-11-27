import { useState } from 'react';
import { Clock, MessageSquare, AlertTriangle, Send, Calendar } from 'lucide-react';
import toast from '../../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function EmployeeStandupView({ currentUser, progressLogs = [], tasks = [], token, fetchAllData }) {
  const [standupForm, setStandupForm] = useState({ yesterday: '', today: '', blockers: 'None', relatedTaskId: tasks[0]?._id || '', hoursWorked: 8 });
  const [standupSubmitting, setStandupSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const myUserId = currentUser?.id || currentUser?._id;
  const myStandups = progressLogs.filter(l => String(l.userId?._id || l.userId) === String(myUserId));

  const todayDateStr = new Date().toISOString().split('T')[0];
  const alreadySubmittedToday = myStandups.some(s => s.date === todayDateStr);

  const handleStandupSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!standupForm.yesterday.trim() || !standupForm.today.trim()) {
      setErrorMsg('Please complete yesterday and today progress fields.');
      toast.warning('Please complete yesterday and today progress fields.');
      return;
    }

    try {
      setStandupSubmitting(true);
      const res = await fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          yesterday: standupForm.yesterday.trim(),
          today: standupForm.today.trim(),
          blockers: standupForm.blockers.trim() || 'None',
          relatedTaskId: standupForm.relatedTaskId || undefined,
          hoursWorked: Number(standupForm.hoursWorked) || 8,
          date: todayDateStr
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Today's standup already submitted.");
      }

      setSuccessMsg('Daily standup submitted successfully.');
      toast.success('Daily standup submitted successfully.');
      setStandupForm({ yesterday: '', today: '', blockers: 'None', relatedTaskId: tasks[0]?._id || '', hoursWorked: 8 });
      if (fetchAllData) fetchAllData();
    } catch (err) {
      setErrorMsg(err.message || "Today's standup already submitted.");
      toast.error(err.message || "Today's standup already submitted.");
    } finally {
      setStandupSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-3xl mx-auto">
      {/* Submission Card */}
      <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A]">Submit Daily Standup</h2>
          <p className="text-xs text-[#475569] mt-1">Report yesterday's progress, today's goals, and active blockers.</p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-fadeIn">
            {successMsg}
          </div>
        )}

        {(errorMsg || alreadySubmittedToday) && (
          <div className="p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold animate-fadeIn">
            {alreadySubmittedToday ? "Today's standup already submitted." : errorMsg}
          </div>
        )}

        <form onSubmit={handleStandupSubmit} className="space-y-4 text-xs">
          <div>
            <label className={labelClass}>What did you accomplish yesterday? *</label>
            <textarea
              rows={3}
              required
              disabled={alreadySubmittedToday}
              value={standupForm.yesterday}
              onChange={e => setStandupForm({ ...standupForm, yesterday: e.target.value })}
              className={`${inputClass} disabled:bg-slate-100 disabled:cursor-not-allowed`}
              placeholder="Completed authentication UI components and schema..."
            />
          </div>

          <div>
            <label className={labelClass}>What are you working on today? *</label>
            <textarea
              rows={3}
              required
              disabled={alreadySubmittedToday}
              value={standupForm.today}
              onChange={e => setStandupForm({ ...standupForm, today: e.target.value })}
              className={`${inputClass} disabled:bg-slate-100 disabled:cursor-not-allowed`}
              placeholder="Integrating OAuth API and writing unit tests..."
            />
          </div>

          <div>
            <label className={labelClass}>Any blockers or impediments?</label>
            <input
              type="text"
              disabled={alreadySubmittedToday}
              value={standupForm.blockers}
              onChange={e => setStandupForm({ ...standupForm, blockers: e.target.value })}
              className={`${inputClass} disabled:bg-slate-100 disabled:cursor-not-allowed`}
              placeholder="None currently..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Related Task</label>
              <select
                disabled={alreadySubmittedToday}
                value={standupForm.relatedTaskId}
                onChange={e => setStandupForm({ ...standupForm, relatedTaskId: e.target.value })}
                className={`${inputClass} disabled:bg-slate-100 disabled:cursor-not-allowed`}
              >
                <option value="">No task linked</option>
                {tasks.map(t => (
                  <option key={t._id} value={t._id}>{t.taskId}: {t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Hours Worked</label>
              <input
                type="number"
                min="1"
                max="16"
                required
                disabled={alreadySubmittedToday}
                value={standupForm.hoursWorked}
                onChange={e => setStandupForm({ ...standupForm, hoursWorked: e.target.value })}
                className={`${inputClass} disabled:bg-slate-100 disabled:cursor-not-allowed`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={standupSubmitting || alreadySubmittedToday}
            className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-6 py-3 text-sm font-semibold shadow-sm transition cursor-pointer w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {alreadySubmittedToday ? "Today's standup already submitted." : standupSubmitting ? 'Submitting...' : 'Submit Daily Standup'}
          </button>
        </form>
      </div>

      {/* My Standup History Section */}
      <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#2563EB]" />
            <span>My Standup History ({myStandups.length})</span>
          </h3>
          <p className="text-xs text-[#475569] mt-0.5">Your past daily progress updates persisted in MongoDB Atlas.</p>
        </div>

        {myStandups.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#475569]">No standup history recorded yet.</div>
        ) : (
          <div className="space-y-4">
            {myStandups.map((log, i) => (
              <div key={log._id || i} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="font-mono font-bold text-[#2563EB]">Date: {log.date}</span>
                  <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-0.5 rounded-full font-bold">{log.hoursWorked || 8} hrs logged</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                    <span className="font-bold text-emerald-700 uppercase block">Yesterday:</span>
                    <p className="text-[#0F172A]">{log.yesterday}</p>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 shadow-xs">
                    <span className="font-bold text-[#2563EB] uppercase block">Today:</span>
                    <p className="text-[#0F172A]">{log.today}</p>
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

                {log.adminResponse && (
                  <div className="text-xs bg-blue-50 text-blue-900 p-3.5 rounded-xl border border-blue-200 space-y-1">
                    <span className="font-bold text-[#2563EB] uppercase block">Admin Resolution Response:</span>
                    <p className="text-[#0F172A]">{log.adminResponse}</p>
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
