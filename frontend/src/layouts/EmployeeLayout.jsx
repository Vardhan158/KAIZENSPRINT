import React from 'react';
import Sidebar from '../components/Sidebar';
import NotificationDropdown from '../components/NotificationDropdown';

export default function EmployeeLayout({ children, currentUser, handleLogout, token, onOpenTaskModal }) {
  return (
    <div className="min-h-screen cinematic-bg flex font-sans">
      <Sidebar
        currentUser={currentUser}
        handleLogout={handleLogout}
        isEmployeeViewMode={true}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="rounded-2xl m-8 mb-0 p-4 border border-slate-200 bg-white shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              Employee Portal Workspace
            </h1>
            <span className="text-xs bg-blue-50 text-[#2563EB] px-3 py-1 rounded-full border border-blue-200 font-semibold uppercase">
              Active Sprint: Sprint 1
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <NotificationDropdown currentUser={currentUser} token={token} />

            <button
              type="button"
              onClick={onOpenTaskModal}
              className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-4 py-2 text-sm font-semibold shadow-sm transition cursor-pointer"
            >
              <span>Create Task</span>
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto space-y-8 font-sans">
          {children}
        </div>
      </main>
    </div>
  );
}
