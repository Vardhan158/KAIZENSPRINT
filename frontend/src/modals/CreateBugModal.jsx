import { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function CreateBugModal({ projects = [], tasks = [], users = [], token, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?._id || '');
  const [taskId, setTaskId] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [severity, setSeverity] = useState('Major');
  const [environment, setEnvironment] = useState('Testing');
  const [assignedTo, setAssignedTo] = useState(users.find(u => u.role === 'employee')?._id || users[0]?._id || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim() || !stepsToReproduce.trim()) {
      const msg = 'Complete all required fields (Bug Title, Description, Steps).';
      setError(msg);
      toast.warning(msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          projectId,
          taskId: taskId || null,
          description: description.trim(),
          stepsToReproduce: stepsToReproduce.trim(),
          expectedResult: expectedResult.trim(),
          actualResult: actualResult.trim(),
          severity,
          environment,
          screenshots: [],
          assignedTo: assignedTo || null
        })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Bug reported successfully!');
        await onCreated();
        onClose();
      } else {
        const msg = data.error || 'Failed to report bug.';
        setError(msg);
        toast.error(msg);
      }
    } catch {
      const msg = 'Network error while reporting bug. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="relative flex flex-col max-h-[90vh] w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden font-sans">
        {/* Fixed Header */}
        <div className="p-6 md:p-8 pb-4 border-b border-slate-200 shrink-0 flex items-center gap-3 bg-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A]">Report Defect / Bug</h3>
            <p className="text-xs text-[#475569]">Bug ID generated automatically. Admin triages and assigns developers.</p>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <form id="create-bug-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label>
                  <span className={labelClass}>Bug Title *</span>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. 500 error on patient registration submission"
                  />
                </label>
              </div>
              <div>
                <label>
                  <span className={labelClass}>Project *</span>
                  <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className={inputClass}
                  >
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.key})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>
                  <span className={labelClass}>Related Task (Optional)</span>
                  <select
                    value={taskId}
                    onChange={e => setTaskId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">None</option>
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
                  <span className={labelClass}>Assigned Developer</span>
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.name} {u.designation ? `(${u.designation})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div>
              <label>
                <span className={labelClass}>Description *</span>
                <textarea
                  rows="2"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={inputClass}
                  placeholder="Overview of defect behavior..."
                />
              </label>
            </div>

            <div>
              <label>
                <span className={labelClass}>Steps to Reproduce *</span>
                <textarea
                  rows="2"
                  required
                  value={stepsToReproduce}
                  onChange={e => setStepsToReproduce(e.target.value)}
                  className={inputClass}
                  placeholder="1. Go to page... 2. Click button..."
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>
                  <span className={labelClass}>Expected Result *</span>
                  <textarea
                    rows="2"
                    required
                    value={expectedResult}
                    onChange={e => setExpectedResult(e.target.value)}
                    className={inputClass}
                    placeholder="Form successfully submits..."
                  />
                </label>
              </div>
              <div>
                <label>
                  <span className={labelClass}>Actual Result *</span>
                  <textarea
                    rows="2"
                    required
                    value={actualResult}
                    onChange={e => setActualResult(e.target.value)}
                    className={inputClass}
                    placeholder="Throws 500 internal server error..."
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>
                  <span className={labelClass}>Severity</span>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                    <option value="Critical">Critical</option>
                    <option value="Blocker">Blocker</option>
                  </select>
                </label>
              </div>
              <div>
                <label>
                  <span className={labelClass}>Environment</span>
                  <select
                    value={environment}
                    onChange={e => setEnvironment(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Development">Development</option>
                    <option value="Testing">Testing</option>
                    <option value="Production">Production</option>
                  </select>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 md:p-8 pt-4 border-t border-slate-200 shrink-0 bg-white flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#475569] hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-bug-form"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{submitting ? 'Reporting Defect…' : 'Report Defect'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
