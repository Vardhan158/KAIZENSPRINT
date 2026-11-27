import { useState } from 'react';
import { Play, CheckCircle2 } from 'lucide-react';
import TaskDetailModal from '../modals/TaskDetailModal';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function KanbanBoardView({ tasks = [], sprints = [], currentUser, token, fetchAllData }) {
  const [selectedSprintId, setSelectedSprintId] = useState(sprints[0]?._id || '');
  const [selectedTask, setSelectedTask] = useState(null);

  const currentSprint = sprints.find(s => s._id === selectedSprintId) || sprints[0];
  const sprintTasks = tasks.filter(t => t.sprintId && (t.sprintId._id === currentSprint?._id || t.sprintId === currentSprint?._id));

  const columns = [
    { id: 'todo', title: 'To Do', color: 'border-blue-200 bg-blue-50/20' },
    { id: 'in_progress', title: 'In Progress', color: 'border-indigo-200 bg-indigo-50/20' },
    { id: 'review', title: 'In Review', color: 'border-amber-200 bg-amber-50/20' },
    { id: 'testing', title: 'Testing', color: 'border-purple-200 bg-purple-50/20' },
    { id: 'done', title: 'Done (Approved)', color: 'border-emerald-200 bg-emerald-50/20' }
  ];

  const updateTaskStatus = async (taskId, newStatus, e) => {
    e.stopPropagation();
    if (currentSprint?.status === 'completed') {
      toast.warning('Completed sprints are immutable. Task status cannot be changed.');
      return;
    }
    if (newStatus === 'done' && currentUser?.role !== 'admin') {
      toast.warning('Business Rule: Only Admin can approve tasks to Done.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
        fetchAllData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update task status');
    }
  };

  const updateSprintStatus = async (sprintId, newStatus) => {
    if (currentUser?.role !== 'admin') {
      toast.warning('Only Admin can start or complete a sprint.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/sprints/${sprintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAllData();
        toast.success(`Sprint status updated to ${newStatus}!`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update sprint status');
      }
    } catch {
      toast.error('Failed to update sprint status');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Sprint Header & Capacity Banner */}
      {currentSprint && (
        <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded border border-blue-200 uppercase">
                {currentSprint.sprintId || 'SPRINT-1'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase border ${
                currentSprint.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                currentSprint.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {currentSprint.status}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#0F172A]">{currentSprint.name}</h2>
            <p className="text-xs text-[#475569]">Goal: {currentSprint.goal || 'Deliver sprint backlog items.'}</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] text-[#475569] block uppercase font-medium">Capacity vs Planned</span>
              <span className="text-xs font-bold text-[#2563EB]">{currentSprint.capacityHours || 40}h Capacity</span>
              <span className="text-[11px] text-[#475569] block">({currentSprint.plannedStoryPoints || 20} Story Pts)</span>
            </div>

            {currentUser?.role === 'admin' && currentSprint.status !== 'completed' && (
              <div className="flex items-center space-x-2">
                {currentSprint.status !== 'active' && (
                  <button
                    type="button"
                    onClick={() => updateSprintStatus(currentSprint._id, 'active')}
                    className="bg-[#2563EB] hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Start Sprint</span>
                  </button>
                )}
                {currentSprint.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => updateSprintStatus(currentSprint._id, 'completed')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete Sprint</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scrum Board Columns (5 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {columns.map(col => {
          const colTasks = sprintTasks.filter(t => t.status === col.id || (col.id === 'todo' && (t.status === 'backlog' || t.status === 'todo')));
          return (
            <div key={col.id} className={`rounded-2xl p-4 border ${col.color} bg-slate-50/50 shadow-xs min-h-[550px] flex flex-col`}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                <h3 className="font-bold text-[#0F172A] text-xs tracking-wide">{col.title}</h3>
                <span className="text-xs bg-white text-[#0F172A] border border-slate-200 px-2 py-0.5 rounded-full font-bold">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colTasks.map(task => (
                  <div
                    key={task._id}
                    onClick={() => setSelectedTask(task)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#2563EB] transition-all shadow-xs cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#2563EB]">{task.taskId || 'TASK'}</span>
                      <span className="text-xs text-[#2563EB] font-semibold">{task.storyPoints || 3} pts</span>
                    </div>

                    <h4 className="font-bold text-[#0F172A] text-xs line-clamp-2">{task.title}</h4>
                    {task.description && (
                      <p className="text-[11px] text-[#475569] line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      {task.assigneeId ? (
                        <div className="flex items-center space-x-1.5">
                          <img src={task.assigneeId.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={task.assigneeId.name} className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200" />
                          <span className="text-[11px] text-[#0F172A] font-medium truncate max-w-[60px]">{task.assigneeId.name.split(' ')[0]}</span>
                        </div>
                      ) : <span className="text-[10px] text-[#475569]">Unassigned</span>}

                      <select
                        value={task.status}
                        disabled={currentSprint?.status === 'completed'}
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateTaskStatus(task._id, e.target.value, e)}
                        className="bg-white text-[11px] text-[#0F172A] rounded-lg px-2 py-1 border border-slate-300 focus:outline-none focus:border-[#2563EB] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="testing">Testing</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} token={token} onClose={() => setSelectedTask(null)} fetchAllData={fetchAllData} />
      )}
    </div>
  );
}
