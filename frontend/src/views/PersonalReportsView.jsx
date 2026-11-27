import React from 'react';
import { Award, CheckCircle, Clock, Sparkles, User, Briefcase } from 'lucide-react';

export default function PersonalReportsView({ currentUser, tasks, progressLogs }) {
  const myTasks = tasks.filter(t => t.assigneeId && (t.assigneeId._id === currentUser.id || t.assigneeId._id?.toString() === currentUser.id));
  const completedMyTasks = myTasks.filter(t => t.status === 'done');
  const myProgress = progressLogs.filter(p => p.userId && (p.userId._id === currentUser.id || p.userId._id?.toString() === currentUser.id));
  const totalHours = myProgress.reduce((sum, p) => sum + (p.hoursWorked || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden bg-gradient-to-r from-purple-500/10 via-indigo-500/15 to-cyan-500/10 border border-purple-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="w-32 h-32 text-purple-400" />
        </div>
        <div className="flex items-center space-x-4">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/50" />
          <div>
            <h2 className="text-2xl font-extrabold gradient-text">{currentUser.name}'s Personal Report</h2>
            <p className="text-sm text-slate-300 capitalize">{currentUser.designation} • Role: {currentUser.role}</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Assigned Tasks</span>
            <Briefcase className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100">{myTasks.length}</div>
          <p className="text-xs text-indigo-300 mt-1">Active in current sprint</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Completed Tasks</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100">{completedMyTasks.length}</div>
          <p className="text-xs text-emerald-300 mt-1">Great execution</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Total Hours Logged</span>
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100">{totalHours} hrs</div>
          <p className="text-xs text-amber-300 mt-1">Recorded via Daily Standup</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Efficiency Rating</span>
            <Award className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100">98%</div>
          <p className="text-xs text-purple-300 mt-1">Optimal performance</p>
        </div>
      </div>

      {/* Assigned Tasks List */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-slate-100 mb-4">My Assigned Tasks</h3>
        <div className="space-y-3">
          {myTasks.length > 0 ? (
            myTasks.map(task => (
              <div key={task._id} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">{task.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full capitalize">
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No tasks currently assigned to you.</p>
          )}
        </div>
      </div>
    </div>
  );
}
