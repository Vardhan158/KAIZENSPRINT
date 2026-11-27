import { useState } from 'react';
import { Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function TaskBacklogView({ tasks = [], users = [], sprints = [], token, fetchAllData }) {
  const [filterType, setFilterType] = useState('all');
  const [selectedSprint, setSelectedSprint] = useState('all');

  const filteredTasks = tasks.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSprint = selectedSprint === 'all' || (t.sprintId && (t.sprintId._id === selectedSprint || t.sprintId === selectedSprint));
    return matchesType && matchesSprint;
  });

  const moveTaskToSprint = async (taskId, newSprintId) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sprintId: newSprintId })
      });
      if (res.ok) {
        toast.success('Task moved to selected sprint.');
        fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to move task.');
      }
    } catch {
      toast.error('Failed to move task to sprint.');
    }
  };

  const updatePriority = async (taskId, newPriority) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ priority: newPriority })
      });
      if (res.ok) {
        toast.success('Task priority updated.');
        fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update priority.');
      }
    } catch {
      toast.error('Failed to update priority.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Product Backlog & Issues</h2>
          <p className="text-xs text-[#475569] mt-1 font-normal">Manage user stories, tasks, bugs, and sprint assignments.</p>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Issue Types</option>
            <option value="epic">Epic</option>
            <option value="story">User Story</option>
            <option value="task">Task</option>
            <option value="bug">Bug</option>
            <option value="subtask">Subtask</option>
            <option value="improvement">Improvement</option>
          </select>

          <select
            value={selectedSprint}
            onChange={e => setSelectedSprint(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Sprints</option>
            {sprints.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Backlog Issues Table */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-[#0F172A] text-sm flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <span>Product Backlog ({filteredTasks.length} Issues)</span>
          </h3>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#475569] font-normal">
            No backlog issues match the selected type or sprint.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[850px]">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-[#475569] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Issue / Title</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5">Priority</th>
                  <th className="px-6 py-3.5">Story Points</th>
                  <th className="px-6 py-3.5">Assignee</th>
                  <th className="px-6 py-3.5">Sprint</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map(t => (
                  <tr key={t._id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/admin/tasks/${t._id}`} className="group block">
                        <span className="text-[10px] text-[#2563EB] font-mono block font-bold mb-0.5 group-hover:underline">{t.taskId || t.epicName || 'TASK'}</span>
                        <span className="font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{t.title}</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border ${
                        t.type === 'epic' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        t.type === 'story' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        t.type === 'bug' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {t.type || 'task'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={t.priority}
                        onChange={e => updatePriority(t._id, e.target.value)}
                        className="bg-white text-xs text-[#0F172A] font-medium rounded-lg px-2.5 py-1 border border-slate-300 capitalize focus:outline-none focus:border-[#2563EB]"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                        <option value="critical">Critical</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#2563EB]">{t.storyPoints || 3} pts</td>
                    <td className="px-6 py-4">
                      {t.assigneeId ? (
                        <div className="flex items-center space-x-2">
                          <img src={t.assigneeId.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={t.assigneeId.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200" />
                          <span className="text-xs text-[#0F172A] font-medium">{t.assigneeId.name}</span>
                        </div>
                      ) : <span className="text-xs text-[#475569] font-normal">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={t.sprintId?._id || t.sprintId || ''}
                        onChange={e => moveTaskToSprint(t._id, e.target.value)}
                        className="bg-white text-xs text-[#0F172A] font-medium rounded-lg px-2.5 py-1 border border-slate-300 focus:outline-none focus:border-[#2563EB]"
                      >
                        <option value="">No Sprint</option>
                        {sprints.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center whitespace-nowrap text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 capitalize font-medium">
                        {String(t.status || 'todo').replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
