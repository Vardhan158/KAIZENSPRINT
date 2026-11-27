import { useState } from 'react';
import { CheckSquare } from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function TaskDetailModal({ task, token, onClose, fetchAllData }) {
  const [activeTab, setActiveTab] = useState('details');
  const [commentText, setCommentText] = useState('');
  const [workHours, setWorkHours] = useState(4);
  const [workNote, setWorkNote] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/tasks/${task._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: commentText.trim() })
      });
      if (res.ok) {
        setCommentText('');
        toast.success('Comment posted successfully!');
        fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to post comment.');
      }
    } catch {
      toast.error('Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddWorkLog = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/tasks/${task._id}/worklogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hours: Number(workHours) || 1, description: workNote.trim() })
      });
      if (res.ok) {
        setWorkNote('');
        toast.success('Work hours logged successfully!');
        fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to log work hours.');
      }
    } catch {
      toast.error('Failed to log work hours.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!attachmentUrl.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/tasks/${task._id}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: attachmentUrl.trim(), name: 'Attachment' })
      });
      if (res.ok) {
        setAttachmentUrl('');
        toast.success('Attachment added successfully!');
        fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add attachment.');
      }
    } catch {
      toast.error('Failed to add attachment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="relative flex flex-col max-h-[90vh] w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-md border border-blue-200 uppercase">
              {task.taskId || 'TASK'}
            </span>
            <h3 className="text-lg font-bold text-[#0F172A]">{task.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold px-3 py-1 bg-slate-100 rounded-lg cursor-pointer transition"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 shrink-0 overflow-x-auto">
          {['details', 'comments', 'work logs', 'attachments'].map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all capitalize whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 font-bold'
                  : 'border-transparent text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8 flex-1 overflow-y-auto space-y-6 bg-slate-50/30">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs space-y-3">
                  <h4 className={labelClass}>Description</h4>
                  <p className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
                </div>

                <div className="rounded-xl p-6 border border-blue-200 bg-blue-50/40 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-[#2563EB] uppercase tracking-wider">Acceptance Criteria</h4>
                  <div className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-wrap font-medium">
                    {task.acceptanceCriteria || 'No acceptance criteria specified.'}
                  </div>
                </div>

                {task.dependencies && (
                  <div className="rounded-xl p-4 border border-amber-200 bg-amber-50/50 shadow-xs space-y-1">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Dependencies</h4>
                    <p className="text-xs text-[#0F172A] font-medium">{task.dependencies}</p>
                  </div>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs space-y-4 h-fit">
                <h4 className={labelClass}>Task Metadata</h4>
                <div className="space-y-3 text-xs text-[#475569]">
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span>Status:</span>
                    <span className="font-bold text-[#2563EB] capitalize">{String(task.status || 'todo').replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span>Priority:</span>
                    <span className="font-bold text-[#0F172A] capitalize">{task.priority}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span>Story Points:</span>
                    <span className="font-bold text-emerald-700">{task.storyPoints || 3} pts</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span>Assignee:</span>
                    <span className="font-bold text-[#0F172A]">{task.assigneeId?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-100">
                    <span>Reviewer:</span>
                    <span className="font-bold text-[#0F172A]">{task.reviewerId?.name || 'Victoria Vance'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span className="font-bold text-amber-700">{task.dueDate || '2025-03-20'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                {task.comments?.length > 0 ? (
                  task.comments.map((c, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#475569]">
                        <span className="font-bold text-[#2563EB]">{c.author?.name || 'Team Member'}</span>
                        <span>{new Date(c.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-[#0F172A]">{c.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#475569]">No comments yet. Start the discussion below.</p>
                )}
              </div>

              <form onSubmit={handleAddComment} className="space-y-3 pt-4 border-t border-slate-200">
                <textarea
                  rows="2"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  className={inputClass}
                  placeholder="Add a comment or review feedback..."
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm cursor-pointer disabled:opacity-60 transition"
                  >
                    Post Comment
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'work logs' && (
            <div className="space-y-6">
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {task.workLogs?.length > 0 ? (
                  task.workLogs.map((w, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#2563EB]">{w.author?.name || 'Developer'}</span>
                        <p className="text-xs text-[#0F172A] mt-0.5">{w.description || w.note || 'Working on task implementation'}</p>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">{w.hours} hrs</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#475569]">No work logs recorded yet.</p>
                )}
              </div>

              <form onSubmit={handleAddWorkLog} className="space-y-3 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Hours Worked</label>
                  <input
                    type="number"
                    value={workHours}
                    onChange={e => setWorkHours(e.target.value)}
                    className={inputClass}
                    min="1"
                    max="24"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Work Note</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={workNote}
                      onChange={e => setWorkNote(e.target.value)}
                      className={inputClass}
                      placeholder="Completed API unit tests..."
                      required
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-xl bg-[#2563EB] px-5 py-3 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-60 transition"
                    >
                      Log Hours
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-6">
              <div className="space-y-2">
                {task.attachments?.length > 0 ? (
                  task.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.url || att}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-slate-200 bg-white p-3 text-xs font-medium text-[#2563EB] hover:bg-blue-50 shadow-xs"
                    >
                      📎 {att.name || att}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-[#475569]">No attachments uploaded.</p>
                )}
              </div>

              <form onSubmit={handleAddAttachment} className="flex space-x-3 pt-4 border-t border-slate-200">
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={e => setAttachmentUrl(e.target.value)}
                  className={inputClass}
                  placeholder="https://figma.com/file/... or image URL"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#2563EB] px-6 py-3 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-60 transition"
                >
                  Upload URL
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
