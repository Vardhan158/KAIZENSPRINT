import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

export default function ConfirmModal({
  isOpen = true,
  title = 'Confirm Action',
  itemName = '',
  message = 'Are you sure you want to proceed with this action?',
  warning = 'This action cannot be undone and will update workspace status.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
  onConfirm,
  onClose
}) {
  if (!isOpen) return null;

  const isDanger = confirmVariant === 'danger';
  const buttonStyle = isDanger
    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20'
    : 'bg-[#2563EB] hover:bg-indigo-700 text-white shadow-sm shadow-blue-600/20';

  const iconContainerStyle = isDanger
    ? 'bg-rose-50 text-rose-600 border border-rose-200'
    : 'bg-amber-50 text-amber-600 border border-amber-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-start space-x-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconContainerStyle}`}>
            {isDanger ? <ShieldAlert className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </span>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-[#0F172A] tracking-tight">{title}</h3>
            {itemName && (
              <p className="text-sm font-bold text-[#2563EB]">{itemName}</p>
            )}
            <p className="text-xs text-[#475569] leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Warning Box */}
        {warning && (
          <div className="flex items-center space-x-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs font-semibold text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>{warning}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-xl px-5 py-2.5 text-xs font-semibold transition cursor-pointer disabled:opacity-60 flex items-center space-x-1.5 ${buttonStyle}`}
          >
            <span>{loading ? 'Processing…' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
