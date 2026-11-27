import { useState } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import CustomSelectDropdown from '../components/CustomSelectDropdown';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function CreateTaskModal({ projects = [], sprints = [], users = [], token, onClose, onCreated }) {
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeSprints = Array.isArray(sprints) ? sprints : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const [title, setTitle] = useState('');
  const [type, setType] = useState('task');
  const [projectId, setProjectId] = useState(safeProjects[0]?._id || '');
  const [sprintId, setSprintId] = useState(safeSprints[0]?._id || '');
  const [assigneeId, setAssigneeId] = useState(safeUsers[0]?._id || '');
  const [reviewerId, setReviewerId] = useState(safeUsers[0]?._id || '');
  const [epicName, setEpicName] = useState('Core Feature Epic');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [priority, setPriority] = useState('high');
  const [storyPoints, setStoryPoints] = useState(3);
  const [estimatedHours, setEstimatedHours] = useState(16);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [dependencies, setDependencies] = useState('');
  const [labels, setLabels] = useState('frontend, ui, feature');
  const [status] = useState('todo');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const projectOptions = safeProjects.map(p => ({
    id: p._id,
    title: p.name,
    subtitle: `Project Key: ${p.key}`
  }));

  const assigneeOptions = safeUsers.map(u => ({
    id: u._id,
    title: u.name,
    subtitle: u.designation || 'Software Engineer'
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !acceptanceCriteria.trim()) {
      const msg = 'Complete all required fields (Task Title, Acceptance Criteria).';
      setError(msg);
      toast.warning(msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: title.trim(),
          type,
          projectId,
          sprintId,
          assigneeId,
          reviewerId,
          epicName,
          description: description.trim(),
          acceptanceCriteria: acceptanceCriteria.trim(),
          priority,
          storyPoints: Number(storyPoints),
          estimatedHours: Number(estimatedHours),
          startDate,
          dueDate,
          dependencies: dependencies.trim(),
          labels: labels.split(',').map(l => l.trim()).filter(Boolean),
          status
        })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Task created successfully!');
        await onCreated();
        onClose();
      } else {
        const msg = data.error || 'Failed to create task.';
        setError(msg);
        toast.error(msg);
      }
    } catch {
      const msg = 'Network error while creating task. Please try again.';
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
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white">
            <CheckSquare className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A]">Create Task</h3>
            <p className="text-xs text-[#475569]">Task ID generated automatically (e.g. KGS-101). Acceptance criteria required.</p>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 text-xs">
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="create-task-form" className="space-y-4">
            <div>
              <label className={labelClass}>Task Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. Implement OAuth login flow"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Project *</label>
                <CustomSelectDropdown
                  options={projectOptions}
                  value={projectId}
                  onChange={setProjectId}
                  placeholder="Select project..."
                />
              </div>

              <div>
                <label className={labelClass}>Task Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className={inputClass}
                >
                  <option value="task">Task</option>
                  <option value="story">User Story</option>
                  <option value="bug">Bug</option>
                  <option value="epic">Epic</option>
                  <option value="subtask">Subtask</option>
                  <option value="improvement">Improvement</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Assignee</label>
                <CustomSelectDropdown
                  options={assigneeOptions}
                  value={assigneeId}
                  onChange={setAssigneeId}
                  placeholder="Select assignee..."
                />
              </div>

              <div>
                <label className={labelClass}>Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className={inputClass}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className={inputClass}
                placeholder="Detailed task description..."
              />
            </div>

            <div>
              <label className={labelClass}>Acceptance Criteria *</label>
              <textarea
                rows={3}
                required
                value={acceptanceCriteria}
                onChange={e => setAcceptanceCriteria(e.target.value)}
                className={inputClass}
                placeholder="List acceptance criteria..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Story Points</label>
                <select
                  value={storyPoints}
                  onChange={e => setStoryPoints(e.target.value)}
                  className={inputClass}
                >
                  {[1, 2, 3, 5, 8, 13, 21].map(pts => (
                    <option key={pts} value={pts}>{pts} Points</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 md:p-8 pt-4 border-t border-slate-200 shrink-0 flex items-center justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-[#475569] hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-task-form"
            disabled={submitting}
            className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-6 py-2.5 text-xs font-semibold shadow-sm cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
