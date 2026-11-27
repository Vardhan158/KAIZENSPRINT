import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Bug, CheckSquare, Clock,
  Shield, User, Sparkles, LogOut, FileText, BarChart3, Briefcase,
  Calendar as CalendarIcon, ShieldCheck, Sliders, Send, Monitor, Activity,
  ChevronLeft, ChevronRight, Kanban
} from 'lucide-react';

export default function Sidebar({ currentUser, handleLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  const isEmployee = currentUser?.role === 'employee' || currentUser?.role === 'EMPLOYEE';

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-72'} bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 shadow-sm h-screen sticky top-0 shrink-0 font-sans`}>
      {/* Collapse Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 w-7 h-7 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-full flex items-center justify-center shadow-md transition-all z-30 cursor-pointer"
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Brand Header */}
      <div className={`p-5 flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} border-b border-slate-100 shrink-0`}>
        <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h2 className="font-extrabold text-base tracking-tight gradient-text">KAIZENSPRINT</h2>
            <p className="text-[11px] text-slate-500 font-medium">Enterprise Agile OS</p>
          </div>
        )}
      </div>

      {/* User Profile Info */}
      <div className={`p-4 border-b border-slate-100 flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} bg-slate-50/50 shrink-0`}>
        <img src={currentUser.avatar} alt={currentUser.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/30 shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate text-slate-800">{currentUser.name}</p>
            <p className="text-[11px] text-indigo-600 capitalize font-medium flex items-center space-x-1">
              {currentUser.role === 'admin' ? <Shield className="w-3 h-3 inline mr-0.5" /> : <User className="w-3 h-3 inline mr-0.5" />}
              {currentUser.role}
            </p>
          </div>
        )}
      </div>

      {/* Portal Mode Indicator (Non-clickable, display-only) */}
      {!collapsed && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-center flex items-center justify-center space-x-2 border bg-indigo-50 text-indigo-700 border-indigo-200">
            <Monitor className="w-3.5 h-3.5" />
            <span>{isEmployee ? 'Employee Portal' : 'Admin Portal'}</span>
          </div>
        </div>
      )}

      {/* Navigation Links (Independent Sidebar Scrolling) */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {isEmployee ? (
          /* Employee Navigation */
          <>
            {!collapsed && <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Employee Workspace</div>}
            <SidebarItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" to="/employee/dashboard" active={pathname === '/employee/dashboard'} collapsed={collapsed} />
            <SidebarItem icon={<Briefcase className="w-4 h-4" />} label="My Projects" to="/employee/projects" active={pathname.startsWith('/employee/projects')} collapsed={collapsed} />
            <SidebarItem icon={<CheckSquare className="w-4 h-4" />} label="My Tasks" to="/employee/tasks" active={pathname.startsWith('/employee/tasks')} collapsed={collapsed} />
            <SidebarItem icon={<Kanban className="w-4 h-4" />} label="Sprint Board" to="/employee/board" active={pathname === '/employee/board'} collapsed={collapsed} />
            <SidebarItem icon={<Send className="w-4 h-4" />} label="Daily Standup" to="/employee/standups" active={pathname === '/employee/standups'} collapsed={collapsed} />
            <SidebarItem icon={<Clock className="w-4 h-4" />} label="Time Logs" to="/employee/time-logs" active={pathname === '/employee/time-logs'} collapsed={collapsed} />
            <SidebarItem icon={<Bug className="w-4 h-4" />} label="Report Bug" to="/employee/bugs" active={pathname === '/employee/bugs'} collapsed={collapsed} />
            <SidebarItem icon={<CalendarIcon className="w-4 h-4" />} label="Calendar" to="/employee/calendar" active={pathname === '/employee/calendar'} collapsed={collapsed} />
            <SidebarItem icon={<BarChart3 className="w-4 h-4" />} label="My Reports" to="/employee/reports" active={pathname === '/employee/reports'} collapsed={collapsed} />
            <SidebarItem icon={<User className="w-4 h-4" />} label="My Profile" to="/employee/profile" active={pathname === '/employee/profile'} collapsed={collapsed} />
          </>
        ) : (
          /* Admin Navigation */
          <>
            {!collapsed && <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Admin Control</div>}
            <SidebarItem icon={<LayoutDashboard className="w-4 h-4" />} label="Overview" to="/admin/dashboard" active={pathname === '/admin/dashboard'} collapsed={collapsed} />
            <SidebarItem icon={<Users className="w-4 h-4" />} label="Employees" to="/admin/employees" active={pathname.startsWith('/admin/employees')} collapsed={collapsed} />
            <SidebarItem icon={<Briefcase className="w-4 h-4" />} label="Projects" to="/admin/projects" active={pathname.startsWith('/admin/projects')} collapsed={collapsed} />
            <SidebarItem icon={<CheckSquare className="w-4 h-4" />} label="Task Management" to="/admin/tasks" active={pathname.startsWith('/admin/tasks')} collapsed={collapsed} />
            <SidebarItem icon={<Users className="w-4 h-4" />} label="Workload" to="/admin/workload" active={pathname === '/admin/workload'} collapsed={collapsed} />
            <SidebarItem icon={<Clock className="w-4 h-4" />} label="Daily Standups" to="/admin/standups" active={pathname === '/admin/standups'} collapsed={collapsed} />
            <SidebarItem icon={<Bug className="w-4 h-4" />} label="Bug Management" to="/admin/bugs" active={pathname === '/admin/bugs'} collapsed={collapsed} />
            <SidebarItem icon={<CalendarIcon className="w-4 h-4" />} label="Calendar" to="/admin/calendar" active={pathname === '/admin/calendar'} collapsed={collapsed} />
            <SidebarItem icon={<CalendarIcon className="w-4 h-4" />} label="Timeline" to="/admin/timeline" active={pathname === '/admin/timeline'} collapsed={collapsed} />
            <SidebarItem icon={<ShieldCheck className="w-4 h-4" />} label="Approvals" to="/admin/approvals" active={pathname === '/admin/approvals'} collapsed={collapsed} />
            <SidebarItem icon={<FileText className="w-4 h-4" />} label="Reports" to="/admin/reports" active={pathname === '/admin/reports'} collapsed={collapsed} />
            <SidebarItem icon={<Sliders className="w-4 h-4" />} label="Settings" to="/admin/settings" active={pathname === '/admin/settings'} collapsed={collapsed} />
            <SidebarItem icon={<Activity className="w-4 h-4" />} label="Audit Logs" to="/admin/audit-logs" active={pathname === '/admin/audit-logs'} collapsed={collapsed} />
          </>
        )}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-100 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold cursor-pointer`}
          title="Sign Out"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, to, active, collapsed }) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
        active
          ? 'bg-indigo-600 text-white font-semibold shadow-sm'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
