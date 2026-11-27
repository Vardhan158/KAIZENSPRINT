import { useState } from 'react';
import { CheckSquare, Search, Filter, Eye, Calendar, Sparkles } from 'lucide-react';
import TaskDetailDrawer from '../../modals/TaskDetailDrawer';
import toast from '../../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const priorityStyle = {
  low: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  medium: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  high: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
  urgent: 'bg-orange-50 text-orange-700 border-orange-200 font-medium',
  critical: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
};

const statusStyle = {
  todo: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  review: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
  testing: 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
};

export default function EmployeeTasksView({ currentUser, tasks = [], projects = [], token, fetchAllData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const myTasks = tasks.filter(t => t.assigneeId && (t.assigneeId._id === currentUser.id || t.assigneeId === currentUser.id));

  const filteredTasks = myTasks.filter(t => {
    const matchesSearch = !searchTerm.trim() ||
      String(t.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(t.taskId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(t.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const projId = t.projectId?._id || t.projectId || '';
    const matchesProject = projectFilter === 'All' || String(projId) === String(projectFilter);
    const matchesPriority = priorityFilter === 'All' || String(t.priority || '').toLowerCase() === priorityFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || String(t.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesProject && matchesPriority && matchesStatus;
  });

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Task status updated to ${newStatus.replace('_', ' ')}.`);
        fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update task status.');
      }
    } catch {
      toast.error('Failed to update task status.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">My Assigned Tasks ({myTasks.length})</h2>
          <p className="text-xs text-[#475569] mt-1 font-normal">Manage your workload queue, update task statuses, and submit deliverables for approval.</p>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="rounded-2xl p-4 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search tasks by ID, title or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-[#2563EB] focus:outline-none bg-white text-[#0F172A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none font-medium"
          >
            <option value="All">All Projects</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none font-medium capitalize"
          >
            <option value="All">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none font-medium capitalize"
          >
            <option value="All">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="testing">Testing</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#475569] font-normal">
            No assigned tasks match your search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs align-middle">
              <thead className="bg-slate-50 uppercase font-bold text-[#475569] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Task ID</th>
                  <th className="px-4 py-3">Task Title</th>
                  <th className="px-4 py-3">Project Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Priority</th>
                  <th className="px-4 py-3 whitespace-nowrap">Story Points</th>
                  <th className="px-4 py-3 whitespace-nowrap">Due Date</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map(t => {
                  const stat = t.status || 'todo';
                  const pri = t.priority || 'medium';
                  const projName = t.projectId?.name || 'Kaizen Project';
                  return (
                    <tr
                      key={t._id}
                      onClick={() => setSelectedTaskId(t._id)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer align-middle"
                    >
                      <td className="px-4 py-3 font-bold text-[#2563EB] whitespace-nowrap">
                        {t.taskId || 'TASK'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#0F172A] text-sm block">{t.title}</span>
                        {t.description && <span className="text-xs text-[#475569] font-normal truncate max-w-xs block mt-0.5">{t.description}</span>}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#0F172A]">
                        {projName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${priorityStyle[pri] || priorityStyle.medium}`}>
                          {pri}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-purple-700 whitespace-nowrap">
                        {t.storyPoints || 3} SP
                      </td>
                      <td className="px-4 py-3 font-medium text-amber-700 whitespace-nowrap">
                        {t.dueDate || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusStyle[stat] || statusStyle.todo}`}>
                          {stat.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <select
                            value={stat}
                            onChange={e => handleStatusChange(t._id, e.target.value)}
                            className="bg-white text-xs text-[#0F172A] font-medium rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:border-[#2563EB] cursor-pointer"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Submit for Review</option>
                            <option value="done">Done</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setSelectedTaskId(t._id)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                            title="View Complete Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Detail Drawer */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          token={token}
          onClose={() => setSelectedTaskId(null)}
          fetchAllData={fetchAllData}
        />
      )}
    </div>
  );
}
