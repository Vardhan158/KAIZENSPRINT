import { CheckCircle2, AlertTriangle, CheckSquare, Clock } from 'lucide-react';

export default function CompleteSprintModal({ sprint, tasks = [], loading = false, onConfirm, onClose }) {
  const completedTasks = tasks.filter(t => t.status === 'done');
  const pendingTasks = tasks.filter(t => t.status !== 'done');
  const completedPoints = completedTasks.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);
  const totalPoints = tasks.reduce((sum, t) => sum + (Number(t.storyPoints) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-start space-x-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-[#0F172A] tracking-tight">Complete Sprint: {sprint?.name}</h3>
            <p className="text-xs text-[#475569]">Review sprint achievements before final closure.</p>
          </div>
        </div>

        {/* Summary Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <span className="text-[10px] font-bold text-[#475569] uppercase block">Completed Tasks</span>
            <span className="mt-1 text-2xl font-extrabold text-emerald-600">{completedTasks.length} / {tasks.length}</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <span className="text-[10px] font-bold text-[#475569] uppercase block">Completed Pts</span>
            <span className="mt-1 text-2xl font-extrabold text-[#2563EB]">{completedPoints} / {totalPoints}</span>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <span className="text-[10px] font-bold text-[#475569] uppercase block">Pending Tasks</span>
            <span className="mt-1 text-2xl font-extrabold text-amber-600">{pendingTasks.length}</span>
          </div>
        </div>

        {/* Immutability Warning */}
        <div className="flex items-center space-x-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-semibold text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Once completed, this sprint becomes immutable and tasks can no longer be modified or reactivated.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-60 flex items-center space-x-1.5"
          >
            <span>{loading ? 'Finalizing Sprint…' : 'Confirm & Complete Sprint'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
