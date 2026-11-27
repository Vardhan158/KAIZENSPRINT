import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle2, Pencil } from 'lucide-react';
import EditSprintModal from '../../modals/EditSprintModal';
import CompleteSprintModal from '../../modals/CompleteSprintModal';
import toast from '../../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const statusStyle = {
  planning: 'bg-amber-50 text-amber-700 border-amber-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200'
};

export default function SprintDetailView({ token, currentUser, fetchAllData, users = [] }) {
  const { projectId, sprintId } = useParams();

  const [sprint, setSprint] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const loadSprintDetails = useCallback(async (signal) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sprints`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });
      const allSprints = await res.json();
      if (!res.ok) throw new Error('Failed to load sprints');

      const found = allSprints.find(s => s._id === sprintId || s.sprintId === sprintId);
      setSprint(found || null);

      if (found) {
        const tRes = await fetch(`${API_BASE}/sprints/${found._id}/board`, {
          headers: { Authorization: `Bearer ${token}` },
          signal
        });
        const sTasks = await tRes.json();
        if (tRes.ok) setTasks(sTasks || []);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Unable to load sprint details.');
      }
    } finally {
      setLoading(false);
    }
  }, [sprintId, token]);

  useEffect(() => {
    const controller = new AbortController();
    loadSprintDetails(controller.signal);
    return () => controller.abort();
  }, [loadSprintDetails]);

  const handleUpdateStatus = async (newStatus) => {
    if (!sprint) return;
    if (currentUser?.role !== 'admin') {
      toast.warning('Only Admin can start or complete a sprint.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/sprints/${sprint._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update sprint status.');

      toast.success(`Sprint status updated to ${newStatus}!`);
      setShowCompleteModal(false);
      await loadSprintDetails();
      if (fetchAllData) fetchAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to update sprint status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-[#475569]">Loading sprint details…</div>;
  }

  if (!sprint) {
    return (
      <div className="p-12 text-center text-[#475569] space-y-4">
        <p className="text-base font-semibold">Sprint not found.</p>
        <Link to={`/admin/projects/${projectId}/sprints`} className="text-[#2563EB] underline text-sm font-semibold">Back to Sprint Planning</Link>
      </div>
    );
  }

  const assignedTasks = tasks;
  const completedTasks = assignedTasks.filter(t => t.status === 'done');

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to={`/admin/projects/${projectId || sprint.projectId?._id || ''}/sprints`} className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-md border border-blue-200 uppercase">
                {sprint.sprintId || 'SPRINT-1'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase border ${statusStyle[sprint.status] || statusStyle.planning}`}>
                {sprint.status || 'planning'}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] mt-1">{sprint.name}</h2>
          </div>
        </div>

        {/* Action Buttons (Hidden when COMPLETED) */}
        {currentUser?.role === 'admin' && sprint.status !== 'completed' && (
          <div className="flex items-center space-x-2">
            {sprint.status === 'planning' && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 shadow-sm flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 text-indigo-600" />
                <span>Edit Sprint</span>
              </button>
            )}
            {sprint.status !== 'active' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleUpdateStatus('active')}
                className="bg-[#2563EB] hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-60"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Sprint</span>
              </button>
            )}
            {sprint.status === 'active' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowCompleteModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-60"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete Sprint</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Goal & Assigned Tasks */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm uppercase tracking-wider">Sprint Goal</h3>
            <p className="text-xs text-[#475569] leading-relaxed">
              {sprint.goal || sprint.description || 'No specific sprint goal defined.'}
            </p>
          </div>

          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#0F172A] text-sm">Assigned Sprint Tasks ({assignedTasks.length})</h3>
              <span className="text-xs font-semibold text-[#2563EB]">{completedTasks.length} / {assignedTasks.length} Completed</span>
            </div>

            {assignedTasks.length === 0 ? (
              <p className="text-xs text-[#475569]">No tasks currently assigned to this sprint.</p>
            ) : (
              <div className="space-y-3">
                {assignedTasks.map(t => (
                  <div key={t._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#2563EB]">{t.taskId || 'TASK'}</span>
                        <span className="text-xs font-semibold text-[#0F172A]">{t.title}</span>
                      </div>
                      <p className="text-[11px] text-[#475569] mt-1">{t.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="text-xs font-semibold text-[#2563EB]">{t.storyPoints || 3} pts</span>
                      <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 capitalize font-medium">
                        {String(t.status || 'todo').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sprint Properties & Team Members */}
        <div className="space-y-6">
          <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm">Sprint Properties</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[#475569]">Target Project:</span>
                <span className="font-bold text-[#0F172A]">{sprint.projectId?.name || 'General Project'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[#475569]">Start Date:</span>
                <span className="font-bold text-[#0F172A]">{sprint.startDate || '—'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[#475569]">End Date:</span>
                <span className="font-bold text-amber-700">{sprint.endDate || '—'}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[#475569]">Capacity:</span>
                <span className="font-bold text-[#2563EB]">{sprint.capacityHours || 480} Hours</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-100">
                <span className="text-[#475569]">Planned Story Points:</span>
                <span className="font-bold text-[#0F172A]">{sprint.plannedStoryPoints || 34} pts</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <span className="text-[11px] font-semibold text-[#475569] uppercase block mb-1">Assigned Team Members ({sprint.members?.length || 0})</span>
              <div className="space-y-2">
                {sprint.members && sprint.members.length > 0 ? (
                  sprint.members.map(m => (
                    <div key={m._id || m} className="flex items-center space-x-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <img src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={m.name || 'Member'} className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200" />
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">{m.name || 'Team Member'}</p>
                        <p className="text-[10px] text-[#475569]">{m.designation || 'Engineer'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#475569]">No team members assigned.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditSprintModal
          sprint={sprint}
          users={users}
          token={token}
          onClose={() => setShowEditModal(false)}
          onUpdated={loadSprintDetails}
        />
      )}

      {showCompleteModal && (
        <CompleteSprintModal
          sprint={sprint}
          tasks={tasks}
          loading={actionLoading}
          onConfirm={() => handleUpdateStatus('completed')}
          onClose={() => setShowCompleteModal(false)}
        />
      )}
    </div>
  );
}
