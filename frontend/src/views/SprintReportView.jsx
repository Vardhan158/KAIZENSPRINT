import React, { useState } from 'react';
import { Award, CheckCircle, TrendingUp, AlertCircle, MessageSquare, Sparkles } from 'lucide-react';

export default function SprintReportView({ tasks, bugs, sprints }) {
  const [retroNotes, setRetroNotes] = useState([
    { id: 1, type: 'went_well', text: 'Cinematic glassmorphism UI implemented successfully across all modules.' },
    { id: 2, type: 'to_improve', text: 'Faster QA turnaround on critical bug triage.' },
    { id: 3, type: 'action_item', text: 'Automate weekly workload balance alerts.' }
  ]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('went_well');

  const completedTasks = tasks.filter(t => t.status === 'done');
  const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 3), 0);
  const completedStoryPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 3), 0);
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const handleAddRetro = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setRetroNotes([...retroNotes, { id: Date.now(), type: noteType, text: newNote }]);
    setNewNote('');
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl relative overflow-hidden bg-gradient-to-r from-indigo-500/10 via-purple-500/15 to-pink-500/10 border border-indigo-500/30">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="w-32 h-32 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-extrabold gradient-text mb-2">Sprint Report & Retrospective</h2>
        <p className="text-sm text-slate-300">
          Comprehensive analysis of Sprint 1 (Core KaizenSprint Engine) following the 11-step Agile workflow.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Sprint Velocity</span>
            <TrendingUp className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100">{completedStoryPoints} pts</div>
          <p className="text-xs text-indigo-300 mt-1">Out of {totalStoryPoints} committed</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Completion Rate</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100">{completionRate}%</div>
          <p className="text-xs text-emerald-300 mt-1">{completedTasks.length} of {tasks.length} tasks completed</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Bugs Resolved</span>
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-slate-100">{bugs.filter(b => b.status === 'resolved' || b.status === 'closed').length} / {bugs.length}</div>
          <p className="text-xs text-amber-300 mt-1">QA Verification Pass</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Workflow Status</span>
            <Award className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-300 mt-1">Step 11: Complete</div>
          <p className="text-xs text-slate-400 mt-1">Ready for Sprint 2 planning</p>
        </div>
      </div>

      {/* Retrospective Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span>Team Retrospective Board</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* What Went Well */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-emerald-500/20 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">What Went Well</h4>
              <div className="space-y-2">
                {retroNotes.filter(n => n.type === 'went_well').map(note => (
                  <div key={note.id} className="bg-slate-800/80 p-3 rounded-lg text-xs text-slate-200 border border-slate-700">
                    {note.text}
                  </div>
                ))}
              </div>
            </div>

            {/* What Needs Improvement */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-amber-500/20 space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">To Improve</h4>
              <div className="space-y-2">
                {retroNotes.filter(n => n.type === 'to_improve').map(note => (
                  <div key={note.id} className="bg-slate-800/80 p-3 rounded-lg text-xs text-slate-200 border border-slate-700">
                    {note.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-indigo-500/20 space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Action Items</h4>
              <div className="space-y-2">
                {retroNotes.filter(n => n.type === 'action_item').map(note => (
                  <div key={note.id} className="bg-slate-800/80 p-3 rounded-lg text-xs text-slate-200 border border-slate-700">
                    {note.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add Retrospective Note */}
        <div className="glass-card p-6 rounded-2xl h-fit">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Add Retro Feedback</h3>
          <form onSubmit={handleAddRetro} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase mb-1">Feedback Type</label>
              <select
                value={noteType}
                onChange={e => setNoteType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="went_well">What Went Well</option>
                <option value="to_improve">To Improve</option>
                <option value="action_item">Action Item</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 uppercase mb-1">Note Description</label>
              <textarea
                rows="3"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="Enter feedback or action item..."
                required
              ></textarea>
            </div>
            <button type="submit" className="w-full gradient-btn text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/25">
              Add to Retrospective
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
