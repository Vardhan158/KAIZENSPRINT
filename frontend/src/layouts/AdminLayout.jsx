import React from 'react';
import Sidebar from '../components/Sidebar';
import NotificationDropdown from '../components/NotificationDropdown';

export default function AdminLayout({ children, currentUser, handleLogout, token, onOpenTaskModal, onOpenUserModal, onOpenSprintModal }) {
  return (
    <div className="min-h-screen cinematic-bg flex">
      <Sidebar
        currentUser={currentUser}
        handleLogout={handleLogout}
        isEmployeeViewMode={false}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="glass-card sticky top-0 z-10 px-8 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-slate-100 tracking-wide">
              Admin Command Workspace
            </h1>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 font-semibold">
              Active Sprint: Sprint 1
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <NotificationDropdown currentUser={currentUser} token={token} />

            <button
              onClick={onOpenSprintModal}
              className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-4 py-2 rounded-xl text-sm font-medium border border-purple-500/30 flex items-center space-x-2 transition-colors"
            >
              <span>+ Plan Sprint</span>
            </button>
            <button
              onClick={onOpenUserModal}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium border border-slate-700 flex items-center space-x-2 transition-colors"
            >
              <span>+ Add Employee</span>
            </button>
            <button
              onClick={onOpenTaskModal}
              className="gradient-btn text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20"
            >
              <span>Create Task</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
