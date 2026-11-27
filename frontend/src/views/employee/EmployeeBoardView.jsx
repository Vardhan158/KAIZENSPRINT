import toast from '../../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function EmployeeBoardView({ currentUser, tasks = [], token, fetchAllData }) {
  const myTasks = tasks.filter(t => t.assigneeId && (t.assigneeId._id === currentUser.id || t.assigneeId === currentUser.id));
  const todoTasks = myTasks.filter(t => t.status === 'todo' || t.status === 'backlog');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress');
  const reviewTasks = myTasks.filter(t => t.status === 'review');
  const doneTasks = myTasks.filter(t => t.status === 'done');

  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm">
        <h2 className="text-2xl font-extrabold text-[#0F172A]">Sprint Kanban Board</h2>
        <p className="text-xs text-[#475569] mt-1">Drag or update task workflow states across backlog and completion stages.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <SprintColumn title="To Do" tasks={todoTasks} status="todo" handleTaskStatusChange={handleTaskStatusChange} />
        <SprintColumn title="In Progress" tasks={inProgressTasks} status="in_progress" handleTaskStatusChange={handleTaskStatusChange} />
        <SprintColumn title="In Review" tasks={reviewTasks} status="review" handleTaskStatusChange={handleTaskStatusChange} />
        <SprintColumn title="Completed" tasks={doneTasks} status="done" handleTaskStatusChange={handleTaskStatusChange} />
      </div>
    </div>
  );
}

function SprintColumn({ title, tasks, status, handleTaskStatusChange }) {
  return (
    <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h4 className="font-bold text-[#0F172A] text-sm">{title}</h4>
        <span className="text-xs font-mono bg-blue-50 text-[#2563EB] border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">{tasks.length}</span>
      </div>

      <div className="space-y-3">
        {tasks.map(t => (
          <div key={t._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 shadow-xs">
            <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{t.taskId}</span>
            <h5 className="font-bold text-[#0F172A] text-xs">{t.title}</h5>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-[#475569]">Due: {t.dueDate}</span>
              {status === 'todo' && (
                <button type="button" onClick={() => handleTaskStatusChange(t._id, 'in_progress')} className="text-[10px] text-amber-700 font-semibold hover:underline cursor-pointer">
                  Start →
                </button>
              )}
              {status === 'in_progress' && (
                <button type="button" onClick={() => handleTaskStatusChange(t._id, 'review')} className="text-[10px] text-purple-700 font-semibold hover:underline cursor-pointer">
                  Submit →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
