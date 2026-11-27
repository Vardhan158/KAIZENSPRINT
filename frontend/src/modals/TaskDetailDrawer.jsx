import { useState, useEffect, useCallback } from 'react';
import { CheckSquare, X, MessageSquare, Clock, Paperclip, Calendar, Eye, Trash2 } from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

const priorityColors = {
  low: 'bg-slate-100 text-slate-700 border-slate-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  urgent: 'bg-rose-50 text-rose-700 border-rose-200',
  critical: 'bg-purple-50 text-purple-700 border-purple-200'
};

const statusColors = {
  todo: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  review: 'bg-amber-50 text-amber-700 border-amber-200',
  testing: 'bg-purple-50 text-purple-700 border-purple-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

export default function TaskDetailDrawer({ taskId, token, onClose, fetchAllData }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [commentText, setCommentText] = useState('');
  const [workHours, setWorkHours] = useState(4);
  const [workNote, setWorkNote] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeToken = token || localStorage.getItem('jira_token');

  const loadTask = useCallback(async (signal) => {
    if (!taskId) return;
    setLoading(true);
    try {
      const authHeader = activeToken ? `Bearer ${activeToken}` : '';
      const headers = authHeader ? { Authorization: authHeader } : {};

      const res = await fetch(`${API_BASE}/tasks/${taskId}`, { headers, signal });
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      } else {
        const allRes = await fetch(`${API_BASE}/tasks`, { headers, signal });
        const allTasks = await allRes.json();
        if (!allRes.ok) throw new Error('Failed to load tasks');
        const found = allTasks.find(t => t._id === taskId || t.taskId === taskId);
        setTask(found || null);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Unable to load task details.');
      }
    } finally {
      setLoading(false);
    }
  }, [taskId, activeToken]);

  useEffect(() => {
    const controller = new AbortController();
    loadTask(controller.signal);
    return () => controller.abort();
  }, [loadTask]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !task) return;
    try {
      setSubmitting(true);
      const authHeader = activeToken ? `Bearer ${activeToken}` : '';
      const res = await fetch(`${API_BASE}/tasks/${task._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ text: commentText.trim() })
      });
      if (res.ok) {
        setCommentText('');
        toast.success('Comment added successfully!');
        loadTask();
        if (fetchAllData) fetchAllData();
      } else {
        toast.error('Failed to add comment.');
      }
    } catch {
      toast.error('Failed to add comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddWorkLog = async (e) => {
    e.preventDefault();
    if (!workHours || !task) return;
    try {
      setSubmitting(true);
      const authHeader = activeToken ? `Bearer ${activeToken}` : '';
      const res = await fetch(`${API_BASE}/tasks/${task._id}/worklogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ hours: Number(workHours), note: workNote })
      });
      if (res.ok) {
        setWorkNote('');
        toast.success('Work hours logged successfully!');
        loadTask();
        if (fetchAllData) fetchAllData();
      } else {
        toast.error('Failed to log work hours.');
      }
    } catch {
      toast.error('Failed to log work hours.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAttachment = async (e) => {
    e.preventDefault();
    if (!task) return;
    if (!selectedFile) {
      toast.warning('Please select an image file to upload.');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.warning('Only PNG, JPG, JPEG, and WEBP image formats are allowed.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.warning('Image size exceeds the 10MB limit.');
      return;
    }

    try {
      setSubmitting(true);
      const authHeader = activeToken ? `Bearer ${activeToken}` : '';
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`${API_BASE}/tasks/${task._id}/attachments`, {
        method: 'POST',
        headers: authHeader ? { Authorization: authHeader } : {},
        body: formData
      });
      if (res.ok) {
        setSelectedFile(null);
        toast.success('Image uploaded securely to Cloudinary successfully!');
        loadTask();
        if (fetchAllData) fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to upload image to Cloudinary.');
      }
    } catch {
      toast.error('Failed to upload image.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!task) return;
    try {
      setSubmitting(true);
      const authHeader = activeToken ? `Bearer ${activeToken}` : '';
      const res = await fetch(`${API_BASE}/tasks/${task._id}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: authHeader ? { Authorization: authHeader } : {}
      });
      if (res.ok) {
        toast.success('Attachment deleted successfully!');
        loadTask();
        if (fetchAllData) fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete attachment.');
      }
    } catch {
      toast.error('Failed to delete attachment.');
    } finally {
      setSubmitting(false);
    }
  };

  const openPreview = (att) => {
    setPreviewLoading(true);
    setPreviewError(false);
    const resolvedUrl = att.url?.startsWith('http') ? att.url : `${API_BASE.replace(/\/api$/, '')}${att.url}`;
    setPreviewAttachment({ ...att, resolvedUrl });
  };

  if (!taskId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm font-sans animate-fadeIn">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-md border border-blue-200 uppercase">
              {task?.taskId || 'TASK'}
            </span>
            <h3 className="text-base font-bold text-[#0F172A] truncate max-w-md">{task?.title || 'Task Details'}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="px-6 py-2 border-b border-slate-200 flex items-center space-x-2 bg-white shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer ${activeTab === 'details' ? 'bg-blue-50 text-[#2563EB] border border-blue-200 font-bold' : 'text-[#475569] hover:bg-slate-50'}`}
          >
            Details & Acceptance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer ${activeTab === 'comments' ? 'bg-blue-50 text-[#2563EB] border border-blue-200 font-bold' : 'text-[#475569] hover:bg-slate-50'}`}
          >
            Comments ({task?.comments?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('worklog')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer ${activeTab === 'worklog' ? 'bg-blue-50 text-[#2563EB] border border-blue-200 font-bold' : 'text-[#475569] hover:bg-slate-50'}`}
          >
            Work Log ({task?.workLogs?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attachments')}
            className={`px-4 py-2 rounded-xl transition cursor-pointer ${activeTab === 'attachments' ? 'bg-blue-50 text-[#2563EB] border border-blue-200 font-bold' : 'text-[#475569] hover:bg-slate-50'}`}
          >
            Attachments ({task?.attachments?.length || 0})
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 text-center text-xs text-[#475569]">Loading task details...</div>
          ) : !task ? (
            <div className="py-20 text-center text-xs text-[#475569]">Task not found.</div>
          ) : (
            <>
              {activeTab === 'details' && (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[#475569] font-medium uppercase">Priority</span>
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${priorityColors[task.priority] || priorityColors.medium}`}>
                        {task.priority || 'Medium'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[#475569] font-medium uppercase">Status</span>
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusColors[task.status] || statusColors.todo}`}>
                        {String(task.status || 'todo').replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[#475569] font-medium uppercase block">Description</span>
                    <p className="text-[#0F172A] leading-relaxed font-normal">{task.description || 'No description provided.'}</p>
                  </div>

                  <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200 space-y-2">
                    <span className="text-[#2563EB] font-bold uppercase block">Acceptance Criteria</span>
                    <p className="text-[#0F172A] leading-relaxed font-medium">{task.acceptanceCriteria || 'Standard acceptance criteria applies.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[#475569] font-medium uppercase">Assignee</span>
                      <span className="font-bold text-[#0F172A] block">{task.assigneeId?.name || 'Unassigned'}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[#475569] font-medium uppercase">Due Date</span>
                      <span className="font-bold text-amber-700 block">{task.dueDate || '—'}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-6 text-xs">
                  <form onSubmit={handleAddComment} className="space-y-3">
                    <label className={labelClass}>Add Comment</label>
                    <textarea
                      rows={3}
                      required
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className={inputClass}
                      placeholder="Type your comment..."
                    />
                    <button type="submit" disabled={submitting} className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-5 py-2 font-semibold shadow-sm cursor-pointer">
                      Post Comment
                    </button>
                  </form>

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    {(task.comments || []).map((c, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 shadow-xs">
                        <div className="flex justify-between font-bold text-[#0F172A]">
                          <span>{c.author?.name || 'Team Member'}</span>
                          <span className="text-slate-400 font-normal">{new Date(c.createdAt || Date.now()).toLocaleString()}</span>
                        </div>
                        <p className="text-[#0F172A] font-normal">{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'worklog' && (
                <div className="space-y-6 text-xs">
                  <form onSubmit={handleAddWorkLog} className="space-y-3">
                    <label className={labelClass}>Log Hours</label>
                    <div className="flex space-x-3">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="24"
                        required
                        value={workHours}
                        onChange={e => setWorkHours(e.target.value)}
                        className="w-32 rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A]"
                        placeholder="Hours"
                      />
                      <input
                        type="text"
                        value={workNote}
                        onChange={e => setWorkNote(e.target.value)}
                        className={`flex-1 ${inputClass}`}
                        placeholder="Work note..."
                      />
                    </div>
                    <button type="submit" disabled={submitting} className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-5 py-2 font-semibold shadow-sm cursor-pointer">
                      Log Time
                    </button>
                  </form>

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    {(task.workLogs || []).map((w, i) => (
                      <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center shadow-xs">
                        <div>
                          <span className="font-bold text-[#0F172A]">{w.author?.name || 'Team Member'}</span>
                          <p className="text-[#475569] font-normal">{w.note || w.description || 'No note'}</p>
                        </div>
                        <span className="font-bold text-[#2563EB]">{w.hours} hrs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'attachments' && (
                <div className="space-y-6 text-xs">
                  <form onSubmit={handleAddAttachment} className="space-y-4">
                    <div>
                      <label className={labelClass}>Upload Image (PNG, JPG, JPEG, WEBP - Max 10MB)</label>
                      <div className="flex space-x-3">
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                          onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                          className="flex-1 text-xs text-[#475569] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#2563EB] hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded-xl p-2 bg-white"
                        />
                        <button type="submit" disabled={submitting} className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-5 py-2 font-semibold shadow-sm cursor-pointer whitespace-nowrap">
                          {submitting ? 'Uploading...' : 'Upload Image'}
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <h4 className="font-bold text-[#0F172A] text-xs">Attached Images ({task?.attachments?.length || 0})</h4>
                    {(task.attachments || []).map((att, i) => {
                      const sizeFormatted = att.fileSize ? (att.fileSize > 1024 * 1024 ? `${(att.fileSize / (1024 * 1024)).toFixed(1)} MB` : `${(att.fileSize / 1024).toFixed(1)} KB`) : '';
                      return (
                        <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between shadow-xs">
                          <div className="truncate pr-4">
                            <span className="font-bold text-[#0F172A] block truncate">{att.name || att.url}</span>
                            <span className="text-[10px] text-slate-400">Uploaded on {new Date(att.uploadedAt || Date.now()).toLocaleDateString()} {sizeFormatted && `• ${sizeFormatted}`}</span>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => openPreview(att)}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 font-semibold hover:bg-blue-100 transition text-[11px] flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att._id || att.url)}
                              className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                              title="Delete Attachment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ATTACHMENT PREVIEW MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm font-sans">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl flex flex-col space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-base font-bold text-[#0F172A] truncate max-w-lg">{previewAttachment.name || 'Image Preview'}</h3>
              </div>
              <button type="button" onClick={() => setPreviewAttachment(null)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-100 rounded-xl p-4 flex items-center justify-center min-h-[400px] relative">
              {previewLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-[#475569] font-semibold">Loading image preview...</p>
                  </div>
                </div>
              )}

              {previewError ? (
                <div className="p-12 text-center space-y-3 bg-white rounded-xl shadow-xs max-w-md w-full">
                  <p className="text-sm font-bold text-rose-600">Failed to load image preview</p>
                  <p className="text-xs text-[#475569]">The image could not be rendered from Cloudinary.</p>
                  <a
                    href={previewAttachment.resolvedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold"
                  >
                    Open Image in New Tab
                  </a>
                </div>
              ) : (
                <img
                  src={previewAttachment.resolvedUrl}
                  alt={previewAttachment.name}
                  onLoad={() => setPreviewLoading(false)}
                  onError={() => { setPreviewLoading(false); setPreviewError(true); }}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-md bg-white"
                />
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2 font-semibold text-[#475569] hover:bg-slate-50 cursor-pointer text-xs"
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
