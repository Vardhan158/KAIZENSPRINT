import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Eye, CheckCircle2 } from 'lucide-react';
import TaskDetailDrawer from '../../modals/TaskDetailDrawer';

const statusBadgeStyle = (task) => {
  const dueStr = String(task.dueDate || '').slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = dueStr && dueStr < todayStr && task.status !== 'done';
  if (isOverdue) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (task.status === 'done') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (task.status === 'review' || task.status === 'testing') return 'bg-purple-50 text-purple-700 border-purple-200';
  if (task.status === 'in_progress') return 'bg-blue-50 text-blue-700 border-blue-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const statusLabel = (task) => {
  const dueStr = String(task.dueDate || '').slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);
  const isOverdue = dueStr && dueStr < todayStr && task.status !== 'done';
  if (isOverdue) return 'Overdue';
  if (task.status === 'done') return 'Completed';
  if (task.status === 'review' || task.status === 'testing') return 'In Review';
  if (task.status === 'in_progress') return 'In Progress';
  return 'To Do';
};

const getLocalDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function EmployeeCalendarView({ currentUser, tasks = [], token, fetchAllData }) {
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'list'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const myTasks = tasks.filter(t => t.assigneeId && (t.assigneeId._id === currentUser.id || t.assigneeId === currentUser.id));

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month generation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Week generation
  const getWeekDays = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    start.setDate(start.getDate() - day); // Start on Sunday
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDays = getWeekDays(currentDate);

  // Map tasks by exact YYYY-MM-DD local date key
  const tasksByDate = {};
  myTasks.forEach(t => {
    if (!t.dueDate) return;
    const dateKey = String(t.dueDate).slice(0, 10);
    if (!tasksByDate[dateKey]) tasksByDate[dateKey] = [];
    tasksByDate[dateKey].push(t);
  });

  const sortedTasksList = [...myTasks].sort((a, b) => String(a.dueDate || '2099-01-01').localeCompare(String(b.dueDate || '2099-01-01')));
  const todayKey = getLocalDateKey(new Date());

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner & Controls */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-[#2563EB]" />
            <span>Interactive Schedule & Calendar</span>
          </h2>
          <p className="text-xs text-[#475569] mt-1 font-normal">
            {viewMode === 'month' && `${monthNames[month]} ${year}`}
            {viewMode === 'week' && `Week of ${weekDays[0].toLocaleDateString()} – ${weekDays[6].toLocaleDateString()}`}
            {viewMode === 'list' && 'Chronological Task Deadline Schedule'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View mode toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewMode === 'month' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#475569] hover:text-[#0F172A]'}`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewMode === 'week' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#475569] hover:text-[#0F172A]'}`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${viewMode === 'list' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-[#475569] hover:text-[#0F172A]'}`}
            >
              List
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition cursor-pointer text-[#0F172A]"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition cursor-pointer text-xs font-semibold text-[#0F172A]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition cursor-pointer text-[#0F172A]"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden font-sans">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-xs font-bold uppercase text-[#475569] py-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-200">
            {/* Blank padding cells before 1st of month */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/50 p-2" />
            ))}

            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateObj = new Date(year, month, dayNum);
              const dateStr = getLocalDateKey(dateObj);
              const dayTasks = tasksByDate[dateStr] || [];
              const isToday = todayKey === dateStr;

              return (
                <div key={dateStr} className={`min-h-[130px] p-2 bg-white transition hover:bg-blue-50/20 flex flex-col ${isToday ? 'bg-blue-50/40 ring-2 ring-[#2563EB] ring-inset' : ''}`}>
                  <div className="flex items-center justify-between pb-1.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isToday ? 'bg-[#2563EB] text-white' : 'text-[#0F172A]'}`}>
                      {dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        {dayTasks.length} task{dayTasks.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 overflow-y-auto max-h-[100px] scrollbar-none">
                    {dayTasks.map(t => (
                      <div
                        key={t._id}
                        onClick={() => setSelectedTaskId(t._id)}
                        className={`p-1.5 rounded-lg border text-[11px] font-semibold truncate transition cursor-pointer hover:shadow-xs ${statusBadgeStyle(t)}`}
                        title={`${t.taskId}: ${t.title} (${statusLabel(t)})`}
                      >
                        <span className="font-mono mr-1 text-[10px]">{t.taskId}</span>
                        <span>{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden font-sans">
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-xs font-bold uppercase text-[#475569] py-3">
            {weekDays.map((d, i) => {
              const dateKey = getLocalDateKey(d);
              const isToday = todayKey === dateKey;
              return (
                <div key={i} className={`py-1 ${isToday ? 'text-[#2563EB] font-extrabold' : ''}`}>
                  {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 divide-x divide-slate-200 bg-slate-200 min-h-[450px]">
            {weekDays.map((d, i) => {
              const dateStr = getLocalDateKey(d);
              const dayTasks = tasksByDate[dateStr] || [];
              const isToday = todayKey === dateStr;

              return (
                <div key={dateStr} className={`p-3 bg-white space-y-2 ${isToday ? 'bg-blue-50/40' : ''}`}>
                  <div className="text-right text-[10px] font-bold text-slate-400 font-mono">{dayTasks.length} tasks</div>
                  <div className="space-y-2">
                    {dayTasks.map(t => (
                      <div
                        key={t._id}
                        onClick={() => setSelectedTaskId(t._id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer hover:shadow-sm space-y-1 ${statusBadgeStyle(t)}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[10px]">{t.taskId}</span>
                          <span className="text-[9px] uppercase font-bold">{statusLabel(t)}</span>
                        </div>
                        <p className="line-clamp-2 text-[#0F172A]">{t.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden font-sans">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-bold text-[#0F172A] text-sm">Chronological Deadline Schedule ({sortedTasksList.length} Tasks)</h3>
          </div>

          {sortedTasksList.length === 0 ? (
            <div className="p-16 text-center text-xs text-[#475569]">No task deadlines found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sortedTasksList.map(t => (
                <div
                  key={t._id}
                  onClick={() => setSelectedTaskId(t._id)}
                  className="p-5 hover:bg-blue-50/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">{t.taskId}</span>
                      <h4 className="font-bold text-[#0F172A] text-sm">{t.title}</h4>
                    </div>
                    <p className="text-xs text-[#475569] font-normal line-clamp-1">{t.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 text-xs">
                    <span className="font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">Due: {String(t.dueDate).slice(0, 10)}</span>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${statusBadgeStyle(t)}`}>
                      {statusLabel(t)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
