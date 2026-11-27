export default function MetricCard({ title, value, detail, icon, iconTone = 'blue' }) {
  const iconStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100'
  };

  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden bg-white hover:border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-[#475569]">{title}</span>
        <div className={`p-2.5 rounded-xl border ${iconStyles[iconTone] || iconStyles.blue}`}>{icon}</div>
      </div>
      <div className="text-3xl font-extrabold text-[#0F172A] mb-1 tracking-tight">{value}</div>
      <div className="text-xs text-[#475569] font-medium">{detail}</div>
    </div>
  );
}
