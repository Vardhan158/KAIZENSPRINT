import { useState, useEffect } from 'react';
import { Activity, Search, Filter, Download, Eye, ShieldCheck, CheckCircle2, AlertTriangle, Clock, X } from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export default function AuditLogsView({ currentUser, token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const pageSize = 15;

  useEffect(() => {
    fetchAuditLogs();
  }, [token, selectedModule, searchQuery]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const url = `${API_BASE}/audit-logs?module=${selectedModule}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
      toast.error('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedModule('All');
    setSelectedStatus('All');
    setFromDate('');
    setToDate('');
    setEmployeeFilter('');
    setActionFilter('');
    setPage(1);
    toast.success('All filters cleared.');
  };

  // Filtered & Paginated logs
  const filteredLogs = logs.filter(l => {
    const logDate = new Date(l.createdAt || Date.now());
    if (fromDate && logDate < new Date(`${fromDate}T00:00:00`)) return false;
    if (toDate && logDate > new Date(`${toDate}T23:59:59`)) return false;

    if (employeeFilter.trim()) {
      const actor = (l.userName || l.performedBy?.name || 'System').toLowerCase();
      if (!actor.includes(employeeFilter.trim().toLowerCase())) return false;
    }

    if (actionFilter.trim()) {
      const act = (l.action || '').toLowerCase();
      if (!act.includes(actionFilter.trim().toLowerCase())) return false;
    }

    if (selectedStatus === 'Success' && (String(l.action).includes('FAIL') || String(l.action).includes('ERROR'))) return false;
    if (selectedStatus === 'Failed' && !String(l.action).includes('FAIL') && !String(l.action).includes('ERROR')) return false;

    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      toast.warning('No audit logs available to export with current filters.');
      return;
    }
    const headers = ['Timestamp', 'Employee', 'Role', 'Module', 'Action', 'Description', 'Status'];
    const rows = filteredLogs.map(l => [
      new Date(l.createdAt || Date.now()).toISOString(),
      `"${l.userName || l.performedBy?.name || 'System'}"`,
      `"${l.performedBy?.role || 'Admin'}"`,
      `"${l.module || 'General'}"`,
      `"${l.action}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${String(l.action).includes('FAIL') ? 'Failed' : 'Success'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Filtered audit logs exported as CSV successfully!');
  };

  // Summary Metrics
  const totalActivities = logs.length;
  const successfulActions = logs.filter(l => !String(l.action).includes('FAIL') && !String(l.action).includes('ERROR')).length;
  const failedActions = logs.filter(l => String(l.action).includes('FAIL') || String(l.action).includes('ERROR')).length;
  const securityEvents = logs.filter(l => l.module === 'Auth' || l.module === 'Security' || String(l.action).includes('PASSWORD') || String(l.action).includes('LOGIN')).length;

  if (currentUser?.role !== 'admin') {
    return (
      <div className="rounded-2xl p-12 border border-slate-200 bg-white shadow-sm text-center space-y-3 font-sans">
        <ShieldCheck className="w-12 h-12 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-[#0F172A]">Admin Access Required</h3>
        <p className="text-xs text-[#475569]">Audit logs are restricted to system administrators with read-only access privileges.</p>
      </div>
    );
  }

  return (
    <section className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">System Audit Logs & Security Trails</h2>
          <p className="mt-1 text-sm text-[#475569]">Comprehensive read-only activity tracking across all modules derived live from MongoDB Atlas.</p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition cursor-pointer shadow-xs flex items-center space-x-1.5"
        >
          <Download className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-xs">
          <span className="text-[#475569] block font-medium">Total Activities</span>
          <span className="text-2xl font-extrabold text-[#2563EB] mt-1 block">{totalActivities}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-xs">
          <span className="text-[#475569] block font-medium">Successful Actions</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{successfulActions}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-xs">
          <span className="text-[#475569] block font-medium">Failed Actions</span>
          <span className="text-2xl font-extrabold text-rose-700 mt-1 block">{failedActions}</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-xs">
          <span className="text-[#475569] block font-medium">Security Events</span>
          <span className="text-2xl font-extrabold text-purple-700 mt-1 block">{securityEvents}</span>
        </div>
      </div>

      {/* Advanced Search & Filters */}
      <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, user or details..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-10 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="All">All Modules</option>
              <option value="Tasks">Tasks</option>
              <option value="Sprints">Sprints</option>
              <option value="Projects">Projects</option>
              <option value="Employees">Employees</option>
              <option value="Bugs">Bugs</option>
              <option value="Auth">Auth</option>
              <option value="Settings">Settings</option>
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="All">All Statuses</option>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
            </select>

            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-100 transition cursor-pointer flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row: From Date, To Date, Employee, Action */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wide mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wide mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wide mb-1">Employee Filter</label>
            <input
              type="text"
              placeholder="Filter by employee name..."
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#475569] uppercase tracking-wide mb-1">Action Filter</label>
            <input
              type="text"
              placeholder="Filter by action..."
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#475569]">Loading audit logs from MongoDB Atlas...</div>
        ) : paginatedLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#475569]">No audit log entries found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-xs">
              <thead className="bg-slate-50 uppercase font-bold text-[#475569] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((log, idx) => {
                  const isFailed = String(log.action).includes('FAIL') || String(log.action).includes('ERROR');
                  return (
                    <tr key={log._id || idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt || Date.now()).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#0F172A]">
                        {log.userName || log.performedBy?.name || 'System'}
                      </td>
                      <td className="px-4 py-3 text-[#475569] uppercase font-mono text-[10px]">
                        {log.performedBy?.role || 'Admin'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {log.module || 'General'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#0F172A]">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-[#475569] max-w-xs truncate" title={log.details}>
                        {log.details || 'No additional details.'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${isFailed ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                          {isFailed ? 'Failed' : 'Success'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer flex items-center space-x-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 text-xs">
            <span className="text-[#475569]">Showing page {page} of {totalPages} ({filteredLogs.length} total entries)</span>
            <div className="flex space-x-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl space-y-6 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-lg font-bold text-[#0F172A]">Audit Log Details</h3>
              </div>
              <button type="button" onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[#475569] block font-medium">Timestamp</span>
                  <span className="font-bold text-[#0F172A] mt-0.5 block">{new Date(selectedLog.createdAt || Date.now()).toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[#475569] block font-medium">Module</span>
                  <span className="font-bold text-[#2563EB] mt-0.5 block">{selectedLog.module || 'General'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[#475569] block font-medium">Employee / Actor</span>
                  <span className="font-bold text-[#0F172A] mt-0.5 block">{selectedLog.userName || selectedLog.performedBy?.name || 'System'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[#475569] block font-medium">Action</span>
                  <span className="font-bold text-[#0F172A] mt-0.5 block">{selectedLog.action}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[#475569] block font-medium">Full Description / Details</span>
                <p className="text-[#0F172A] font-mono text-xs leading-relaxed">{selectedLog.details || 'No additional details provided.'}</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-5 py-2 font-semibold shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
