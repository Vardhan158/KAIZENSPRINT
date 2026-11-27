import { useParams, Link } from 'react-router-dom';
import { Briefcase, Kanban, CheckSquare, Zap, ArrowLeft } from 'lucide-react';
import KanbanBoardView from '../KanbanBoardView';
import TaskBacklogView from '../TaskBacklogView';

const statusStyle = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200',
  'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
  Planning: 'bg-purple-50 text-purple-700 border-purple-200'
};

export default function ProjectDetailView({ projects = [], tasks = [], sprints = [], users = [], currentUser, fetchAllData, token, subTab = 'overview' }) {
  const { id } = useParams();
  const project = projects.find(p => p._id === id || p.key === id) || projects[0];

  if (!project) {
    return (
      <div className="p-8 text-center text-[#475569] space-y-4">
        <p>Project not found.</p>
        <Link to="/admin/projects" className="text-[#2563EB] underline text-sm font-semibold">Back to Projects Workspace</Link>
      </div>
    );
  }

  const projectTasks = tasks.filter(t => t.projectId?._id === project._id || t.projectId === project._id);
  const projectSprints = sprints.filter(s => s.projectId?._id === project._id || s.projectId === project._id);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Header */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Link to="/admin/projects" className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-md border border-blue-200 uppercase">
              {project.key}
            </span>
            <h2 className="text-2xl font-extrabold text-[#0F172A]">{project.name}</h2>
          </div>
          <p className="text-xs text-[#475569] max-w-2xl">{project.description}</p>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`text-xs border px-3 py-1 rounded-full font-bold ${statusStyle[project.status] || statusStyle.Active}`}>
            {project.status || 'Active'}
          </span>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="rounded-2xl p-2 flex items-center space-x-2 border border-slate-200 bg-white shadow-sm overflow-x-auto">
        <Link
          to={`/admin/projects/${project._id}`}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            subTab === 'overview'
              ? 'bg-blue-50 text-[#2563EB] border border-blue-200 font-bold'
              : 'text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Overview</span>
        </Link>
        <Link
          to={`/admin/projects/${project._id}/backlog`}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            subTab === 'backlog'
              ? 'bg-blue-50 text-[#2563EB] border border-blue-200 font-bold'
              : 'text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Project Backlog</span>
        </Link>
        <Link
          to={`/admin/projects/${project._id}/sprints`}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            subTab === 'sprints'
              ? 'bg-blue-50 text-[#2563EB] border border-blue-200 font-bold'
              : 'text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Sprint Planning</span>
        </Link>
        <Link
          to={`/admin/projects/${project._id}/board`}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
            subTab === 'board'
              ? 'bg-blue-50 text-[#2563EB] border border-blue-200 font-bold'
              : 'text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]'
          }`}
        >
          <Kanban className="w-4 h-4" />
          <span>Scrum Board</span>
        </Link>
      </div>

      {/* View Switch */}
      {subTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm">Project Details</h3>
            <p className="text-xs text-[#475569] leading-relaxed">{project.description}</p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <span className="text-[#475569] block uppercase font-medium">Project Lead</span>
                <span className="font-bold text-[#2563EB] mt-0.5 block">{project.lead?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-[#475569] block uppercase font-medium">Timeline</span>
                <span className="font-bold text-[#0F172A] mt-0.5 block">{project.startDate || '—'} to {project.endDate || '—'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm">Project Team Members</h3>
            <div className="space-y-3">
              {project.members && project.members.length > 0 ? (
                project.members.map(m => (
                  <div key={m._id} className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <img src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={m.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{m.name}</p>
                      <p className="text-[10px] text-[#475569]">{m.designation || 'Team Member'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#475569]">All engineering team assigned.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'backlog' && (
        <TaskBacklogView tasks={projectTasks} users={users} sprints={sprints} token={token} fetchAllData={fetchAllData} />
      )}

      {subTab === 'sprints' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-[#0F172A]">Sprints for {project.name}</h3>
          {projectSprints.length === 0 ? (
            <p className="text-xs text-[#475569]">No active or planned sprints configured for this project.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projectSprints.map(s => (
                <Link key={s._id} to={`/admin/projects/${project._id}/sprints/${s._id}`} className="block group p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-[#2563EB] hover:bg-white shadow-xs transition space-y-2">
                  <span className="text-xs font-mono font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{s.sprintId || 'SPRINT-1'}</span>
                  <h4 className="font-bold text-[#0F172A] text-sm group-hover:text-[#2563EB] transition-colors">{s.name}</h4>
                  <p className="text-xs text-[#475569]">Goal: {s.goal || 'No goal set'}</p>
                  <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                    <span className="text-[#475569]">{s.startDate || '—'} - {s.endDate || '—'}</span>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]">{s.status || 'Active'}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'board' && (
        <KanbanBoardView tasks={projectTasks} sprints={projectSprints} currentUser={currentUser} fetchAllData={fetchAllData} token={token} />
      )}
    </div>
  );
}
