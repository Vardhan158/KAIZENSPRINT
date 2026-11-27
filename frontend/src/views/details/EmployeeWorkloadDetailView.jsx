import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckSquare, Users, ShieldAlert, BarChart3, Flame } from 'lucide-react';
import toast from '../../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const statusStyle = {
  todo: 'bg-slate-100 text-slate-700 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  review: 'bg-amber-50 text-amber-700 border-amber-200',
  testing: 'bg-purple-50 text-purple-700 border-purple-200',
  done: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

export default function EmployeeWorkloadDetailView({ token }) {
  const { employeeId } = useParams();

  const [employee, setEmployee] = useState(null);
  const [workload, setWorkload] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDetails = useCallback(async (signal) => {
    setLoading(true);
    try {
      const [empRes, workRes, taskRes] = await Promise.all([
        fetch(`${API_BASE}/v1/employees/${employeeId}`, { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch(`${API_BASE}/v1/employees/${employeeId}/workload`, { headers: { Authorization: `Bearer ${token}` }, signal }),
        fetch(`${API_BASE}/v1/employees/${employeeId}/tasks`, { headers: { Authorization: `Bearer ${token}` }, signal })
      ]);

      const empData = await empRes.json();
      const workData = await workRes.json();
      const taskData = await taskRes.json();

      if (empRes.ok) setEmployee(empData);
      if (workRes.ok) setWorkload(workData);
      if (taskRes.ok) setTasks(taskData || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        toast.error('Unable to load employee workload details.');
      }
    } finally {
      setLoading(false);
    }
  }, [employeeId, token]);

  useEffect(() => {
    const controller = new AbortController();
    loadDetails(controller.signal);
    return () => controller.abort();
  }, [loadDetails]);

  if (loading) {
    return <div className="p-12 text-center text-sm text-[#475569]">Loading workload details…</div>;
  }

  if (!employee) {
    return (
      <div className="p-12 text-center text-[#475569] space-y-4">
        <p className="text-base font-semibold">Employee not found.</p>
        <Link to="/admin/workload" className="text-[#2563EB] underline text-sm font-semibold">Back to Workload Center</Link>
      </div>
    );
  }

  const assignedTasks = tasks;
  const completedTasks = assignedTasks.filter(t => t.status === 'done');
  const activeTasks = assignedTasks.filter(t => t.status !== 'done');
  const estimatedHours = workload?.allocatedHours || activeTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || (Number(t.storyPoints) || 3) * 6), 0);
  const totalCapacity = workload?.capacityHours || employee.workloadCapacity || 40;
  const availableHours = Math.max(0, totalCapacity - estimatedHours);
  const workloadPercentage = workload?.workloadPercentage || (totalCapacity > 0 ? Math.round((estimatedHours / totalCapacity) * 100) : 0);

  const isOverloaded = workloadPercentage > 100;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/admin/workload" className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <img src={employee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={employee.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/20" />
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded-md border border-blue-200 uppercase">
                {employee.employeeId || 'EMP-2025'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase border ${
                employee.accountStatus === 'Inactive' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {employee.accountStatus || 'Active'}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] mt-1">{employee.name}</h2>
            <p className="text-xs text-[#475569]">{employee.designation || 'Software Engineer'}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-medium text-[#475569] block uppercase">Workload Utilization</span>
          <span className={`text-xl font-extrabold ${isOverloaded ? 'text-rose-600' : 'text-[#2563EB]'}`}>
            {workloadPercentage}%
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#475569] uppercase">Estimated Hours</p>
          <p className="mt-2 text-2xl font-extrabold text-[#0F172A]">{estimatedHours}h</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#475569] uppercase">Total Capacity</p>
          <p className="mt-2 text-2xl font-extrabold text-[#2563EB]">{totalCapacity}h</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#475569] uppercase">Available Hours</p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600">{availableHours}h</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#475569] uppercase">Workload %</p>
          <p className={`mt-2 text-2xl font-extrabold ${isOverloaded ? 'text-rose-600' : 'text-indigo-600'}`}>{workloadPercentage}%</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-[#475569] uppercase">Completed Tasks</p>
          <p className="mt-2 text-2xl font-extrabold text-teal-600">{completedTasks.length} / {assignedTasks.length}</p>
        </article>
      </div>

      {/* Assigned Tasks Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-bold text-[#0F172A] text-sm">Assigned Tasks ({assignedTasks.length})</h3>
        </div>

        {assignedTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#475569]">
            No tasks currently assigned to this employee.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-[#475569]">
                <tr>
                  <th className="px-5 py-3">Task ID</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Story Points</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignedTasks.map(t => (
                  <tr key={t._id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold text-[#2563EB]">{t.taskId || 'TASK'}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#0F172A]">{t.title}</td>
                    <td className="px-5 py-4 text-xs text-[#475569]">{t.projectId?.name || 'General Project'}</td>
                    <td className="px-5 py-4 text-xs font-semibold capitalize text-[#0F172A]">{t.priority}</td>
                    <td className="px-5 py-4 text-xs font-bold text-[#2563EB]">{t.storyPoints || 3} pts</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${statusStyle[t.status] || statusStyle.todo}`}>
                        {String(t.status || 'todo').replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
