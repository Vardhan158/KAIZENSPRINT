import { useEffect, useState } from 'react';
import { BarChart3, Layers, Zap, PieChart } from 'lucide-react';

export default function EmployeeReportsView({ currentUser, token }) {
  const [selectedProject, setSelectedProject] = useState('All');
  const [selectedSprint, setSelectedSprint] = useState('All');
  const [reportData, setReportData] = useState({ projects: [], sprints: [], tasks: [] });
  const [loading, setLoading] = useState(true);

  const myUserId = currentUser?.id || currentUser?._id;

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

  useEffect(() => {
    if (!token) return;
    const params = new URLSearchParams();
    if (selectedProject !== 'All') params.set('projectId', selectedProject);
    if (selectedSprint !== 'All') params.set('sprintId', selectedSprint);
    setLoading(true);
    fetch(`${API_BASE}/v1/reports/employee?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Failed to load employee report')))
      .then(data => setReportData({ projects: data.projects || [], sprints: data.sprints || [], tasks: data.tasks || [] }))
      .catch(error => console.error('Employee report error', error))
      .finally(() => setLoading(false));
  }, [token, selectedProject, selectedSprint]);

  const accessibleProjects = reportData.projects;
  const availableSprints = reportData.sprints.filter(s => selectedProject === 'All' || String(s.projectId) === String(selectedProject));
  const filteredTasks = reportData.tasks;

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter(t => t.status === 'done').length;
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress' || t.status === 'review' || t.status === 'testing').length;
  const pendingTasks = filteredTasks.filter(t => t.status === 'todo' || !t.status).length;

  const totalPoints = filteredTasks.reduce((acc, t) => acc + (Number(t.storyPoints) || 3), 0);
  const completedPoints = filteredTasks.filter(t => t.status === 'done').reduce((acc, t) => acc + (Number(t.storyPoints) || 3), 0);
  const remainingPoints = Math.max(0, totalPoints - completedPoints);
  const completionRatio = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  // Total logged work hours by current user
  let totalLoggedHours = 0;
  filteredTasks.forEach(t => {
    if (Array.isArray(t.workLogs)) {
      t.workLogs.forEach(w => {
        const authorId = w.author?._id || w.author;
        if (String(authorId) === String(myUserId)) {
          totalLoggedHours += Number(w.hours) || 0;
        }
      });
    }
  });

  // Sprint-wise personal velocity
  const sprintVelocityMap = {};
  filteredTasks.forEach(t => {
    const sprintObj = t.sprintId;
    const sprintId = sprintObj?._id || sprintObj;
    const sprintName = sprintObj?.name || (sprintId ? `Sprint (${String(sprintId).slice(-4)})` : 'Backlog / Unassigned');

    if (!sprintVelocityMap[sprintName]) {
      sprintVelocityMap[sprintName] = { assigned: 0, completed: 0 };
    }
    sprintVelocityMap[sprintName].assigned += Number(t.storyPoints) || 3;
    if (t.status === 'done') {
      sprintVelocityMap[sprintName].completed += Number(t.storyPoints) || 3;
    }
  });

  const sprintVelocityList = Object.entries(sprintVelocityMap).map(([name, data]) => ({
    name,
    ...data
  }));

  // Donut chart calculations
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const completedPct = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const inProgressPct = totalTasks > 0 ? inProgressTasks / totalTasks : 0;
  const pendingPct = totalTasks > 0 ? pendingTasks / totalTasks : 0;

  const completedStroke = circumference * completedPct;
  const inProgressStroke = circumference * inProgressPct;
  const pendingStroke = circumference * pendingPct;

  const completedDashOffset = 0;
  const inProgressDashOffset = -completedStroke;
  const pendingDashOffset = -(completedStroke + inProgressStroke);

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    setSelectedSprint('All'); // Reset sprint filter when project changes
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-[#2563EB]" />
            <span>Performance Analytics & Metrics</span>
          </h2>
          <p className="text-xs text-[#475569] mt-1 font-normal">Personal velocity, completion ratio, story point breakdown, and logged hours derived from MongoDB Atlas.</p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 text-xs">
          <select
            value={selectedProject}
            onChange={handleProjectChange}
            className="border border-slate-300 rounded-xl px-3 py-2 bg-white text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB]"
          >
            <option value="All">All Projects</option>
            {accessibleProjects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>

          <select
            value={selectedSprint}
            onChange={e => setSelectedSprint(e.target.value)}
            className="border border-slate-300 rounded-xl px-3 py-2 bg-white text-[#0F172A] font-medium focus:outline-none focus:border-[#2563EB]"
          >
            <option value="All">All Sprints</option>
            {availableSprints.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards Grid (Shared Component with Identical Padding, Height & Alignment) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
        <KpiCard label="Total Tasks" value={totalTasks} />
        <KpiCard label="Completed Tasks" value={completedTasks} valueClass="text-emerald-700" />
        <KpiCard label="In Progress Tasks" value={inProgressTasks} valueClass="text-[#2563EB]" />
        <KpiCard label="Pending Tasks" value={pendingTasks} valueClass="text-amber-700" />
        <KpiCard label="Logged Work Hours" value={`${totalLoggedHours} hrs`} valueClass="text-purple-700" />
      </div>

      {/* Task Completion Donut Chart & Story Point Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Donut Chart Card */}
        <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4 flex flex-col items-center justify-center">
          <h3 className="text-base font-bold text-[#0F172A] flex items-center space-x-2 self-start">
            <PieChart className="w-5 h-5 text-[#2563EB]" />
            <span>Task Completion Distribution</span>
          </h3>

          <div className="relative w-40 h-40 my-2 flex items-center justify-center">
            {totalTasks === 0 ? (
              <div className="text-xs text-slate-400 text-center">No tasks available</div>
            ) : (
              <>
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
                  {/* Completed Arc */}
                  {completedStroke > 0 && (
                    <circle
                      cx="50" cy="50" r={radius} fill="transparent"
                      stroke="#059669" strokeWidth="12"
                      strokeDasharray={`${completedStroke} ${circumference}`}
                      strokeDashoffset={completedDashOffset}
                    />
                  )}
                  {/* In Progress Arc */}
                  {inProgressStroke > 0 && (
                    <circle
                      cx="50" cy="50" r={radius} fill="transparent"
                      stroke="#2563eb" strokeWidth="12"
                      strokeDasharray={`${inProgressStroke} ${circumference}`}
                      strokeDashoffset={inProgressDashOffset}
                    />
                  )}
                  {/* Pending Arc */}
                  {pendingStroke > 0 && (
                    <circle
                      cx="50" cy="50" r={radius} fill="transparent"
                      stroke="#d97706" strokeWidth="12"
                      strokeDasharray={`${pendingStroke} ${circumference}`}
                      strokeDashoffset={pendingDashOffset}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-[#0F172A]">{totalTasks}</span>
                  <span className="text-[10px] text-[#475569] uppercase font-semibold">Total</span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-2">
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-[#475569] font-medium">Completed ({completedTasks})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-[#2563EB]" />
              <span className="text-[#475569] font-medium">In Progress ({inProgressTasks})</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-600" />
              <span className="text-[#475569] font-medium">Pending ({pendingTasks})</span>
            </div>
          </div>
        </div>

        {/* Story Point Breakdown */}
        <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#0F172A] flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#2563EB]" />
            <span>Story Point Breakdown</span>
          </h3>

          <div className="grid grid-cols-3 gap-3 text-xs pt-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-1">
              <span className="text-[#475569] block font-medium">Total Points</span>
              <span className="text-xl font-bold text-[#0F172A]">{totalPoints} pts</span>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 text-center space-y-1">
              <span className="text-emerald-800 block font-medium">Completed</span>
              <span className="text-xl font-bold text-emerald-700">{completedPoints} pts</span>
            </div>
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 text-center space-y-1">
              <span className="text-amber-800 block font-medium">Remaining</span>
              <span className="text-xl font-bold text-amber-700">{remainingPoints} pts</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#475569] font-medium">Overall Completion Ratio</span>
              <span className="font-bold text-[#2563EB]">{completionRatio}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all"
                style={{ width: `${Math.min(completionRatio, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sprint-Wise Personal Velocity */}
        <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#0F172A] flex items-center space-x-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <span>Sprint-Wise Personal Velocity</span>
          </h3>

          {sprintVelocityList.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#475569]">No velocity records available.</div>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {sprintVelocityList.map((s, i) => {
                const ratio = s.assigned > 0 ? Math.round((s.completed / s.assigned) * 100) : 0;
                return (
                  <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 shadow-xs">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#0F172A]">{s.name}</span>
                      <span className="font-mono text-[11px] text-[#2563EB] font-bold">{s.completed} / {s.assigned} pts ({ratio}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(ratio, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, valueClass = 'text-[#0F172A]' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between h-[104px]">
      <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-extrabold ${valueClass}`}>{value}</span>
    </div>
  );
}
