import { useState } from 'react';
import { UserMinus, UserCheck, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../modals/ConfirmModal';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function EmployeesWorkloadView({ users = [], workloadData = [], token, fetchAllData }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [confirmState, setConfirmState] = useState(null); // { empId, name, newStatus }
  const [statusUpdating, setStatusUpdating] = useState(false);

  const safeUsers = Array.isArray(users) ? users : [];
  const safeWorkload = Array.isArray(workloadData) ? workloadData : [];

  const employees = safeUsers.filter(u => u.role === 'employee' || u.role === 'EMPLOYEE');

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (emp.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = departmentFilter === 'All' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'All' || (emp.accountStatus || 'Active') === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  const promptToggleStatus = (emp) => {
    const currentStatus = emp.accountStatus || 'Active';
    const newStatus = currentStatus === 'Inactive' ? 'Active' : 'Inactive';
    setConfirmState({
      empId: emp._id,
      name: emp.name,
      newStatus
    });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmState) return;
    const { empId, name, newStatus } = confirmState;
    setStatusUpdating(true);

    try {
      const res = await fetch(`${API_BASE}/users/${empId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ accountStatus: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update employee status.');

      toast.success(`${name} account set to ${newStatus}.`);
      setConfirmState(null);
      await fetchAllData();
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Map backend workload data per employee ID
  const workloadMap = safeWorkload.reduce((acc, item) => {
    if (item.user && item.user._id) acc[item.user._id] = item;
    return acc;
  }, {});

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">Workload & Capacity Center</h2>
          <p className="text-xs text-[#475569]">Monitor capacity hours, assigned tasks, and workload status.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search employees by name, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-xl focus:border-[#2563EB] focus:outline-none bg-white text-[#0F172A]"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Workload Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((emp) => {
          const load = workloadMap[emp._id] || {
            activeTasksCount: 0,
            estimatedHours: 0,
            capacity: (emp.workingHoursPerDay || 8) * 5,
            loadPercentage: 0,
            status: 'Healthy'
          };

          const isOverloaded = load.loadPercentage > 100;
          const statusColor = isOverloaded
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : load.loadPercentage > 80
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200';

          return (
            <div
              key={emp._id}
              onClick={() => navigate(`/admin/workload/${emp._id}`)}
              className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-[#2563EB] hover:shadow-md transition cursor-pointer space-y-4"
            >
              {/* Employee Top */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={emp.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/20"
                  />
                  <div>
                    <span className="font-mono text-[10px] text-[#2563EB] font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {emp.employeeId || 'Not assigned'}
                    </span>
                    <h3 className="font-bold text-sm text-[#0F172A] mt-0.5">{emp.name}</h3>
                    <p className="text-[11px] text-[#475569]">{emp.designation || 'Software Engineer'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    promptToggleStatus(emp);
                  }}
                  title={emp.accountStatus === 'Inactive' ? 'Activate Account' : 'Deactivate Account'}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    emp.accountStatus === 'Inactive'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                  }`}
                >
                  {emp.accountStatus === 'Inactive' ? <UserCheck className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                </button>
              </div>

              {/* Workload Meter */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#475569] font-medium">Workload Capacity</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                    {load.loadPercentage || 0}% ({load.status})
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isOverloaded ? 'bg-rose-500' : 'bg-[#2563EB]'}`}
                    style={{ width: `${Math.min(load.loadPercentage || 0, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#475569] pt-1">
                  <span>Assigned: {load.estimatedHours || 0}h</span>
                  <span>Capacity: {load.capacity || 40}h</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {confirmState && (
        <ConfirmModal
          isOpen={Boolean(confirmState)}
          title={`${confirmState.newStatus === 'Inactive' ? 'Deactivate' : 'Activate'} Employee`}
          itemName={confirmState.name}
          message={`Are you sure you want to set ${confirmState.name} status to ${confirmState.newStatus}?`}
          warning={confirmState.newStatus === 'Inactive' ? 'They will no longer be able to sign in to their account.' : 'They will regain access to workspace features.'}
          confirmLabel={confirmState.newStatus === 'Inactive' ? 'Deactivate' : 'Activate'}
          cancelLabel="Cancel"
          confirmVariant={confirmState.newStatus === 'Inactive' ? 'danger' : 'primary'}
          loading={statusUpdating}
          onConfirm={handleConfirmStatusChange}
          onClose={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
