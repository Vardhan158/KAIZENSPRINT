import { useEffect, useState } from 'react';
import { Bell, Briefcase, CheckCheck, CheckCircle2, AlertTriangle, MessageSquare, ShieldAlert, Sparkles, UserPlus, Zap } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function NotificationDropdown({ currentUser, token }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState('loading');

  const fetchNotifications = async () => {
    setState('loading');
    try {
      const response = await fetch(`${API_BASE}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Notification request failed');
      setNotifications(await response.json());
      setState('ready');
    } catch {
      setState('error');
    }
  };

  useEffect(() => {
    if (!token || !currentUser) return undefined;
    let active = true;
    fetch(`${API_BASE}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => {
        if (!response.ok) throw new Error('Notification request failed');
        return response.json();
      })
      .then(payload => {
        if (active) {
          setNotifications(payload);
          setState('ready');
        }
      })
      .catch(() => {
        if (active) setState('error');
      });
    const socket = io(SOCKET_URL, { auth: { token } });
    socket.on(`notification_${currentUser.id}`, notification => setNotifications(previous => [notification, ...previous]));
    socket.on('notification_broadcast', notification => {
      if (notification.userId === currentUser.id) {
        setNotifications(previous => [notification, ...previous.filter(item => item._id !== notification._id)]);
      }
    });
    return () => {
      active = false;
      socket.disconnect();
    };
  }, [token, currentUser]);

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Mark-read request failed');
      setNotifications(previous => previous.map(notification => ({ ...notification, read: true })));
    } catch {
      setState('error');
    }
  };

  const unreadCount = notifications.filter(notification => !notification.read).length;
  const eventIcon = type => {
    if (type === 'account_created') return <UserPlus className="w-4 h-4 text-emerald-600" />;
    if (type === 'project_assigned') return <Briefcase className="w-4 h-4 text-indigo-600" />;
    if (type === 'sprint_started') return <Zap className="w-4 h-4 text-amber-600" />;
    if (type === 'task_approved') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (type === 'changes_requested') return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    if (type === 'bug_reported' || type === 'blocker_reported') return <ShieldAlert className="w-4 h-4 text-rose-600" />;
    if (type === 'mention') return <MessageSquare className="w-4 h-4 text-sky-600" />;
    return <Bell className="w-4 h-4 text-[#2563EB]" />;
  };

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(open => !open)} className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors" title="Notifications">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-extrabold min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white">{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="text-xs font-bold text-[#0F172A]">Notifications</h3>
            {unreadCount > 0 && <button type="button" onClick={markAllAsRead} className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 font-semibold"><CheckCheck className="w-3.5 h-3.5" />Mark read</button>}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {state === 'loading' && <div className="p-8 text-center text-xs text-[#475569]">Loading notifications…</div>}
            {state === 'error' && <div className="p-8 text-center text-xs text-rose-600"><p>Notifications are unavailable.</p><button type="button" onClick={fetchNotifications} className="mt-2 font-semibold text-[#2563EB]">Try again</button></div>}
            {state === 'ready' && notifications.length === 0 && <div className="p-8 text-center text-xs text-[#475569] space-y-2"><Sparkles className="w-6 h-6 mx-auto text-blue-300" /><p>No notifications right now.</p></div>}
            {state === 'ready' && notifications.map(notification => (
              <div key={notification._id} className={`p-4 flex gap-3 ${notification.read ? 'bg-white' : 'bg-blue-50/50'}`}>
                <div className="pt-0.5 shrink-0">{eventIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-3"><span className="text-xs font-bold text-[#0F172A] truncate">{notification.title}</span><span className="text-[10px] text-[#64748B] shrink-0">{new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                  <p className="text-xs text-[#475569] leading-relaxed mt-1">{notification.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
