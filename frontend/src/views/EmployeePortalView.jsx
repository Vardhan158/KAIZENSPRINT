import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Briefcase, CheckSquare, Kanban, Clock, Bug,
  Calendar as CalendarIcon, Bell, BarChart3, User, Send, Plus,
  CheckCircle2, AlertTriangle, ArrowRight, ShieldAlert, Sparkles,
  Lock, Key, FileText, Check, ChevronRight, Eye, RefreshCw
} from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function EmployeePortalView({ currentUser, tasks, projects, sprints, bugs, progressLogs, token, fetchAllData }) {
  const [activePortalTab, setActivePortalTab] = useState('dashboard');

  // Filtered data for the logged-in employee
  const myTasks = tasks.filter(t => t.assigneeId && (t.assigneeId._id === currentUser.id || t.assigneeId === currentUser.id));
  const myProjects = projects.filter(p => {
    if (!p.members) return false;
    return p.members.some(m => (m._id === currentUser.id || m === currentUser.id)) || (p.lead && (p.lead._id === currentUser.id || p.lead === currentUser.id));
  });

  const todoTasks = myTasks.filter(t => t.status === 'todo' || t.status === 'backlog');
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress');
  const reviewTasks = myTasks.filter(t => t.status === 'review');
  const doneTasks = myTasks.filter(t => t.status === 'done');

  const totalPoints = myTasks.reduce((acc, t) => acc + (Number(t.storyPoints) || 3), 0);
  const completedPoints = doneTasks.reduce((acc, t) => acc + (Number(t.storyPoints) || 3), 0);

  // Standup Form State
  const [standupForm, setStandupForm] = useState({ yesterday: '', today: '', blockers: '' });
  const [standupSubmitting, setStandupSubmitting] = useState(false);

  // Time Log State
  const [timeLogForm, setTimeLogForm] = useState({ taskId: '', hours: '', note: '' });
  const [timeLogSubmitting, setTimeLogSubmitting] = useState(false);

  // Report Bug Form State
  const [bugForm, setBugForm] = useState({
    title: '', projectId: projects[0]?._id || '', taskId: '',
    severity: 'Major', environment: 'Testing', description: '',
    stepsToReproduce: '', expectedResult: '', actualResult: '', screenshot: ''
  });
  const [bugSubmitting, setBugSubmitting] = useState(false);

  // Profile & Password State
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name || '',
    mobileNumber: currentUser.mobileNumber || '',
    avatar: currentUser.avatar || ''
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Task Status Update Handler
  const handleTaskStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchAllData();
        toast.success(`Task status updated successfully!`);
      }
    } catch (err) {
      console.error('Failed to update task status', err);
      toast.error('Failed to update task status.');
    }
  };

  // Submit Standup
  const handleStandupSubmit = async (e) => {
    e.preventDefault();
    if (!standupForm.yesterday || !standupForm.today) {
      toast.warning('Please fill in your yesterday and today updates.');
      return;
    }
    try {
      setStandupSubmitting(true);
      const res = await fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(standupForm)
      });
      if (res.ok) {
        toast.success('Daily standup submitted successfully!');
        setStandupForm({ yesterday: '', today: '', blockers: '' });
        fetchAllData();
      } else {
        toast.error('Failed to submit standup.');
      }
    } catch (err) {
      console.error('Standup submission error', err);
      toast.error('Failed to submit standup.');
    } finally {
      setStandupSubmitting(false);
    }
  };

  // Log Time
  const handleTimeLogSubmit = async (e) => {
    e.preventDefault();
    if (!timeLogForm.taskId || !timeLogForm.hours) {
      toast.warning('Please select a task and enter hours.');
      return;
    }
    try {
      setTimeLogSubmitting(true);
      const res = await fetch(`${API_BASE}/tasks/${timeLogForm.taskId}/worklog`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ hours: Number(timeLogForm.hours), note: timeLogForm.note })
      });
      if (res.ok) {
        toast.success('Working hours logged successfully!');
        setTimeLogForm({ taskId: '', hours: '', note: '' });
        fetchAllData();
      } else {
        toast.error('Failed to log working hours.');
      }
    } catch (err) {
      console.error('Time log error', err);
      toast.error('Failed to log working hours.');
    } finally {
      setTimeLogSubmitting(false);
    }
  };

  // Report Bug
  const handleBugSubmit = async (e) => {
    e.preventDefault();
    if (!bugForm.title || !bugForm.projectId || !bugForm.description) {
      toast.warning('Title, project and description are required.');
      return;
    }
    try {
      setBugSubmitting(true);
      const res = await fetch(`${API_BASE}/bugs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bugForm)
      });
      if (res.ok) {
        toast.success('Defect reported to quality assurance lead successfully!');
        setBugForm({
          title: '', projectId: projects[0]?._id || '', taskId: '',
          severity: 'Major', environment: 'Testing', description: '',
          stepsToReproduce: '', expectedResult: '', actualResult: '', screenshot: ''
        });
        fetchAllData();
      } else {
        toast.error('Failed to report bug.');
      }
    } catch (err) {
      console.error('Bug report error', err);
      toast.error('Failed to report bug.');
    } finally {
      setBugSubmitting(false);
    }
  };

  // Update Profile
  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileForm.name,
          mobileNumber: profileForm.mobileNumber,
          avatar: profileForm.avatar
        })
      });
      if (res.ok) {
        toast.success('Profile details updated successfully!');
        fetchAllData();
      } else {
        toast.error('Failed to update profile details.');
      }
    } catch (err) {
      console.error('Profile update error', err);
      toast.error('Profile update failed.');
    }
  };

  // Change Password
  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.warning('New passwords do not match.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Account password updated successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch (err) {
      console.error('Password change error', err);
      toast.error('Failed to change password.');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Employee Workspace Navigation Header */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-xs" />
          <div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] flex items-center space-x-2">
              <span>Employee Portal: {currentUser.name}</span>
              <span className="text-xs bg-blue-50 text-[#2563EB] border border-blue-200 px-3 py-0.5 rounded-full uppercase tracking-wider font-bold">
                {currentUser.designation || 'Software Engineer'}
              </span>
            </h2>
            <p className="text-xs text-[#475569] mt-1">
              Personal workspace for daily standups, assigned tasks, sprint board, time logging and performance reports.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <span className="text-xs text-[#475569] block font-medium">Sprint Capacity</span>
            <span className="text-sm font-bold text-emerald-700 font-medium">{completedPoints} / {totalPoints} Story Pts</span>
          </div>
        </div>
      </div>

      {/* Employee Sub-Tab Navigation Bar (Smooth Horizontal Scroll) */}
      <div className="rounded-2xl p-2 flex items-center space-x-2 overflow-x-auto scrollbar-none border border-slate-200 bg-white shadow-sm">
        <PortalTabBtn id="dashboard" label="My Dashboard" icon={<LayoutDashboard className="w-4 h-4" />} activePortalTab={activePortalTab} setActivePortalTab={setActivePortalTab} />
        <PortalTabBtn id="projects" label="My Projects" icon={<Briefcase className="w-4 h-4" />} activePortalTab={activePortalTab} setActivePortalTab={setActivePortalTab} />
        <PortalTabBtn id="tasks" label="My Tasks" icon={<CheckSquare className="w-4 h-4" />} activePortalTab={activePortalTab} setActivePortalTab={setActivePortalTab} />
        <PortalTabBtn id="sprint_board" label="Sprint Board" icon={<Kanban className="w-4 h-4" />} activePortalTab={activePortalTab} setActivePortalTab={setActivePortalTab} />
        <PortalTabBtn id="standup" label="Daily Standup" icon={<Send className="w-4 h-4" />} activePortalTab={activePortalTab} setActivePortalTab={setActivePortalTab} />
        <PortalTabBtn id="timelogs" label="Time Logs" icon={<Clock className="w-4 h-4" />} activePortalTab={activePortalTab} setActiveSubTab={setActivePortalTab} setActivePortalTab={setActivePortalTab} />
        <PortalTabBtn id="report_bug" label="Report Bug" icon={<Bug className="w-4 h-4" />} activePortalTab={activePortalTab} setActivePortalTab={setActivePortalTab} />
        <PortalTabBtn id="calendar" label="Calendar" icon={<CalendarIcon className="w-4 h-4" />} activePortalTab={activePortalTab} setActivePortalTab={setActivePortalTab} />
        <PortalTabBtn id="reports" label="My Reports" icon={<BarChart3 className="w-4 h-4" />} activePortalTab={activePortalTab} setActivePortalTab={setActivePortalTab} />
        <PortalTabBtn id="profile" label="My Profile" icon={<User className="w-4 h-4" />} activePortalTab={activePortalTab} setActivePortalTab={setActivePortalTab} />
      </div>

      {/* MODULE 1: MY DASHBOARD */}
      {activePortalTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricWidget title="Assigned Tasks" value={myTasks.length} label="Total Tasks" icon={<CheckSquare className="w-6 h-6 text-[#2563EB]" />} />
            <MetricWidget title="In Progress" value={inProgressTasks.length} label="Active Work" icon={<Clock className="w-6 h-6 text-amber-600" />} />
            <MetricWidget title="In Review" value={reviewTasks.length} label="Pending Approval" icon={<Eye className="w-6 h-6 text-purple-600" />} />
            <MetricWidget title="Completed" value={doneTasks.length} label="Finished Tasks" icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />} />
          </div>

          <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#2563EB]" />
                  <span>My Current Tasks & Deliverables</span>
                </h3>
                <p className="text-xs text-[#475569]">Direct workload queue with status transitions and due date trackers.</p>
              </div>
              <span className="text-xs bg-blue-50 text-[#2563EB] px-3 py-1 rounded-full border border-blue-200 font-semibold">
                {myTasks.length} Active Items
              </span>
            </div>

            <div className="space-y-4">
              {myTasks.length > 0 ? (
                myTasks.map(task => (
                  <div key={task._id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-[#2563EB] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          {task.taskId}
                        </span>
                        <h4 className="font-bold text-[#0F172A] text-sm">{task.title}</h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          task.priority === 'urgent' || task.priority === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] line-clamp-1">{task.description || 'No detailed description provided.'}</p>
                      <div className="flex items-center space-x-4 text-xs text-[#475569] pt-1">
                        <span>Project: <strong className="text-[#2563EB]">{task.projectId?.name || 'Kaizen Project'}</strong></span>
                        <span>Due: <strong className="text-amber-700">{task.dueDate}</strong></span>
                        <span>Points: <strong className="text-purple-700">{task.storyPoints || 3} SP</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) => handleTaskStatusChange(task._id, e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Submit for Review</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-xs text-[#475569]">No tasks currently assigned to you.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 2: MY PROJECTS */}
      {activePortalTab === 'projects' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">My Assigned Projects ({myProjects.length})</h3>
            <p className="text-xs text-[#475569]">Projects where you are listed as an active team member or technical lead.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myProjects.length > 0 ? (
              myProjects.map(proj => (
                <div key={proj._id} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-3 py-1 rounded border border-blue-200 uppercase">{proj.key}</span>
                    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">{proj.status || 'Active'}</span>
                  </div>
                  <h4 className="font-bold text-base text-[#0F172A]">{proj.name}</h4>
                  <p className="text-xs text-[#475569]">{proj.description || 'Enterprise project workspace.'}</p>
                  <div className="flex justify-between text-xs text-[#475569] pt-2 border-t border-slate-200">
                    <span>Start: {proj.startDate || '2025-01-01'}</span>
                    <span>End: {proj.endDate || '2025-12-31'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-xs text-[#475569] md:col-span-2">No projects assigned currently.</div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 3: MY TASKS */}
      {activePortalTab === 'tasks' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">My Task Backlog ({myTasks.length})</h3>
            <p className="text-xs text-[#475569]">Complete listing of all tasks assigned to your employee account.</p>
          </div>

          <div className="space-y-3">
            {myTasks.length > 0 ? (
              myTasks.map(t => (
                <div key={t._id} className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-4 shadow-xs">
                  <div>
                    <span className="text-xs font-bold text-[#2563EB] mr-2">{t.taskId}</span>
                    <span className="font-semibold text-xs text-[#0F172A]">{t.title}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="text-amber-700 font-medium">Due: {t.dueDate}</span>
                    <span className={`px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] border ${t.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700'}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-xs text-[#475569]">No tasks found.</div>
            )}
          </div>
        </div>
      )}

      {/* MODULE 4: SPRINT BOARD */}
      {activePortalTab === 'sprint_board' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Sprint Kanban Board</h3>
            <p className="text-xs text-[#475569]">Drag or update task workflow states across backlog and completion stages.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SprintColumn title="To Do" tasks={todoTasks} status="todo" handleTaskStatusChange={handleTaskStatusChange} />
            <SprintColumn title="In Progress" tasks={inProgressTasks} status="in_progress" handleTaskStatusChange={handleTaskStatusChange} />
            <SprintColumn title="In Review" tasks={reviewTasks} status="review" handleTaskStatusChange={handleTaskStatusChange} />
            <SprintColumn title="Completed" tasks={doneTasks} status="done" handleTaskStatusChange={handleTaskStatusChange} />
          </div>
        </div>
      )}

      {/* MODULE 5: DAILY STANDUP */}
      {activePortalTab === 'standup' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6 max-w-2xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Submit Daily Standup</h3>
            <p className="text-xs text-[#475569]">Report yesterday's progress, today's goals, and active blockers.</p>
          </div>

          <form onSubmit={handleStandupSubmit} className="space-y-4 text-xs">
            <div>
              <label className={labelClass}>What did you accomplish yesterday? *</label>
              <textarea
                rows={3}
                required
                value={standupForm.yesterday}
                onChange={e => setStandupForm({ ...standupForm, yesterday: e.target.value })}
                className={inputClass}
                placeholder="Completed authentication UI components and schema..."
              />
            </div>

            <div>
              <label className={labelClass}>What are you working on today? *</label>
              <textarea
                rows={3}
                required
                value={standupForm.today}
                onChange={e => setStandupForm({ ...standupForm, today: e.target.value })}
                className={inputClass}
                placeholder="Integrating OAuth API and writing unit tests..."
              />
            </div>

            <div>
              <label className={labelClass}>Any blockers or impediments?</label>
              <input
                type="text"
                value={standupForm.blockers}
                onChange={e => setStandupForm({ ...standupForm, blockers: e.target.value })}
                className={inputClass}
                placeholder="None currently..."
              />
            </div>

            <button
              type="submit"
              disabled={standupSubmitting}
              className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-6 py-3 text-sm font-semibold shadow-sm transition cursor-pointer w-full"
            >
              {standupSubmitting ? 'Submitting...' : 'Submit Daily Standup'}
            </button>
          </form>
        </div>
      )}

      {/* MODULE 6: TIME LOGS */}
      {activePortalTab === 'timelogs' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6 max-w-2xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Log Working Hours</h3>
            <p className="text-xs text-[#475569]">Record timesheet hours against your assigned tasks.</p>
          </div>

          <form onSubmit={handleTimeLogSubmit} className="space-y-4 text-xs">
            <div>
              <label className={labelClass}>Select Task *</label>
              <select
                required
                value={timeLogForm.taskId}
                onChange={e => setTimeLogForm({ ...timeLogForm, taskId: e.target.value })}
                className={inputClass}
              >
                <option value="">Select assigned task...</option>
                {myTasks.map(t => (
                  <option key={t._id} value={t._id}>{t.taskId}: {t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Hours Spent *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                required
                value={timeLogForm.hours}
                onChange={e => setTimeLogForm({ ...timeLogForm, hours: e.target.value })}
                className={inputClass}
                placeholder="e.g. 4.5"
              />
            </div>

            <div>
              <label className={labelClass}>Work Description / Note</label>
              <textarea
                rows={2}
                value={timeLogForm.note}
                onChange={e => setTimeLogForm({ ...timeLogForm, note: e.target.value })}
                className={inputClass}
                placeholder="Implemented unit tests..."
              />
            </div>

            <button
              type="submit"
              disabled={timeLogSubmitting}
              className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-6 py-3 text-sm font-semibold shadow-sm transition cursor-pointer w-full"
            >
              {timeLogSubmitting ? 'Logging...' : 'Log Working Hours'}
            </button>
          </form>
        </div>
      )}

      {/* MODULE 7: REPORT BUG */}
      {activePortalTab === 'report_bug' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6 max-w-2xl mx-auto">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Report Defect or Bug</h3>
            <p className="text-xs text-[#475569]">Submit bug tickets to the QA and engineering lead.</p>
          </div>

          <form onSubmit={handleBugSubmit} className="space-y-4 text-xs">
            <div>
              <label className={labelClass}>Bug Title *</label>
              <input
                type="text"
                required
                value={bugForm.title}
                onChange={e => setBugForm({ ...bugForm, title: e.target.value })}
                className={inputClass}
                placeholder="e.g. NullPointerException on login form"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Project *</label>
                <select
                  required
                  value={bugForm.projectId}
                  onChange={e => setBugForm({ ...bugForm, projectId: e.target.value })}
                  className={inputClass}
                >
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Severity *</label>
                <select
                  value={bugForm.severity}
                  onChange={e => setBugForm({ ...bugForm, severity: e.target.value })}
                  className={inputClass}
                >
                  <option value="Minor">Minor</option>
                  <option value="Major">Major</option>
                  <option value="Critical">Critical</option>
                  <option value="Blocker">Blocker</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description *</label>
              <textarea
                rows={3}
                required
                value={bugForm.description}
                onChange={e => setBugForm({ ...bugForm, description: e.target.value })}
                className={inputClass}
                placeholder="Detailed explanation of the issue..."
              />
            </div>

            <button
              type="submit"
              disabled={bugSubmitting}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 text-sm font-semibold shadow-sm transition cursor-pointer w-full"
            >
              {bugSubmitting ? 'Submitting...' : 'Submit Bug Ticket'}
            </button>
          </form>
        </div>
      )}

      {/* MODULE 8: CALENDAR */}
      {activePortalTab === 'calendar' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">My Schedule & Deadlines</h3>
            <p className="text-xs text-[#475569]">Upcoming task deadlines and milestone schedules.</p>
          </div>

          <div className="space-y-3">
            {myTasks.map(t => (
              <div key={t._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs shadow-xs">
                <div>
                  <span className="font-bold text-[#2563EB] mr-2">{t.taskId}</span>
                  <span className="font-semibold text-[#0F172A]">{t.title}</span>
                </div>
                <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">Due: {t.dueDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 9: MY REPORTS */}
      {activePortalTab === 'reports' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#0F172A]">Performance Analytics & Metrics</h3>
            <p className="text-xs text-[#475569]">Personal velocity, completion ratio, and story point breakdown.</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-xs">
              <span className="text-[#475569] block font-medium">Completed Story Points</span>
              <span className="text-2xl font-extrabold text-[#2563EB] mt-1 block">{completedPoints} pts</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-xs">
              <span className="text-[#475569] block font-medium">Total Assigned Points</span>
              <span className="text-2xl font-extrabold text-indigo-700 mt-1 block">{totalPoints} pts</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-xs">
              <span className="text-[#475569] block font-medium">Completion Ratio</span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                {totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODULE 10: MY PROFILE */}
      {activePortalTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-slate-200 pb-3">Edit Profile Details</h3>
            <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Mobile Number</label>
                <input
                  type="text"
                  value={profileForm.mobileNumber}
                  onChange={e => setProfileForm({ ...profileForm, mobileNumber: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Avatar Image URL</label>
                <input
                  type="url"
                  value={profileForm.avatar}
                  onChange={e => setProfileForm({ ...profileForm, avatar: e.target.value })}
                  className={inputClass}
                />
              </div>

              <button type="submit" className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-semibold shadow-sm cursor-pointer">
                Save Profile Changes
              </button>
            </form>
          </div>

          <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-[#0F172A] border-b border-slate-200 pb-3">Change Account Password</h3>
            <form onSubmit={handlePasswordSave} className="space-y-4 text-xs">
              <div>
                <label className={labelClass}>Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={inputClass}
                />
              </div>

              <button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-semibold shadow-sm cursor-pointer">
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PortalTabBtn({ id, label, icon, activePortalTab, setActivePortalTab }) {
  const active = activePortalTab === id;
  return (
    <button
      type="button"
      onClick={() => setActivePortalTab(id)}
      className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
        active
          ? 'bg-blue-50 text-[#2563EB] border border-blue-200 font-bold shadow-xs'
          : 'text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MetricWidget({ title, value, label, icon }) {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">{title}</span>
        {icon}
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-extrabold text-[#0F172A]">{value}</span>
        <span className="text-xs text-[#475569]">{label}</span>
      </div>
    </div>
  );
}

function SprintColumn({ title, tasks, status, handleTaskStatusChange }) {
  return (
    <div className="rounded-2xl p-5 border border-slate-200 bg-white shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h4 className="font-bold text-[#0F172A] text-sm">{title}</h4>
        <span className="text-xs font-mono bg-blue-50 text-[#2563EB] border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">{tasks.length}</span>
      </div>

      <div className="space-y-3">
        {tasks.map(t => (
          <div key={t._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 shadow-xs">
            <span className="text-xs font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{t.taskId}</span>
            <h5 className="font-bold text-[#0F172A] text-xs">{t.title}</h5>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-[#475569]">Due: {t.dueDate}</span>
              {status === 'todo' && (
                <button type="button" onClick={() => handleTaskStatusChange(t._id, 'in_progress')} className="text-[10px] text-amber-700 font-semibold hover:underline cursor-pointer">
                  Start →
                </button>
              )}
              {status === 'in_progress' && (
                <button type="button" onClick={() => handleTaskStatusChange(t._id, 'review')} className="text-[10px] text-purple-700 font-semibold hover:underline cursor-pointer">
                  Submit →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}