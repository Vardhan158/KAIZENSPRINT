import { useId, useLayoutEffect, useRef, useState } from 'react';
import TaskDetailDrawer from '../modals/TaskDetailDrawer';

const dayLength = 86_400_000;
const weekWidth = 136;
const dayWidth = weekWidth / 7;
const dateLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const recordId = value => String(value?._id ?? value ?? '');
const isDone = task => task.status === 'done';

function calendarDay(value) {
  if (!value) return null;
  const date = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const time = Date.parse(date);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date
    ? time / dayLength
    : null;
}

function dateRange(start, end) {
  if (start == null || end == null || end < start) return null;
  return { start, end };
}

function completion(tasks) {
  const done = tasks.filter(isDone).length;
  return { done, total: tasks.length, percent: tasks.length ? Math.round(100 * done / tasks.length) : 0 };
}

function makeRows(projects, sprints, tasks) {
  function taskRow(task, sprintStart) {
    const end = calendarDay(task.dueDate);
    const inferredStart = sprintStart != null && end != null && sprintStart <= end ? sprintStart : end;
    const start = calendarDay(task.startDate) ?? inferredStart;
    return {
      id: task._id,
      kind: 'task',
      name: task.title,
      code: task.taskId,
      status: (task.status || 'todo').replaceAll('_', ' '),
      range: dateRange(start, end),
      dependency: String(task.dependencies ?? '').trim(),
      done: isDone(task),
    };
  }

  return projects.flatMap(project => {
    const projectSprints = sprints.filter(sprint => recordId(sprint.projectId) === recordId(project));
    const projectTasks = tasks.filter(task => recordId(task.projectId) === recordId(project));
    const sprintIds = new Set(projectSprints.map(recordId));
    const projectRow = {
      id: project._id,
      kind: 'project',
      name: project.name,
      code: project.key,
      status: project.status,
      range: dateRange(calendarDay(project.startDate), calendarDay(project.endDate)),
      progress: completion(projectTasks),
    };
    return [
      projectRow,
      ...projectSprints.flatMap(sprint => {
        const sprintTasks = projectTasks.filter(task => recordId(task.sprintId) === recordId(sprint));
        const start = calendarDay(sprint.startDate);
        return [
          {
            id: sprint._id,
            kind: 'sprint',
            name: sprint.name,
            code: sprint.sprintId,
            status: sprint.status,
            range: dateRange(start, calendarDay(sprint.endDate)),
            progress: completion(sprintTasks),
          },
          ...sprintTasks.map(task => taskRow(task, start)),
        ];
      }),
      ...projectTasks.filter(task => !sprintIds.has(recordId(task.sprintId))).map(task => taskRow(task, null)),
    ];
  });
}

function DependencyLines({ rows, firstDay, width }) {
  const markerId = useId();
  const overlay = useRef(null);
  const [layout, setLayout] = useState({ height: 0, centers: new Map() });

  useLayoutEffect(() => {
    const body = overlay.current.parentElement;
    const elements = Array.from(body.querySelectorAll('[data-timeline-row]'));
    function measure() {
      setLayout({
        height: body.clientHeight,
        centers: new Map(elements.map(element => [
          element.dataset.timelineRow,
          element.offsetTop + element.offsetHeight / 2,
        ])),
      });
    }
    measure();
    const observer = new ResizeObserver(measure);
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [rows]);

  const tasksByKey = new Map();
  rows.filter(row => row.kind === 'task').forEach(row => {
    tasksByKey.set(row.id, row);
    if (row.code) tasksByKey.set(row.code.toUpperCase(), row);
  });

  return (
    <svg ref={overlay} className="pointer-events-none absolute top-0 right-0 z-10 text-indigo-500"
      width={width} height={layout.height} aria-hidden="true">
      <defs>
        <marker id={markerId} markerWidth="7" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0 0 L7 4 L0 8 Z" fill="currentColor" />
        </marker>
      </defs>
      {rows.map(target => {
        if (!target.dependency || !target.range) return null;
        const source = tasksByKey.get(target.dependency) ?? tasksByKey.get(target.dependency.toUpperCase());
        if (!source?.range || source.id === target.id) return null;
        const fromY = layout.centers.get(source.id);
        const toY = layout.centers.get(target.id);
        if (fromY == null || toY == null) return null;
        const fromX = (source.range.end - firstDay + 1) * dayWidth - 2;
        const toX = Math.max(10, (target.range.start - firstDay) * dayWidth + 2);
        const bend = Math.min(width - 4, fromX + 10);
        const approach = Math.max(1, toX - 9);
        const betweenY = toY + Math.sign(fromY - toY) * 15;
        const path = toX - fromX > 20
          ? `M${fromX},${fromY} H${(fromX + toX) / 2} V${toY} H${toX}`
          : `M${fromX},${fromY} H${bend} V${betweenY} H${approach} V${toY} H${toX}`;
        return <path key={target.id} data-dependency={`${source.code} → ${target.code}`}
          d={path} fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd={`url(#${markerId})`} />;
      })}
    </svg>
  );
}

export default function SprintTimelineView({ tasks = [], sprints = [], projects = [], token, fetchAllData }) {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const rows = makeRows(projects, sprints, tasks);
  const ranges = rows.flatMap(row => row.range ? [row.range] : []);
  const [today] = useState(() => Math.floor(Date.now() / dayLength));
  const firstDay = ranges.reduce((min, range) => Math.min(min, range.start), ranges[0]?.start ?? today);
  const lastDay = ranges.reduce((max, range) => Math.max(max, range.end), firstDay);
  const weeks = Math.ceil((lastDay - firstDay + 1) / 7);
  const width = weeks * weekWidth;

  return (
    <section className="space-y-5 font-sans">
      <div>
        <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">Sprint Timeline &amp; Gantt Roadmap</h2>
        <p className="mt-1 text-sm text-[#475569] font-normal">Progress shows completed tasks. Arrows point from prerequisite to dependent task.</p>
      </div>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-[#475569] font-normal">No projects found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
          tabIndex={0} role="region" aria-label="Scrollable Gantt timeline">
          <div className="w-max" style={{ '--timeline-label-width': 'clamp(10rem, 30vw, 21rem)' }}>
            <div className="flex border-b border-slate-200 bg-slate-100">
              <div className="sticky left-0 z-20 flex w-(--timeline-label-width) shrink-0 items-center border-r border-slate-200 bg-slate-100 px-4 text-sm font-bold text-[#0F172A]">
                Project / sprint / task
              </div>
              {Array.from({ length: weeks }, (_, index) => {
                const start = firstDay + index * 7;
                const end = start + 6;
                return (
                  <div key={start} className="shrink-0 border-r border-slate-200 py-2 text-center text-xs font-semibold whitespace-nowrap text-[#475569]" style={{ width: weekWidth }}>
                    {dateLabel.format(start * dayLength)} – {dateLabel.format(end * dayLength)}
                    <div className="mt-0.5 font-normal text-slate-500 text-[11px]">
                      {[...new Set([start, end].map(day => new Date(day * dayLength).getUTCFullYear()))].join(' – ')}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="relative">
              {rows.map(row => {
                const labelBackground = row.kind === 'project' ? 'bg-slate-100' : row.kind === 'sprint' ? 'bg-indigo-50' : 'bg-white';
                const label = (
                  <>
                    <span className="block [overflow-wrap:anywhere] text-sm font-semibold text-[#0F172A]">{row.name}</span>
                    <span className="mt-1 flex flex-wrap gap-x-2 text-xs text-[#475569]">
                      {row.code && <span className="text-indigo-700 font-bold">{row.code}</span>}
                      {row.status && <span className="capitalize font-medium">{row.status}</span>}
                      {row.progress && <span className="font-medium">{row.progress.done}/{row.progress.total} done · {row.progress.percent}%</span>}
                    </span>
                    {row.dependency && <span className="mt-1 block [overflow-wrap:anywhere] text-xs text-indigo-700 font-medium">Depends on {row.dependency}</span>}
                  </>
                );
                return (
                  <div key={row.id} data-timeline-row={row.id} className="flex min-h-14 border-b border-slate-200 last:border-b-0">
                    <div className={`sticky left-0 z-20 flex w-(--timeline-label-width) shrink-0 items-center border-r border-slate-200 ${labelBackground}`}>
                      {row.kind === 'task' ? (
                        <button type="button" className="w-full py-2 pr-3 pl-8 text-left hover:bg-slate-50 focus-visible:outline-indigo-600 cursor-pointer"
                          onClick={() => setSelectedTaskId(row.id)}>{label}</button>
                      ) : <div className={`w-full py-2 pr-3 ${row.kind === 'sprint' ? 'pl-6' : 'pl-4'}`}>{label}</div>}
                    </div>
                    <div className={`relative flex shrink-0 items-center ${labelBackground}`}
                      style={{
                        width,
                        backgroundImage: 'linear-gradient(to right, transparent calc(100% - 1px), #e2e8f0 calc(100% - 1px))',
                        backgroundSize: `${weekWidth}px 100%`,
                      }}>
                      {row.range ? (
                        <div className={`absolute h-4 rounded-sm border ${row.kind === 'project' ? 'border-slate-400 bg-slate-300' : row.kind === 'sprint' ? 'border-indigo-400 bg-indigo-200' : row.done ? 'border-emerald-700 bg-emerald-600' : 'border-blue-600 bg-blue-500'}`}
                          data-timeline-bar={row.code}
                          title={`${row.name} · ${new Date(row.range.start * dayLength).toISOString().slice(0, 10)} to ${new Date(row.range.end * dayLength).toISOString().slice(0, 10)}`}
                          style={{ left: (row.range.start - firstDay) * dayWidth, width: (row.range.end - row.range.start + 1) * dayWidth }}>
                          {row.progress && <div className={`h-full rounded-sm ${row.kind === 'project' ? 'bg-slate-600' : 'bg-indigo-600'}`} style={{ width: `${row.progress.percent}%` }} />}
                        </div>
                      ) : <span className="pl-3 text-xs text-slate-500 font-normal">No valid date range</span>}
                    </div>
                  </div>
                );
              })}
              <DependencyLines rows={rows} firstDay={firstDay} width={width} />
            </div>
          </div>
        </div>
      )}
      {selectedTaskId && (
        <TaskDetailDrawer taskId={selectedTaskId} token={token}
          onClose={() => setSelectedTaskId(null)} fetchAllData={fetchAllData} />
      )}
    </section>
  );
}
