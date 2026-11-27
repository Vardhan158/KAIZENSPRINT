import { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import CustomSelectDropdown from '../components/CustomSelectDropdown';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function CreateSprintModal({ projects = [], users = [], token, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?._id || '');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  const [durationWeeks, setDurationWeeks] = useState(2);
  const [members, setMembers] = useState(users.filter(u => u.role === 'employee').map(u => u._id));
  const [workingDays, setWorkingDays] = useState(10);
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [plannedStoryPoints, setPlannedStoryPoints] = useState(34);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const calculatedCapacity = members.length * workingDays * hoursPerDay;

  const projectOptions = projects.map(p => ({
    id: p._id,
    title: p.name,
    subtitle: `Project Key: ${p.key}`
  }));

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

    if (!name.trim() || !goal.trim()) {
      const msg = 'Complete all required fields (Sprint Name, Sprint Goal).';
      setError(msg);
      toast.warning(msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          projectId,
          goal: goal.trim(),
          startDate,
          endDate,
          durationWeeks: Number(durationWeeks),
          members,
          capacityHours: calculatedCapacity,
          plannedStoryPoints: Number(plannedStoryPoints),
          description: description.trim()
        })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Sprint planned successfully!');
        await onCreated();
        onClose();
      } else {
        const msg = data.error || 'Failed to create sprint.';
        setError(msg);
        toast.error(msg);
      }
    } catch {
      const msg = 'Network error while planning sprint. Please try again.';
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
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A]">Plan New Agile Sprint</h3>
            <p className="text-xs text-[#475569]">Sprint ID generated automatically. Capacity calculated from team availability.</p>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4">
          {error && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <form id="create-sprint-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>
                  <span className={labelClass}>Sprint Name *</span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Sprint 2: Patient Portal API"
                  />
                </label>
              </div>
              <div>
                <label className="block">
                  <span className={labelClass}>Target Project *</span>
                  <CustomSelectDropdown
                    options={projectOptions}
                    value={projectId}
                    onChange={setProjectId}
                    placeholder="Select project..."
                  />
                </label>
              </div>
            </div>

            <div>
              <label>
                <span className={labelClass}>Sprint Goal *</span>
                <input
                  type="text"
                  required
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  className={inputClass}
                  placeholder="Deliver secure OAuth login & patient registration flow."
                />
              </label>
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
                  <span className={labelClass}>End Date *</span>
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
                  <span className={labelClass}>Duration</span>
                  <select
                    value={durationWeeks}
                    onChange={e => setDurationWeeks(e.target.value)}
                    className={inputClass}
                  >
                    <option value={1}>1 Week</option>
                    <option value={2}>2 Weeks</option>
                    <option value={3}>3 Weeks</option>
                    <option value={4}>4 Weeks</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Improved Capacity Calculation Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs">
              <div>
                <label>
                  <span className={labelClass}>Working Days</span>
                  <input
                    type="number"
                    value={workingDays}
                    onChange={e => setWorkingDays(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
              <div>
                <label>
                  <span className={labelClass}>Hours / Day / Member</span>
                  <input
                    type="number"
                    value={hoursPerDay}
                    onChange={e => setHoursPerDay(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
              <div>
                <span className={labelClass}>Calculated Capacity</span>
                <div className="text-xl font-extrabold text-[#2563EB] pt-2">{calculatedCapacity} Hours</div>
              </div>
            </div>

            <div>
              <label>
                <span className={labelClass}>Planned Story Points</span>
                <input
                  type="number"
                  value={plannedStoryPoints}
                  onChange={e => setPlannedStoryPoints(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <div>
              <span className={labelClass}>Sprint Members (Select Employees)</span>
              <div className="rounded-xl border border-slate-300 bg-slate-50/50 p-3 max-h-36 overflow-y-auto grid grid-cols-2 gap-2">
                {users.filter(u => u.role === 'employee').map(u => (
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
            form="create-sprint-form"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>{submitting ? 'Planning Sprint…' : 'Create Sprint'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
