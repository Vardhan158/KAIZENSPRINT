import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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

export default function TaskDetailView({ tasks = [], users = [], token, fetchAllData }) {
  const { id } = useParams();
  const task = tasks.find(t => t._id === id || t.taskId === id) || tasks[0];

  if (!task) {
    return (
      <div className="p-12 text-center text-[#475569] space-y-4">
        <p className="text-base font-semibold">Task not found.</p>
        <Link to="/admin/tasks" className="text-[#2563EB] underline text-sm font-semibold">Back to Backlog</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/admin/tasks" className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-md border border-blue-200 uppercase">
                {task.taskId || 'TASK'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase border ${statusColors[task.status] || statusColors.todo}`}>
                {String(task.status || 'todo').replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] mt-1">{task.title}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`text-xs border px-3 py-1 rounded-full font-bold uppercase ${priorityColors[task.priority] || priorityColors.medium}`}>
            Priority: {task.priority || 'Medium'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Description & Acceptance Criteria */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm uppercase tracking-wider">Description</h3>
            <p className="text-xs text-[#475569] leading-relaxed whitespace-pre-wrap">
              {task.description || 'No description provided for this task.'}
            </p>
          </div>

          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm uppercase tracking-wider">Acceptance Criteria</h3>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-[#0F172A] leading-relaxed whitespace-pre-wrap">
              {task.acceptanceCriteria || 'No acceptance criteria specified.'}
            </div>
          </div>

          {/* Comments & History */}
          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm">Activity & Comments ({task.comments?.length || 0})</h3>
            <div className="space-y-3">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((c, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-[#475569]">
                      <span className="font-bold text-[#0F172A]">{c.author?.name || 'User'}</span>
                      <span>{new Date(c.createdAt || Date.now()).toLocaleString()}</span>
                    </div>
                    <p className="text-[#0F172A]">{c.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#475569]">No comments yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Task Metadata & Properties */}
        <div className="space-y-6">
          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm">Task Properties</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[#475569]">Project:</span>
                <span className="font-bold text-[#0F172A]">{task.projectId?.name || 'General Project'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[#475569]">Sprint:</span>
                <span className="font-bold text-[#2563EB]">{task.sprintId?.name || 'Backlog'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[#475569]">Story Points:</span>
                <span className="font-bold text-[#0F172A]">{task.storyPoints || 3} pts</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[#475569]">Est. Hours:</span>
                <span className="font-bold text-[#0F172A]">{task.estimatedHours || 16}h</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[#475569]">Due Date:</span>
                <span className="font-bold text-amber-700">{task.dueDate || '—'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[#475569]">Dependencies:</span>
                <span className="font-mono font-semibold text-rose-600">{task.dependencies || 'None'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div>
                <span className="text-[11px] font-semibold text-[#475569] uppercase block mb-1">Assignee</span>
                {task.assigneeId ? (
                  <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <img src={task.assigneeId.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={task.assigneeId.name} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{task.assigneeId.name}</p>
                      <p className="text-[10px] text-[#475569]">{task.assigneeId.designation || 'Engineer'}</p>
                    </div>
                  </div>
                ) : <span className="text-xs text-[#475569]">Unassigned</span>}
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[#475569] uppercase block mb-1">Reviewer</span>
                {task.reviewerId ? (
                  <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <img src={task.reviewerId.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={task.reviewerId.name} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{task.reviewerId.name}</p>
                      <p className="text-[10px] text-[#475569]">{task.reviewerId.designation || 'Reviewer'}</p>
                    </div>
                  </div>
                ) : <span className="text-xs text-[#475569]">No Reviewer</span>}
              </div>

              {task.labels && task.labels.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-[#475569] uppercase block mb-1.5">Labels</span>
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels.map((l, idx) => (
                      <span key={idx} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-md font-medium">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
