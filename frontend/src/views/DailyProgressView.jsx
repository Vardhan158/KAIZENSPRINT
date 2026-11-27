import { useState } from 'react';
import { Clock, MessageSquare, AlertTriangle, Send } from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function DailyProgressView({ progressLogs = [], tasks = [], currentUser, token, fetchAllData }) {
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [blockers, setBlockers] = useState('None');
  const [relatedTaskId, setRelatedTaskId] = useState(tasks[0]?._id || '');
  const [hoursWorked, setHoursWorked] = useState(8);
  const [adminResponseText, setAdminResponseText] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!yesterday.trim() || !today.trim()) {
      toast.warning('Complete yesterday and today progress fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          yesterday: yesterday.trim(),
          today: today.trim(),
          blockers: blockers.trim(),
          relatedTaskId: relatedTaskId || undefined,
          hoursWorked: Number(hoursWorked),
          date: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        setYesterday('');
        setToday('');
        setBlockers('None');
        toast.success('Daily standup update submitted successfully!');
        await fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit standup progress.');
      }
    } catch {
      toast.error('Network error submitting standup progress.');
    } finally {
      setSubmitting(false);
    }
  };

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
        await fetchAllData();
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

  const updateCountLabel = progressLogs.length === 1 ? '1 Update' : `${progressLogs.length} Updates`;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col gap-1">
        <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Daily Progress & Standup Command Center</h2>
        <p className="text-xs text-[#475569]">Submit daily updates, track impediments, and respond to blockers across the organization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Daily Standup Form */}
        <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4 h-fit">
          <h3 className="text-base font-bold text-[#0F172A] flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#2563EB]" />
            <span>Submit Standup Update</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>
                <span className={labelClass}>Yesterday: Completed *</span>
                <textarea
                  rows="2"
                  required
                  value={yesterday}
                  onChange={e => setYesterday(e.target.value)}
                  className={inputClass}
                  placeholder="Completed authentication UI components and schema..."
                />
              </label>
            </div>

            <div>
              <label>
                <span className={labelClass}>Today: Planned *</span>
                <textarea
                  rows="2"
                  required
                  value={today}
                  onChange={e => setToday(e.target.value)}
                  className={inputClass}
                  placeholder="Integrating OAuth API and writing unit tests..."
                />
              </label>
            </div>

            <div>
              <label>
                <span className={labelClass}>Blockers / Impediments</span>
                <input
                  type="text"
                  value={blockers}
                  onChange={e => setBlockers(e.target.value)}
                  className={inputClass}
                  placeholder="None or specify blocking issue..."
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>
                  <span className={labelClass}>Related Task</span>
                  <select
                    value={relatedTaskId}
                    onChange={e => setRelatedTaskId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">No task linked</option>
                    {tasks.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.taskId || 'Task'}: {t.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <label>
                  <span className={labelClass}>Hours Worked</span>
                  <input
                    type="number"
                    required
                    min="1"
                    max="16"
                    value={hoursWorked}
                    onChange={e => setHoursWorked(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white py-3 font-semibold text-sm shadow-sm transition cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Submitting Update…' : 'Submit Daily Standup'}
            </button>
          </form>
        </div>

        {/* Centralized Standup Dashboard Feed */}
        <div className="lg:col-span-2 rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-6">
          <h3 className="text-base font-bold text-[#0F172A] flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <span>Centralized Team Standup Feed ({updateCountLabel})</span>
          </h3>

          {progressLogs.length === 0 ? (
            <div className="py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#2563EB]">
                <Clock className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-[#0F172A]">No standup logs yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#475569]">
                Submit your daily progress update to populate the centralized team standup feed.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {progressLogs.map(log => (
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
                        <p className="text-[10px] text-[#475569]">{log.userId?.designation || 'Engineer'} • Date: {log.date}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full font-bold">{log.hoursWorked || 8} hrs logged</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                      <span className="font-bold text-emerald-700 uppercase block mb-1">Yesterday:</span>
                      <p className="text-[#0F172A]">{log.yesterday}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                      <span className="font-bold text-[#2563EB] uppercase block mb-1">Today:</span>
                      <p className="text-[#0F172A]">{log.today}</p>
                    </div>
                  </div>

                  {log.relatedTaskId && (
                    <div className="text-xs bg-blue-50 text-[#2563EB] px-3 py-1.5 rounded-lg border border-blue-200 inline-block font-medium">
                      📌 Related Task: <strong>{log.relatedTaskId.taskId || 'Task'}: {log.relatedTaskId.title}</strong>
                    </div>
                  )}

                  {log.blockers && log.blockers !== 'None' && (
                    <div className="text-xs bg-rose-50 text-rose-800 p-3.5 rounded-xl border border-rose-200 space-y-2">
                      <div className="flex items-center space-x-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600 inline" />
                        <span>Reported Blocker:</span>
                      </div>
                      <p className="text-[#0F172A] pl-5 font-medium">{log.blockers}</p>

                      {/* Admin Response */}
                      {log.adminResponse ? (
                        <div className="mt-2 bg-white p-3 rounded-lg border border-slate-200 ml-5 shadow-xs">
                          <span className="text-[10px] font-bold text-[#2563EB] uppercase block">Admin Resolution Response:</span>
                          <p className="text-xs text-[#0F172A] mt-1">{log.adminResponse}</p>
                        </div>
                      ) : currentUser?.role === 'admin' && (
                        <div className="mt-2 pt-2 border-t border-rose-200 flex space-x-2 pl-5">
                          <input
                            type="text"
                            placeholder="Type response to blocker..."
                            value={adminResponseText[log._id] || ''}
                            onChange={e => setAdminResponseText({ ...adminResponseText, [log._id]: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                          />
                          <button
                            type="button"
                            disabled={respondingId === log._id}
                            onClick={() => handleAdminResponse(log._id)}
                            className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-4 py-1.5 text-xs font-semibold shadow-sm whitespace-nowrap flex items-center space-x-1 cursor-pointer disabled:opacity-60 transition"
                          >
                            <Send className="w-3 h-3" />
                            <span>{respondingId === log._id ? 'Sending…' : 'Respond'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
