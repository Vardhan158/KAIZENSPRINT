import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';

export default function EmployeeDetailView({ users = [], tasks = [], token, fetchAllData }) {
  const { id } = useParams();
  const safeUsers = Array.isArray(users) ? users : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const employee = safeUsers.find(u => String(u._id) === String(id) || String(u.employeeId) === String(id));

  if (!employee) {
    return (
      <div className="p-8 text-center text-slate-400 space-y-4 font-sans">
        <p>Employee not found.</p>
        <Link to="/admin/employees" className="text-indigo-600 underline text-sm font-semibold">Back to Employee Management</Link>
      </div>
    );
  }

  const assignedTasks = safeTasks.filter(t => t.assigneeId?._id === employee._id || t.assigneeId === employee._id);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <Link to="/admin/employees" className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          {employee.avatar ? <img src={employee.avatar} alt={employee.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/20" /> : <div className="w-16 h-16 rounded-2xl bg-slate-100 ring-2 ring-indigo-500/20 flex items-center justify-center text-slate-400"><Users className="w-7 h-7" /></div>}
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {employee.employeeId}
              </span>
              <h2 className="text-2xl font-extrabold text-[#0F172A]">{employee.name}</h2>
            </div>
            <p className="text-xs text-[#475569] mt-1">{employee.designation} • {employee.department}</p>
          </div>
        </div>

        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold uppercase">
          {employee.accountStatus || 'Active'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="font-bold text-[#0F172A] text-sm">Personal Info</h3>
          <div className="space-y-3 text-xs text-[#475569]">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>{employee.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-purple-600" />
              <span>{employee.mobileNumber || 'Not provided'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Joined: {employee.joiningDate || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {/* Workload Stats */}
        <div className="md:col-span-2 rounded-2xl p-6 border border-slate-200 bg-white shadow-sm space-y-6">
          <h3 className="font-bold text-[#0F172A] text-sm">Assigned Tasks ({assignedTasks.length})</h3>
          <div className="space-y-3">
            {assignedTasks.map(t => (
              <div key={t._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between shadow-xs">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600">{t.taskId}</span>
                  <h4 className="font-bold text-[#0F172A] text-sm">{t.title}</h4>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full capitalize font-medium">{t.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
