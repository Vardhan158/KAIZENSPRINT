import { useCallback, useEffect, useState } from 'react';
import { Eye, Pencil, Search, UserMinus, UserPlus, Users, UserCheck, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EditUserModal from '../modals/EditUserModal';
import ConfirmModal from '../modals/ConfirmModal';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const emptySummary = { total: 0, active: 0, inactive: 0 };

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?';

const statusStyle = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200'
};

export default function EmployeeDirectoryView({ token, onAddEmployee, refreshKey = 0 }) {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(emptySummary);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Deactivation confirmation modal state
  const [deactivatingEmployee, setDeactivatingEmployee] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const loadDirectory = useCallback(async (signal) => {
    setState('loading');
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status !== 'All') params.set('status', status);
      const response = await fetch(`${API_BASE}/v1/employees/directory?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to load the employee directory.');
      setEmployees(payload.employees || []);
      setSummary(payload.summary || emptySummary);
      setState('ready');
    } catch (requestError) {
      if (requestError.name !== 'AbortError') {
        setError(requestError.message);
        setState('error');
      }
    }
  }, [search, status, token]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => loadDirectory(controller.signal), 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadDirectory, refreshKey]);

  const handleConfirmDeactivate = async () => {
    if (!deactivatingEmployee) return;
    setDeactivating(true);

    try {
      const response = await fetch(`${API_BASE}/users/${deactivatingEmployee._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accountStatus: 'Inactive' })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to deactivate employee.');

      toast.success(`${deactivatingEmployee.name} deactivated successfully.`);
      setDeactivatingEmployee(null);
      await loadDirectory();
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
      setState('error');
    } finally {
      setDeactivating(false);
    }
  };

  const metrics = [
    { label: 'Total Employees', value: summary.total, icon: Users, iconClass: 'bg-blue-50 text-[#2563EB]' },
    { label: 'Active', value: summary.active, icon: UserCheck, iconClass: 'bg-emerald-50 text-emerald-600' },
    { label: 'Inactive', value: summary.inactive, icon: UserX, iconClass: 'bg-slate-100 text-slate-600' }
  ];

  return (
    <section className="space-y-6 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Employee Directory</h2>
          <p className="mt-1 text-sm text-[#475569]">Manage employee accounts and role access with direct credentials.</p>
        </div>
        <button type="button" onClick={onAddEmployee} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-100 cursor-pointer">
          <UserPlus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon, iconClass }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#475569]">{label}</p>
                <p className="mt-2 text-3xl font-extrabold text-[#0F172A]">{state === 'loading' ? '—' : value}</p>
              </div>
              <span className={`rounded-xl p-3 ${iconClass}`}><Icon className="h-5 w-5" /></span>
            </div>
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 md:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search employees</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by Employee ID, Username or Email..." className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100" />
          </label>
          <label>
            <span className="sr-only">Filter by status</span>
            <select value={status} onChange={event => setStatus(event.target.value)} className="w-full min-w-48 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-[#0F172A] focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100">
              <option>All</option><option>Active</option><option>Inactive</option>
            </select>
          </label>
        </div>

        {state === 'loading' && <div className="p-12 text-center text-sm text-[#475569]">Loading employees from directory…</div>}
        {state === 'error' && <div className="p-12 text-center"><p className="text-sm font-semibold text-rose-700">{error}</p><button type="button" onClick={() => loadDirectory()} className="mt-4 text-sm font-semibold text-[#2563EB]">Try again</button></div>}
        {state === 'ready' && employees.length === 0 && (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Users className="h-6 w-6" /></span>
            <h3 className="mt-4 text-lg font-bold text-[#0F172A]">{search || status !== 'All' ? 'No matching employees' : 'No employees yet'}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#475569]">{search || status !== 'All' ? 'Adjust the search or status filter to find another employee.' : 'Add the first employee to start building your organization directory.'}</p>
            {!search && status === 'All' && <button type="button" onClick={onAddEmployee} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><UserPlus className="h-4 w-4" /> Add Employee</button>}
          </div>
        )}
        {state === 'ready' && employees.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-[#475569]">
                <tr>
                  <th className="px-5 py-3">Employee ID</th>
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(employee => {
                  const employeeStatus = employee.accountStatus === 'Inactive' ? 'Inactive' : 'Active';
                  const roleLabel = String(employee.role || 'employee').toLowerCase() === 'admin' ? 'Admin' : 'Employee';
                  return <tr key={employee._id} className="hover:bg-blue-50/40">
                    <td className="px-5 py-4 text-sm font-semibold text-[#2563EB]">{employee.employeeId || 'Not assigned'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {employee.avatar ? (
                          <img
                            src={employee.avatar}
                            alt={employee.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                            }}
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-indigo-500/20"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initials(employee.name)}</span>
                        )}
                        <span className="text-sm font-semibold text-[#0F172A]">{employee.name || 'Unnamed employee'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#475569]">{employee.email}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-indigo-600">{roleLabel}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle[employeeStatus]}`}>{employeeStatus}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button type="button" title="View employee" onClick={() => navigate(`/admin/employees/${employee._id}`)} className="rounded-lg p-2 text-[#2563EB] hover:bg-blue-50 cursor-pointer"><Eye className="h-4 w-4" /></button>
                        <button type="button" title="Edit employee" onClick={() => setEditingEmployee(employee)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 cursor-pointer"><Pencil className="h-4 w-4" /></button>
                        <button type="button" title="Deactivate employee" disabled={employeeStatus === 'Inactive'} onClick={() => setDeactivatingEmployee(employee)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"><UserMinus className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingEmployee && (
        <EditUserModal
          token={token}
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onUpdated={() => loadDirectory()}
        />
      )}

      {deactivatingEmployee && (
        <ConfirmModal
          isOpen={Boolean(deactivatingEmployee)}
          title="Deactivate Employee Account"
          itemName={deactivatingEmployee.name}
          message={`Are you sure you want to deactivate ${deactivatingEmployee.name}'s account?`}
          warning="They will no longer be able to sign in to their account."
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
          confirmVariant="danger"
          loading={deactivating}
          onConfirm={handleConfirmDeactivate}
          onClose={() => setDeactivatingEmployee(null)}
        />
      )}
    </section>
  );
}
