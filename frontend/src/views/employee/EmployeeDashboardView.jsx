import { useState } from 'react';
import { CheckSquare, Clock, Eye, CheckCircle2, Sparkles } from 'lucide-react';
import toast from '../../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function EmployeeDashboardView({ currentUser, tasks = [], projects = [], sprints = [], token, fetchAllData }) {
  const userId = currentUser?.id || currentUser?._id;
  const myTasks = tasks.filter(t => {
    const assigneeId = t.assigneeId?._id || t.assigneeId;
    return assigneeId && userId && String(assigneeId) === String(userId);
  });
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress');
  const reviewTasks = myTasks.filter(t => t.status === 'review');
  const doneTasks = myTasks.filter(t => t.status === 'done');

  const totalPoints = myTasks.reduce((acc, t) => acc + (Number(t.storyPoints) || 3), 0);
  const completedPoints = doneTasks.reduce((acc, t) => acc + (Number(t.storyPoints) || 3), 0);

  const activeSprint = sprints.find(s => String(s.status || '').toLowerCase() === 'active');

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAllData();
        toast.success('Task status updated successfully!');
      } else {
        toast.error('Failed to update task status.');
      }
    } catch {
      toast.error('Failed to update task status.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-xs" />
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A] flex items-center space-x-2">
              <span>Employee Portal: {currentUser.name}</span>
              <span className="text-xs bg-blue-50 text-[#2563EB] border border-blue-200 px-3 py-0.5 rounded-full uppercase tracking-wider font-bold">
                {currentUser.designation || 'Software Engineer'}
              </span>
            </h2>
            <p className="text-xs text-[#475569] mt-1 font-normal">
              Personal workspace dashboard for assigned deliverables, sprint capacity, and workload tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <span className="text-xs text-[#475569] block font-medium">Sprint Capacity</span>
            <span className="text-sm font-bold text-emerald-700 font-semibold">
              {activeSprint ? `${completedPoints} / ${totalPoints} Story Pts` : 'No Active Sprint'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricWidget title="Assigned Tasks" value={myTasks.length} label="Total Tasks" icon={<CheckSquare className="w-6 h-6 text-[#2563EB]" />} />
        <MetricWidget title="In Progress" value={inProgressTasks.length} label="Active Work" icon={<Clock className="w-6 h-6 text-amber-600" />} />
        <MetricWidget title="In Review" value={reviewTasks.length} label="Pending Approval" icon={<Eye className="w-6 h-6 text-purple-600" />} />
        <MetricWidget title="Completed" value={doneTasks.length} label="Finished Tasks" icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />} />
      </div>

      {/* Current Tasks & Deliverables */}
      <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#2563EB]" />
              <span>My Current Tasks & Deliverables</span>
            </h3>
            <p className="text-xs text-[#475569] font-normal">Direct workload queue with status transitions and due date trackers.</p>
          </div>
          <span className="text-xs bg-blue-50 text-[#2563EB] px-3 py-1 rounded-full border border-blue-200 font-semibold">
            {myTasks.length} Active Items
          </span>
        </div>

        <div className="space-y-4">
          {myTasks.length > 0 ? (
            myTasks.map(task => (
              <div key={task._id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-[#2563EB] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {task.taskId}
                    </span>
                    <h4 className="font-bold text-[#0F172A] text-sm">{task.title}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      task.priority === 'urgent' || task.priority === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] font-normal line-clamp-1">{task.description || 'No detailed description provided.'}</p>
                  <div className="flex items-center space-x-4 text-xs text-[#475569] pt-1 font-medium">
                    <span>Project: <strong className="text-[#2563EB]">{task.projectId?.name || 'Kaizen Project'}</strong></span>
                    <span>Due: <strong className="text-amber-700">{task.dueDate}</strong></span>
                    <span>Points: <strong className="text-purple-700">{task.storyPoints || 3} SP</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <select
                    value={task.status}
                    onChange={(e) => handleTaskStatusChange(task._id, e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Submit for Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-xs text-[#475569] font-normal">No tasks currently assigned to you.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricWidget({ title, value, label, icon }) {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">{title}</span>
        {icon}
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-extrabold text-[#0F172A]">{value}</span>
        <span className="text-xs text-[#475569] font-normal">{label}</span>
      </div>
    </div>
  );
}
