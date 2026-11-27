import { useState } from 'react';
import { Briefcase, FolderPlus } from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function CreateProjectModal({ users = [], token, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [lead, setLead] = useState(users[0]?._id || '');
  const [members, setMembers] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
  const [priority, setPriority] = useState('High');
  const [methodology, setMethodology] = useState('Scrum');
  const [status, setStatus] = useState('Active');
  const [projectColor] = useState('from-indigo-500 to-purple-500');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleMemberToggle = (userId) => {
    if (members.includes(userId)) {
      setMembers(members.filter(id => id !== userId));
    } else {
      setMembers([...members, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !key.trim() || !description.trim()) {
      const msg = 'Complete all required fields (Name, Key, Description).';
      setError(msg);
      toast.warning(msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          key: key.toUpperCase().trim(),
          description: description.trim(),
          lead,
          members,
          startDate,
          endDate,
          priority,
          methodology,
          status,
          projectColor
        })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Project created successfully!');
        await onCreated();
        onClose();
      } else {
        const msg = data.error || 'Failed to create project.';
        setError(msg);
        toast.error(msg);
      }
    } catch (e) {
      const msg = 'Network error creating project. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white">
            <Briefcase className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A]">Create New Project</h3>
            <p className="text-xs text-[#475569]">Configure multi-project initiatives, leads, and methodology.</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label>
                <span className={labelClass}>Project Name *</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Kaizen Cloud OS"
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClass}>Project Key *</span>
                <input
                  type="text"
                  required
                  maxLength="5"
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  className={`${inputClass} uppercase font-mono`}
                  placeholder="KGS"
                />
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
                placeholder="Next-gen multi-tenant enterprise architecture..."
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label>
                <span className={labelClass}>Project Lead *</span>
                <select
                  value={lead}
                  onChange={e => setLead(e.target.value)}
                  className={inputClass}
                >
                  {users.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} {u.designation ? `(${u.designation})` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label>
                <span className={labelClass}>Methodology</span>
                <select
                  value={methodology}
                  onChange={e => setMethodology(e.target.value)}
                  className={inputClass}
                >
                  <option value="Scrum">Scrum</option>
                  <option value="Kanban">Kanban</option>
                </select>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label>
                <span className={labelClass}>Start Date *</span>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClass}>Expected End Date *</span>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClass}>Priority</span>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className={inputClass}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </label>
            </div>
          </div>

          <div>
            <span className={labelClass}>Project Members (Multi-select)</span>
            <div className="rounded-xl border border-slate-300 bg-slate-50/50 p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
              {users.map(u => (
                <label key={u._id} className="flex items-center space-x-2 text-xs font-medium text-[#0F172A] cursor-pointer hover:text-[#2563EB]">
                  <input
                    type="checkbox"
                    checked={members.includes(u._id)}
                    onChange={() => handleMemberToggle(u._id)}
                    className="rounded border-slate-300 text-[#2563EB] focus:ring-0"
                  />
                  <span className="truncate">{u.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#475569] hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition cursor-pointer shadow-sm"
            >
              <FolderPlus className="h-4 w-4" />
              <span>{submitting ? 'Creating Project…' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
