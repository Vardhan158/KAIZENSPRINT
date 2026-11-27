export default function EmployeeProjectsView({ currentUser, projects = [] }) {
  const myProjects = projects.filter(p => {
    if (!p.members) return false;
    return p.members.some(m => (m._id === currentUser.id || m === currentUser.id)) || (p.lead && (p.lead._id === currentUser.id || p.lead === currentUser.id));
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm">
        <h2 className="text-2xl font-extrabold text-[#0F172A]">My Assigned Projects ({myProjects.length})</h2>
        <p className="text-xs text-[#475569] mt-1">Projects where you are listed as an active team member or technical lead.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {myProjects.length > 0 ? (
          myProjects.map(proj => (
            <div key={proj._id} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
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
          <div className="p-12 text-center text-xs text-[#475569] md:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">No projects assigned currently.</div>
        )}
      </div>
    </div>
  );
}
