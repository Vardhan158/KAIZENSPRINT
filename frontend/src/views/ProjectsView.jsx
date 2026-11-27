import { useState } from 'react';
import { Plus, Search, FolderPlus, Eye, Trash2, CheckCircle2, Clock, Layers, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateProjectModal from '../modals/CreateProjectModal';
import ConfirmModal from '../modals/ConfirmModal';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const statusStyle = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200',
  'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
  Planning: 'bg-purple-50 text-purple-700 border-purple-200'
};

export default function ProjectsView({ projects = [], users = [], currentUser, token, fetchAllData }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [deletingProject, setDeletingProject] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Compute KPI metrics dynamically from actual MongoDB project records
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => String(p.status || '').toLowerCase() === 'active').length;
  const completedProjects = projects.filter(p => String(p.status || '').toLowerCase() === 'completed').length;
  const onHoldProjects = projects.filter(p => {
    const st = String(p.status || '').toLowerCase();
    return st === 'on hold' || st === 'on_hold' || st === 'planning';
  }).length;

  // Filter projects by search and status
  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      String(p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.key || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.lead?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      String(p.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleDeleteConfirm = async () => {
    if (!deletingProject) return;
    setDeleting(true);

    try {
      const response = await fetch(`${API_BASE}/projects/${deletingProject._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to delete project.');
      }

      toast.success(`${deletingProject.name} deleted successfully.`);
      setDeletingProject(null);
      await fetchAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete project.');
    } finally {
      setDeleting(false);
    }
  };

  const metrics = [
    { label: 'Total Projects', value: totalProjects, icon: FolderKanban, iconClass: 'bg-blue-50 text-[#2563EB]' },
    { label: 'Active', value: activeProjects, icon: Layers, iconClass: 'bg-emerald-50 text-emerald-600' },
    { label: 'Completed', value: completedProjects, icon: CheckCircle2, iconClass: 'bg-blue-50 text-blue-600' },
    { label: 'On Hold', value: onHoldProjects, icon: Clock, iconClass: 'bg-amber-50 text-amber-600' }
  ];

  return (
    <section className="space-y-6 font-sans">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Project Management</h2>
          <p className="mt-1 text-sm text-[#475569]">Create, manage, and track enterprise projects across workspace teams.</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button
            type="button"
            onClick={() => setShowCreateProjectModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-100 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create Project
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, iconClass }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#475569]">{label}</p>
                <p className="mt-2 text-3xl font-extrabold text-[#0F172A]">{value}</p>
              </div>
              <span className={`rounded-xl p-3 ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Controls Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search projects</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by project name, key, lead or description..."
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full min-w-48 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Planning">Planning</option>
            </select>
          </label>
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#2563EB]">
              <FolderPlus className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#0F172A]">No projects yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#475569]">
              Add the first project to start building your organization workspace.
            </p>
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setShowCreateProjectModal(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Project
              </button>
            )}
          </div>
        )}

        {/* Search / Filter Empty State */}
        {projects.length > 0 && filteredProjects.length === 0 && (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-[#2563EB]">
              <FolderKanban className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-[#0F172A]">No matching projects</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#475569]">
              Adjust search or status filter to find another project.
            </p>
          </div>
        )}

        {/* Project Records Table */}
        {filteredProjects.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-[#475569]">
                <tr>
                  <th className="px-5 py-3">Key</th>
                  <th className="px-5 py-3">Project Name</th>
                  <th className="px-5 py-3">Project Lead</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Start Date</th>
                  <th className="px-5 py-3">End Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map(project => {
                  const projStatus = project.status || 'Active';
                  return (
                    <tr key={project._id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 uppercase">
                          {project.key}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <span className="text-sm font-semibold text-[#0F172A] block">{project.name}</span>
                          {project.description && (
                            <span className="text-xs text-[#475569] truncate max-w-xs block mt-0.5">{project.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={project.lead?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={project.lead?.name || 'Lead'}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <span className="text-sm font-medium text-[#0F172A]">
                            {project.lead?.name || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[projStatus] || statusStyle.Active}`}>
                          {projStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[#475569]">{project.startDate || '—'}</td>
                      <td className="px-5 py-4 text-sm text-[#475569]">{project.endDate || '—'}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="View project workspace"
                            onClick={() => navigate(`/admin/projects/${project._id}`)}
                            className="rounded-lg p-2 text-[#2563EB] hover:bg-blue-50 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button
                              type="button"
                              title="Delete project"
                              onClick={() => setDeletingProject(project)}
                              className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
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

      {/* Modals */}
      {showCreateProjectModal && (
        <CreateProjectModal
          users={users}
          token={token}
          onClose={() => setShowCreateProjectModal(false)}
          onCreated={fetchAllData}
        />
      )}

      {deletingProject && (
        <ConfirmModal
          isOpen={Boolean(deletingProject)}
          title="Delete Project"
          itemName={deletingProject.name}
          message={`Are you sure you want to delete ${deletingProject.name}?`}
          warning="All associated tasks, sprints, and project records will be permanently removed."
          confirmLabel="Delete Project"
          cancelLabel="Cancel"
          confirmVariant="danger"
          loading={deleting}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingProject(null)}
        />
      )}
    </section>
  );
}
