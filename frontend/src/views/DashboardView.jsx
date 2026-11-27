import {
  Activity, AlertTriangle, Briefcase, Calendar, CheckCircle, CheckSquare,
  Clock, Database, FolderKanban, HeartPulse, History, ShieldAlert, TrendingUp, Users
} from 'lucide-react';
import { useState } from 'react';
import MetricCard from '../components/MetricCard';

const statusStyles = {
  Overloaded: 'bg-rose-50 text-rose-700 border-rose-200',
  Available: 'bg-amber-50 text-amber-700 border-amber-200',
  Healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Not Calculated': 'bg-slate-100 text-slate-600 border-slate-200',
  Unavailable: 'bg-slate-100 text-slate-600 border-slate-200'
};

function EmployeeAvatar({ name, src }) {
  const [imageFailed, setImageFailed] = useState(!src);
  const initials = String(name || 'Employee')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');

  return imageFailed ? (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#4F46E5] text-white flex items-center justify-center text-xs font-bold shrink-0" aria-label={`${name} initials`}>
      {initials}
    </div>
  ) : (
    <img src={src} alt={`${name} avatar`} onError={() => setImageFailed(true)} className="w-10 h-10 rounded-full object-cover bg-slate-200 shrink-0" />
  );
}

export default function DashboardView({ data }) {
  if (!data) {
    return (
      <div className="glass-card p-10 rounded-2xl text-center">
        <Activity className="w-7 h-7 text-[#2563EB] animate-pulse mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#0F172A]">Loading dashboard data</p>
        <p className="text-xs text-[#475569] mt-1">Retrieving current workspace metrics.</p>
      </div>
    );
  }

  if (data.error || !data.metrics) {
    return (
      <div className="glass-card p-10 rounded-2xl text-center border-amber-200 bg-amber-50">
        <AlertTriangle className="w-7 h-7 text-amber-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#0F172A]">Dashboard data is unavailable</p>
        <p className="text-xs text-[#475569] mt-1">The overview could not be retrieved from the backend API.</p>
      </div>
    );
  }

  const {
    metrics, taskDistribution = {}, sprintProgress = [], sprintHealth = [], workload = [],
    recentActivities = [], upcomingDeadlines = [], projectProgress = [], systemHealth, generatedAt
  } = data;
  const visibleSprints = sprintProgress.filter(sprint => sprint.status !== 'completed').slice(0, 4);
  const healthIsOperational = systemHealth?.status === 'Operational';
  const refreshedAt = generatedAt
    ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(generatedAt))
    : 'Unavailable';
  const cards = [
    { title: 'Total employees', value: metrics.totalEmployees, detail: 'Employee accounts', icon: Users, tone: 'indigo' },
    { title: 'Active projects', value: metrics.activeProjects, detail: 'Projects currently active', icon: Briefcase, tone: 'cyan' },
    { title: 'Active sprints', value: metrics.activeSprints, detail: 'Sprints currently running', icon: Calendar, tone: 'blue' },
    { title: 'Total tasks', value: metrics.totalTasks, detail: 'Tasks across the workspace', icon: CheckSquare, tone: 'indigo' },
    { title: 'Completed tasks', value: metrics.completedTasks, detail: 'Tasks marked done', icon: CheckCircle, tone: 'emerald' },
    { title: 'In progress', value: metrics.inProgressTasks, detail: 'Tasks being worked on', icon: Activity, tone: 'blue' },
    { title: 'Overdue tasks', value: metrics.overdueTasks, detail: 'Open tasks past due date', icon: Clock, tone: 'amber' },
    { title: 'Blocked tasks', value: metrics.blockedTasks, detail: 'Tasks waiting on dependencies', icon: ShieldAlert, tone: 'rose' }
  ];

  return (
    <div className="space-y-8 text-[#0F172A]">
      <section className="rounded-2xl overflow-hidden bg-gradient-to-r from-[#1D4ED8] via-[#2563EB] to-[#4F46E5] p-7 shadow-lg shadow-blue-600/15 flex items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Admin overview</h2>
          <p className="text-sm text-blue-100 mt-1">Current delivery, capacity, and operational status in one view.</p>
        </div>
        <div className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border ${healthIsOperational ? 'bg-emerald-400/15 border-emerald-200/30 text-emerald-50' : 'bg-amber-400/15 border-amber-200/30 text-amber-50'}`}>
          <Database className="w-4 h-4" />
          <span className="text-xs font-bold">{systemHealth?.status || 'Unavailable'}</span>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Workspace metrics">
        {cards.map(({ title, value, detail, icon: Icon, tone }) => (
          <MetricCard key={title} title={title} value={value} detail={detail} icon={<Icon className="w-5 h-5" />} iconTone={tone} />
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-card p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-50 text-[#2563EB]"><TrendingUp className="w-4 h-4" /></span>
              Sprint progress
            </h3>
            <span className="text-[11px] font-medium text-[#475569]">Task completion</span>
          </div>
          <div className="space-y-4">
            {visibleSprints.length === 0 ? (
              <p className="text-sm text-[#475569] py-6 text-center">No active sprint data available.</p>
            ) : visibleSprints.map(sprint => (
              <div key={sprint._id}>
                <div className="flex justify-between gap-4 text-xs font-semibold mb-2">
                  <span className="text-[#475569] truncate">{sprint.name}</span>
                  <span className="text-[#2563EB] shrink-0">{sprint.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#2563EB] to-[#4F46E5] rounded-full" style={{ width: `${sprint.progress}%` }} />
                </div>
                <p className="text-[10px] text-[#64748B] mt-1.5">{sprint.completedTasks} of {sprint.totalTasks} tasks complete</p>
              </div>
            ))}
          </div>
          <div className="pt-5 border-t border-slate-200">
            <h4 className="text-xs font-bold text-[#475569] mb-3">Task distribution</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ['Backlog', taskDistribution.workflowStatuses?.backlog ?? 0, 'text-slate-700 bg-slate-100'],
                ['To do', taskDistribution.workflowStatuses?.todo ?? 0, 'text-cyan-700 bg-cyan-50'],
                ['In progress', taskDistribution.workflowStatuses?.in_progress ?? 0, 'text-blue-700 bg-blue-50'],
                ['Review', taskDistribution.workflowStatuses?.review ?? 0, 'text-violet-700 bg-violet-50'],
                ['Testing', taskDistribution.workflowStatuses?.testing ?? 0, 'text-amber-700 bg-amber-50'],
                ['Done', taskDistribution.workflowStatuses?.done ?? 0, 'text-emerald-700 bg-emerald-50']
              ].map(([label, value, tone]) => (
                <div key={label} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[#475569]">{label}</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${tone}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-xl border border-rose-200 bg-rose-50 flex items-center justify-between gap-3 text-xs">
              <span className="text-rose-800 font-semibold">Blocked flag</span>
              <span className="font-bold text-rose-700">{taskDistribution.flags?.blocked ?? 0}</span>
            </div>
            <p className="text-[10px] text-[#64748B] mt-2">Blocked is a dependency flag. Flagged tasks remain counted once in their workflow status.</p>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Users className="w-4 h-4" /></span>
              Team workload
            </h3>
            <span className="text-[11px] text-[#475569]">Updated {refreshedAt}</span>
          </div>
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {workload.length === 0 ? (
              <p className="text-sm text-[#475569] py-8 text-center">No employee workload data available.</p>
            ) : workload.map(item => {
              const percentage = item.loadPercentage === null ? 0 : Math.min(item.loadPercentage, 100);
              const barColor = item.status === 'Overloaded' ? 'bg-rose-500' : item.status === 'Available' ? 'bg-amber-500' : 'bg-[#2563EB]';
              return (
                <div key={item.user._id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <EmployeeAvatar name={item.user.name} src={item.user.avatar} />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#0F172A] truncate">{item.user.name}</h4>
                      <p className="text-[11px] text-[#475569] truncate">{item.user.designation}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <div className="flex justify-between text-[10px] text-[#475569] mb-1.5">
                        <span>{item.estimatedHours}h allocated</span>
                        <span>{item.capacity === null ? 'Not Calculated' : `${item.capacity}h cap`}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percentage}%` }} />
                      </div>
                      <p className="text-[9px] text-[#64748B] mt-1">{item.capacityBasis ? `${item.capacityBasis.workingDays} working days - ${item.capacityBasis.leaveDays} leave days - ${item.capacityBasis.availabilityPercentage}% available` : 'No active planning period'}</p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold whitespace-nowrap ${statusStyles[item.status] || statusStyles['Not Calculated']}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <h4 className="text-xs font-bold text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Delivery attention</h4>
              <p className="text-xs text-amber-900/80 mt-2">{metrics.overdueTasks} overdue tasks and {metrics.blockedTasks} dependency-blocked tasks require review.</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <h4 className="text-xs font-bold text-blue-800 flex items-center gap-2"><Activity className="w-4 h-4" /> Reviews in queue</h4>
              <p className="text-xs text-blue-900/80 mt-2">{metrics.reviewTasks} tasks are currently in review or testing.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DashboardList title="Recent activities" icon={History} empty="No recent workspace activity." items={recentActivities.map(activity => ({
          id: activity._id,
          title: activity.details,
          meta: `${activity.userName} - ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(activity.createdAt))}`,
          badge: activity.action.replaceAll('_', ' ')
        }))} />
        <DashboardList title="Upcoming deadlines" icon={Clock} empty="No upcoming task deadlines." items={upcomingDeadlines.map(task => ({
          id: task._id,
          title: task.title,
          meta: `${task.taskId} - Due ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(task.dueDate))}`,
          badge: task.priority
        }))} />
        <ProgressPanel title="Project progress" icon={FolderKanban} empty="No project data available." items={projectProgress} />
        <div className="glass-card p-6 rounded-2xl space-y-5">
          <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><HeartPulse className="w-4 h-4" /></span>
            Sprint health
          </h3>
          {sprintHealth.length === 0 ? <EmptyState text="No sprint health data available." /> : (
            <div className="space-y-3">
              {sprintHealth.slice(0, 6).map(sprint => (
                <div key={sprint._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] truncate">{sprint.name}</p>
                    <p className="text-[10px] text-[#475569] mt-1">{sprint.progress}% complete - {sprint.blockedTasks} blocked - {sprint.overdueTasks} overdue</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${sprint.health === 'At risk' ? 'bg-rose-50 text-rose-700 border-rose-200' : sprint.health === 'Complete' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{sprint.health}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ text }) {
  return <p className="text-sm text-[#475569] py-8 text-center">{text}</p>;
}

function DashboardList({ title, icon: Icon, empty, items }) {
  return (
    <div className="glass-card p-6 rounded-2xl space-y-5">
      <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
        <span className="p-2 rounded-lg bg-blue-50 text-[#2563EB]"><Icon className="w-4 h-4" /></span>{title}
      </h3>
      {items.length === 0 ? <EmptyState text={empty} /> : (
        <div className="divide-y divide-slate-100">
          {items.slice(0, 6).map(item => (
            <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
              <div className="min-w-0"><p className="text-xs font-semibold text-[#0F172A] truncate">{item.title}</p><p className="text-[10px] text-[#475569] mt-1">{item.meta}</p></div>
              <span className="text-[9px] uppercase font-bold text-[#2563EB] bg-blue-50 px-2 py-1 rounded-md whitespace-nowrap">{item.badge}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressPanel({ title, icon: Icon, empty, items }) {
  return (
    <div className="glass-card p-6 rounded-2xl space-y-5">
      <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2"><span className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Icon className="w-4 h-4" /></span>{title}</h3>
      {items.length === 0 ? <EmptyState text={empty} /> : <div className="space-y-4">{items.slice(0, 6).map(item => (
        <div key={item._id}><div className="flex justify-between text-xs mb-2"><span className="font-semibold text-[#0F172A] truncate">{item.name}</span><span className="font-bold text-[#2563EB]">{item.progress}%</span></div><div className="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#2563EB] to-[#4F46E5] rounded-full" style={{ width: `${item.progress}%` }} /></div><p className="text-[10px] text-[#475569] mt-1.5">{item.completedTasks} of {item.totalTasks} tasks complete</p></div>
      ))}</div>}
    </div>
  );
}
