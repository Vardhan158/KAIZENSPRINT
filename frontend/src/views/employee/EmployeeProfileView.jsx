import { useEffect, useRef, useState } from 'react';
import { Camera, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import toast from '../../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

export default function EmployeeProfileView({ currentUser, token, fetchAllData }) {
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({ name: currentUser?.name || '', mobileNumber: currentUser?.mobileNumber || '' });
  const [preview, setPreview] = useState(currentUser?.avatar || '');
  const [photo, setPhoto] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [profileUser, setProfileUser] = useState(currentUser || {});

  useEffect(() => {
    let cancelled = false;
    if (!token) return undefined;
    fetch(`${API_BASE}/users/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Failed to load profile')))
      .then(data => {
        if (cancelled) return;
        setProfileUser(data);
        setProfile({ name: data.name || '', mobileNumber: data.mobileNumber || '' });
        setPreview(data.avatar || '');
      })
      .catch(error => toast.error(error.message));
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    setProfileUser(currentUser || {});
    setProfile({ name: currentUser?.name || '', mobileNumber: currentUser?.mobileNumber || '' });
    setPreview(currentUser?.avatar || '');
  }, [currentUser]);

  const choosePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.warning('Please choose a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image size must be less than 5 MB.');
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const body = new FormData();
      body.append('name', profile.name);
      body.append('mobileNumber', profile.mobileNumber);
      if (photo) body.append('profilePhoto', photo);
      const response = await fetch(`${API_BASE}/users/profile`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update profile details.');
      setPhoto(null);
      setPreview(data.avatar || preview);
      setProfileUser(value => ({ ...value, ...data }));
      localStorage.setItem('jira_user', JSON.stringify({ ...profileUser, ...data }));
      toast.success('Profile details updated successfully!');
      fetchAllData();
    } catch (error) { toast.error(error.message || 'Profile update failed.'); }
    finally { setSavingProfile(false); }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (password.newPassword !== password.confirmPassword) return toast.warning('New passwords do not match.');
    try {
      const response = await fetch(`${API_BASE}/users/change-password`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword: password.currentPassword, newPassword: password.newPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change password.');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Account password updated successfully!');
    } catch (error) { toast.error(error.message || 'Failed to change password.'); }
  };

  const passwordField = (key, label, field) => <div><label className={labelClass}>{label}</label><div className="relative"><input type={visible[key] ? 'text' : 'password'} required value={password[field]} onChange={e => setPassword({ ...password, [field]: e.target.value })} className={`${inputClass} pr-11`} /><button type="button" onClick={() => setVisible({ ...visible, [key]: !visible[key] })} aria-label={`${visible[key] ? 'Hide' : 'Show'} ${label.toLowerCase()}`} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#2563EB]">{visible[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>;

  return <div className="space-y-6 font-sans"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
    <section className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm flex flex-col"><div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6"><UserRound className="w-5 h-5 text-[#2563EB]" /><h3 className="text-lg font-bold text-[#0F172A]">My Profile</h3></div><form onSubmit={saveProfile} className="space-y-4 text-xs flex-1">
      <div className="flex items-center gap-5"><div className="relative h-20 w-20 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">{preview ? <img src={preview} alt="Profile preview" onError={() => setPreview('')} className="h-full w-full object-cover" /> : <UserRound className="h-8 w-8 text-slate-400" />}<button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Upload profile photo" className="absolute bottom-0 right-0 rounded-full bg-[#2563EB] p-1.5 text-white shadow"><Camera className="h-3.5 w-3.5" /></button></div><div><p className="font-semibold text-[#0F172A]">Profile photo</p><p className="text-slate-500 mt-1">JPEG, PNG or WebP up to 5 MB.</p><button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 text-xs font-semibold text-[#2563EB] hover:underline">Choose photo</button><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} className="hidden" /></div></div>
      <div><label className={labelClass}>Full Name</label><input type="text" required value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className={inputClass} /></div><div><label className={labelClass}>Mobile Number</label><input type="text" value={profile.mobileNumber} onChange={e => setProfile({ ...profile, mobileNumber: e.target.value })} className={inputClass} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><ReadOnly label="Employee ID" value={profileUser.employeeId || '—'} /><ReadOnly label="Email" value={profileUser.email || '—'} /><ReadOnly label="Role" value={profileUser.role || '—'} /></div><button type="submit" disabled={savingProfile} className="mt-2 rounded-xl bg-[#2563EB] hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 text-xs font-semibold shadow-sm">{savingProfile ? 'Uploading Photo…' : 'Save Profile Changes'}</button>
    </form></section>
    <section className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm flex flex-col"><div className="flex items-center gap-3 border-b border-slate-200 pb-4 mb-6"><LockKeyhole className="w-5 h-5 text-emerald-600" /><h3 className="text-lg font-bold text-[#0F172A]">Change Account Password</h3></div><form onSubmit={savePassword} className="space-y-4 text-xs flex-1">{passwordField('current', 'Current Password', 'currentPassword')}{passwordField('next', 'New Password', 'newPassword')}{passwordField('confirm', 'Confirm New Password', 'confirmPassword')}<button type="submit" className="mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-semibold shadow-sm">Update Password</button></form></section>
  </div></div>;
}

function ReadOnly({ label, value }) { return <div><label className={labelClass}>{label}</label><div className="min-h-[46px] rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 break-words">{value}</div></div>; }
