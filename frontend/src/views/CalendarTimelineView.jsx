import { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TaskDetailDrawer from '../modals/TaskDetailDrawer';

const statusStyle = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  'On Hold': 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
  Planning: 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
  completed: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  planning: 'bg-amber-50 text-amber-700 border-amber-200 font-medium'
};

export default function CalendarTimelineView({ tasks = [], sprints = [], projects = [], users = [], token, fetchAllData }) {
  const [activeSubTab, setActiveSubTab] = useState('timeline');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const navigate = useNavigate();

  const upcomingDeadlines = tasks
    .filter(t => t.dueDate && t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  return (
    <section className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#0F172A]">Milestones, Deadlines & Schedule</h2>
          <p className="mt-1 text-xs text-[#475569] font-normal">Visualize sprint schedules, task deadlines, project date ranges, and conflict alerts.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('timeline')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
              activeSubTab === 'timeline'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Project Timeline
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('calendar')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
              activeSubTab === 'calendar'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            Sprint Calendar
          </button>
        </div>
      </div>

      {activeSubTab === 'timeline' && (
        <div className="space-y-6">
          {/* Active Projects & Milestones */}
          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-[#2563EB]" />
              <span>Active Projects & Milestones</span>
            </h3>

            {projects.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#475569]">No projects found.</div>
            ) : (
              <div className="space-y-4">
                {projects.map(proj => {
                  const projStatus = proj.status || 'Active';
                  return (
                    <div
                      key={proj._id}
                      onClick={() => navigate(`/admin/projects/${proj._id}`)}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-3 shadow-xs hover:border-[#2563EB] hover:shadow-md hover:bg-white transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded border border-blue-200 uppercase">{proj.key}</span>
                          <h4 className="font-bold text-[#0F172A] text-base mt-1">{proj.name}</h4>
                        </div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[projStatus] || statusStyle.Active}`}>{projStatus}</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-white p-3.5 rounded-xl border border-slate-200">
                        <div><span className="text-[#475569] block font-medium">Start Date</span><span className="font-semibold text-[#0F172A]">{proj.startDate || '2025-01-01'}</span></div>
                        <div><span className="text-[#475569] block font-medium">Expected End</span><span className="font-semibold text-[#0F172A]">{proj.endDate || '2025-12-31'}</span></div>
                        <div><span className="text-[#475569] block font-medium">Priority</span><span className="font-semibold text-[#2563EB]">{proj.priority || 'High'}</span></div>
                        <div><span className="text-[#475569] block font-medium">Methodology</span><span className="font-semibold text-purple-700">{proj.methodology || 'Scrum'}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Task Deadlines & Conflict Identification */}
          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>Upcoming Task Deadlines & Conflict Identification</span>
            </h3>

            {upcomingDeadlines.length === 0 ? (
              <div className="py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                  <Clock className="h-5 w-5" />
                </span>
                <h4 className="mt-3 text-base font-bold text-[#0F172A]">No upcoming deadlines</h4>
                <p className="mt-1 text-xs text-[#475569] font-normal">All tasks are completed or have no scheduled due dates.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 6).map(task => (
                  <div
                    key={task._id}
                    onClick={() => setSelectedTaskId(task._id)}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex items-center justify-between gap-4 shadow-xs hover:border-[#2563EB] hover:shadow-md hover:bg-white transition cursor-pointer"
                  >
                    <div>
                      <span className="text-xs font-bold text-[#2563EB] mr-2">{task.taskId || 'TASK'}</span>
                      <span className="font-semibold text-[#0F172A] text-sm">{task.title}</span>
                      <p className="text-xs text-[#475569] mt-0.5 font-normal">Assignee: {task.assigneeId?.name || 'Unassigned'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                        Due: {task.dueDate}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'calendar' && (
        <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-purple-600" />
            <span>Sprint Schedule & Scheduled Meetings</span>
          </h3>

          {sprints.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#475569]">No sprints planned yet.</div>
          ) : (
            <div className="space-y-4">
              {sprints.map(s => {
                const sprintStatus = s.status || 'planning';
                const projId = s.projectId?._id || s.projectId || '';
                return (
                  <div
                    key={s._id}
                    onClick={() => navigate(`/admin/projects/${projId}/sprints/${s._id}`)}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-2 shadow-xs hover:border-[#2563EB] hover:shadow-md hover:bg-white transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded border border-blue-200">{s.sprintId || 'SPRINT-1'}</span>
                        <h4 className="font-bold text-[#0F172A] text-base">{s.name}</h4>
                      </div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${statusStyle[sprintStatus] || statusStyle.planning}`}>{sprintStatus}</span>
                    </div>
                    <p className="text-xs text-[#475569] font-normal">Goal: {s.goal || 'No goal set'}</p>
                    <div className="flex justify-between text-xs text-[#475569] pt-2 border-t border-slate-200 font-medium">
                      <span>Start: {s.startDate || '—'}</span>
                      <span>End: {s.endDate || '—'}</span>
                      <span>Capacity: {s.capacityHours || 480} hrs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          token={token}
          onClose={() => setSelectedTaskId(null)}
          fetchAllData={fetchAllData}
        />
      )}
    </section>
  );
}
