import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './Login';
import ActivateAccountView from './views/auth/ActivateAccountView';
import ForgotPasswordView from './views/auth/ForgotPasswordView';
import ResetPasswordView from './views/auth/ResetPasswordView';
import DashboardView from './views/DashboardView';
import EmployeesWorkloadView from './views/EmployeesWorkloadView';
import EmployeeDirectoryView from './views/EmployeeDirectoryView';
import TaskBacklogView from './views/TaskBacklogView';
import BugTrackerView from './views/BugTrackerView';
import DailyProgressView from './views/DailyProgressView';
import CalendarTimelineView from './views/CalendarTimelineView';
import SprintTimelineView from './views/SprintTimelineView';
import ReviewApprovalView from './views/ReviewApprovalView';
import ReportsAnalyticsView from './views/ReportsAnalyticsView';
import AdministrationSettingsView from './views/AdministrationSettingsView';
import AuditLogsView from './views/AuditLogsView';
import ProjectsView from './views/ProjectsView';
import NotificationDropdown from './components/NotificationDropdown';

import EmployeeDashboardView from './views/employee/EmployeeDashboardView';
import EmployeeProjectsView from './views/employee/EmployeeProjectsView';
import EmployeeTasksView from './views/employee/EmployeeTasksView';
import EmployeeBoardView from './views/employee/EmployeeBoardView';
import EmployeeStandupView from './views/employee/EmployeeStandupView';
import EmployeeTimeLogsView from './views/employee/EmployeeTimeLogsView';
import EmployeeBugsView from './views/employee/EmployeeBugsView';
import EmployeeCalendarView from './views/employee/EmployeeCalendarView';
import EmployeeReportsView from './views/employee/EmployeeReportsView';
import EmployeeProfileView from './views/employee/EmployeeProfileView';

import ProjectDetailView from './views/details/ProjectDetailView';
import EmployeeDetailView from './views/details/EmployeeDetailView';
import TaskDetailView from './views/details/TaskDetailView';
import SprintDetailView from './views/details/SprintDetailView';
import EmployeeWorkloadDetailView from './views/details/EmployeeWorkloadDetailView';

import CreateTaskModal from './modals/CreateTaskModal';
import CreateUserModal from './modals/CreateUserModal';
import CreateBugModal from './modals/CreateBugModal';
import CreateSprintModal from './modals/CreateSprintModal';
import TaskDetailModal from './modals/TaskDetailModal';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://kaizensprint.onrender.com/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://kaizensprint.onrender.com';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('jira_token') || '');
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('jira_user') || 'null'));

  // Global Header Search Term
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [globalSearchState, setGlobalSearchState] = useState('idle');

  const navigate = useNavigate();
  const location = useLocation();

  // App data state
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [progressLogs, setProgressLogs] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);

  // Modals state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [employeeDirectoryVersion, setEmployeeDirectoryVersion] = useState(0);
  const [showBugModal, setShowBugModal] = useState(false);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);

  useEffect(() => {
    const query = globalSearchTerm.trim();
    if (query.length < 2 || !token) {
      setGlobalSearchResults([]);
      setGlobalSearchState('idle');
      return;
    }

    setGlobalSearchState('loading');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGlobalSearchResults(Array.isArray(data) ? data : []);
          setGlobalSearchState('success');
        } else {
          setGlobalSearchResults([]);
          setGlobalSearchState('error');
        }
      } catch (err) {
        console.error('Global search error', err);
        setGlobalSearchResults([]);
        setGlobalSearchState('error');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [globalSearchTerm, token]);

  const fetchAllData = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const fetchPromises = [
        fetch(`${API_BASE}/users`, { headers }),
        fetch(`${API_BASE}/projects`, { headers }),
        fetch(`${API_BASE}/sprints`, { headers }),
        fetch(`${API_BASE}/tasks`, { headers }),
        fetch(`${API_BASE}/bugs`, { headers }),
        fetch(`${API_BASE}/progress`, { headers }),
        fetch(`${API_BASE}/analytics/workload`, { headers })
      ];

      if (currentUser?.role === 'admin') {
        fetchPromises.push(fetch(`${API_BASE}/v1/dashboard/admin`, { headers }).catch(() => null));
      }

      const resList = await Promise.all(fetchPromises);
      const uRes = resList[0];
      const pRes = resList[1];
      const sRes = resList[2];
      const tRes = resList[3];
      const bRes = resList[4];
      const prRes = resList[5];
      const wRes = resList[6];
      const dRes = currentUser?.role === 'admin' ? resList[7] : null;

      if (uRes.ok) {
        const userData = await uRes.json();
        setUsers(Array.isArray(userData) ? userData : (userData.users || []));
      }
      if (pRes.ok) setProjects(await pRes.json());
      if (sRes.ok) setSprints(await sRes.json());
      if (tRes.ok) setTasks(await tRes.json());
      if (bRes.ok) setBugs(await bRes.json());
      if (prRes.ok) setProgressLogs(await prRes.json());
      if (wRes.ok) setWorkloadData(await wRes.json());
      if (dRes && dRes.ok) setDashboardData(await dRes.json());
    } catch (err) {
      console.error('Failed to fetch application data', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on('work_log_logged', fetchAllData);
    return () => { socket.off('work_log_logged', fetchAllData); socket.disconnect(); };
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('jira_token');
    localStorage.removeItem('jira_user');
    setToken('');
    setCurrentUser(null);
    navigate('/login');
  };

  const getHeaderTitle = () => {
    const p = location.pathname;
    if (p.includes('/admin/dashboard')) return 'Command Dashboard Overview';
    if (p.includes('/admin/employees')) return 'Employee Management';
    if (p.includes('/admin/projects')) return 'Projects Workspace';
    if (p.includes('/admin/tasks')) return 'Task Management Backlog';
    if (p.includes('/admin/workload')) return 'Employees Workload Capacity';
    if (p.includes('/admin/standups')) return 'Daily Standup Logs';
    if (p.includes('/admin/bugs')) return 'Bug Triage & Defect Management';
    if (p.includes('/admin/calendar')) return 'Calendar Deadlines';
    if (p.includes('/admin/timeline')) return 'Sprint Timeline & Roadmap';
    if (p.includes('/admin/approvals')) return 'Review & Task Approvals';
    if (p.includes('/admin/reports')) return 'Organization Reports & Velocity';
    if (p.includes('/admin/settings')) return 'Administration & Settings Hub';
    if (p.includes('/admin/audit-logs')) return 'Security Audit Logs';
    if (p.includes('/employee/')) return 'Employee Workspace Portal';
    return 'KaizenSprint Agile Engine';
  };

  const isEmployee = currentUser?.role === 'employee' || currentUser?.role === 'EMPLOYEE';

  return (
    <Routes>
      <Route path="/login" element={<Login setToken={setToken} setCurrentUser={setCurrentUser} />} />
      <Route path="/activate-account" element={<ActivateAccountView />} />
      <Route path="/forgot-password" element={<ForgotPasswordView />} />
      <Route path="/reset-password" element={<ResetPasswordView />} />

      <Route element={<ProtectedRoute token={token} currentUser={currentUser} />}>
        <Route
          path="/*"
          element={
            <div className="min-h-screen cinematic-bg flex h-screen overflow-hidden font-sans">
              <Sidebar
                currentUser={currentUser}
                handleLogout={handleLogout}
              />

              <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-50/50">
                {/* Global Bright Enterprise Top Header */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-3.5 flex items-center justify-between shadow-xs shrink-0">
                  <div className="flex items-center space-x-6 flex-1 max-w-2xl">
                    <h1 className="text-base font-extrabold text-slate-800 tracking-tight whitespace-nowrap">
                      {getHeaderTitle()}
                    </h1>

                    {/* Global Search Input */}
                    <div className="relative w-full max-w-md hidden sm:block">
                      <input
                        type="text"
                        value={globalSearchTerm}
                        onChange={e => setGlobalSearchTerm(e.target.value)}
                        placeholder="Global search projects, tasks, bugs, employees..."
                        className="w-full bg-slate-100 text-xs text-slate-900 border border-slate-200 rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:bg-white focus:border-indigo-600 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {currentUser?.role === 'admin' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowSprintModal(true)}
                          className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
                        >
                          + Plan Sprint
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowUserModal(true)}
                          className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
                        >
                          + Add Employee
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowTaskModal(true)}
                      className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-4 py-1.5 text-xs font-semibold shadow-sm cursor-pointer"
                    >
                      <span>Create Task</span>
                    </button>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto space-y-8 font-sans">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        isEmployee
                          ? <Navigate to="/employee/dashboard" replace />
                          : <Navigate to="/admin/dashboard" replace />
                      }
                    />

                    {/* ADMIN ROUTES (Role-Enforced) */}
                    <Route
                      path="/admin/*"
                      element={
                        isEmployee
                          ? <Navigate to="/employee/dashboard" replace />
                          : (
                            <Routes>
                              <Route path="/dashboard" element={<DashboardView data={dashboardData} />} />
                              <Route path="/employees" element={<EmployeeDirectoryView token={token} onAddEmployee={() => setShowUserModal(true)} refreshKey={employeeDirectoryVersion} />} />
                              <Route path="/employees/:id" element={<EmployeeDetailView users={users} tasks={tasks} token={token} fetchAllData={fetchAllData} />} />
                              <Route path="/projects" element={<ProjectsView projects={projects} users={users} tasks={tasks} sprints={sprints} currentUser={currentUser} token={token} fetchAllData={fetchAllData} />} />
                              <Route path="/projects/:id" element={<ProjectDetailView projects={projects} tasks={tasks} sprints={sprints} users={users} currentUser={currentUser} fetchAllData={fetchAllData} token={token} subTab="overview" />} />
                              <Route path="/projects/:id/backlog" element={<ProjectDetailView projects={projects} tasks={tasks} sprints={sprints} users={users} currentUser={currentUser} fetchAllData={fetchAllData} token={token} subTab="backlog" />} />
                              <Route path="/projects/:id/sprints" element={<ProjectDetailView projects={projects} tasks={tasks} sprints={sprints} users={users} currentUser={currentUser} fetchAllData={fetchAllData} token={token} subTab="sprints" />} />
                              <Route path="/projects/:projectId/sprints/:sprintId" element={<SprintDetailView token={token} currentUser={currentUser} fetchAllData={fetchAllData} users={users} />} />
                              <Route path="/projects/:id/board" element={<ProjectDetailView projects={projects} tasks={tasks} sprints={sprints} users={users} currentUser={currentUser} fetchAllData={fetchAllData} token={token} subTab="board" />} />
                              <Route path="/tasks" element={<TaskBacklogView tasks={tasks} users={users} sprints={sprints} token={token} fetchAllData={fetchAllData} />} />
                              <Route path="/tasks/:id" element={<TaskDetailView tasks={tasks} users={users} token={token} fetchAllData={fetchAllData} />} />
                              <Route path="/workload" element={<EmployeesWorkloadView users={users} workloadData={workloadData} token={token} fetchAllData={fetchAllData} />} />
                              <Route path="/workload/:employeeId" element={<EmployeeWorkloadDetailView token={token} />} />
                              <Route path="/standups" element={<DailyProgressView currentUser={currentUser} token={token} />} />
                              <Route path="/bugs" element={<BugTrackerView bugs={bugs} users={users} currentUser={currentUser} token={token} fetchAllData={fetchAllData} onReportBug={() => setShowBugModal(true)} />} />
                              <Route path="/calendar" element={<CalendarTimelineView tasks={tasks} sprints={sprints} projects={projects} users={users} token={token} fetchAllData={fetchAllData} />} />
                              <Route path="/timeline" element={<SprintTimelineView tasks={tasks} sprints={sprints} projects={projects} token={token} fetchAllData={fetchAllData} />} />
                              <Route path="/approvals" element={<ReviewApprovalView tasks={tasks} users={users} currentUser={currentUser} token={token} fetchAllData={fetchAllData} />} />
                              <Route path="/reports" element={<ReportsAnalyticsView tasks={tasks} bugs={bugs} sprints={sprints} projects={projects} workloadData={workloadData} users={users} />} />
                              <Route path="/notifications" element={<NotificationDropdown currentUser={currentUser} token={token} />} />
                              <Route path="/settings" element={<AdministrationSettingsView currentUser={currentUser} token={token} users={users} />} />
                              <Route path="/audit-logs" element={<AuditLogsView currentUser={currentUser} token={token} />} />
                              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                            </Routes>
                          )
                      }
                    />

                    {/* EMPLOYEE ROUTES (Dedicated Separate URLs) */}
                    <Route path="/employee/dashboard" element={<EmployeeDashboardView currentUser={currentUser} tasks={tasks} projects={projects} sprints={sprints} token={token} fetchAllData={fetchAllData} />} />
                    <Route path="/employee/projects" element={<EmployeeProjectsView currentUser={currentUser} projects={projects} />} />
                    <Route path="/employee/tasks" element={<EmployeeTasksView currentUser={currentUser} tasks={tasks} />} />
                    <Route path="/employee/board" element={<EmployeeBoardView currentUser={currentUser} tasks={tasks} token={token} fetchAllData={fetchAllData} />} />
                    <Route path="/employee/standups" element={<EmployeeStandupView currentUser={currentUser} progressLogs={progressLogs} tasks={tasks} token={token} fetchAllData={fetchAllData} />} />
                    <Route path="/employee/time-logs" element={<EmployeeTimeLogsView currentUser={currentUser} tasks={tasks} token={token} fetchAllData={fetchAllData} />} />
                    <Route path="/employee/bugs" element={<EmployeeBugsView currentUser={currentUser} bugs={bugs} projects={projects} token={token} fetchAllData={fetchAllData} />} />
                    <Route path="/employee/calendar" element={<EmployeeCalendarView currentUser={currentUser} tasks={tasks} />} />
                    <Route path="/employee/reports" element={<EmployeeReportsView currentUser={currentUser} token={token} />} />
                    <Route path="/employee/profile" element={<EmployeeProfileView currentUser={currentUser} token={token} fetchAllData={fetchAllData} />} />

                    <Route path="*" element={isEmployee ? <Navigate to="/employee/dashboard" replace /> : <Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </div>
              </main>

              {showTaskModal && <CreateTaskModal projects={projects} sprints={sprints} users={users} token={token} onClose={() => setShowTaskModal(false)} onCreated={fetchAllData} />}
              {showUserModal && <CreateUserModal token={token} onClose={() => setShowUserModal(false)} onCreated={() => { fetchAllData(); setEmployeeDirectoryVersion(version => version + 1); }} />}
              {showBugModal && <CreateBugModal projects={projects} tasks={tasks} users={users} token={token} onClose={() => setShowBugModal(false)} onCreated={fetchAllData} />}
              {showSprintModal && <CreateSprintModal projects={projects} users={users} token={token} onClose={() => setShowSprintModal(false)} onCreated={fetchAllData} />}
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
