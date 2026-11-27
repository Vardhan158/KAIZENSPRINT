import { useState } from 'react';
import { ImagePlus, ShieldCheck, UserPlus, Eye, EyeOff } from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';
const mobilePattern = /^\+?[1-9]\d{7,14}$/;

const readPayload = async response => {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
};

export default function CreateUserModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    mobileNumber: '',
    designation: 'Software Engineer',
    workingHoursPerDay: '8',
    role: 'employee',
    accountStatus: 'Active'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));

  const validate = () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.designation.trim()) {
      return 'Complete all required fields (Name, Email, Password, Designation).';
    }
    if (form.password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    const mobile = form.mobileNumber.replace(/[\s()-]/g, '');
    if (mobile && !mobilePattern.test(mobile)) {
      return 'Enter a valid mobile number with 8 to 15 digits.';
    }
    const hours = Number(form.workingHoursPerDay);
    if (!Number.isFinite(hours) || hours < 1 || hours > 24) {
      return 'Working hours must be between 1 and 24.';
    }

    if (!photo) {
      return 'Profile photo is required. Please upload a JPEG, PNG or WebP image.';
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) {
      return 'Profile photo must be a JPEG, PNG or WebP image.';
    }
    if (photo.size > 5 * 1024 * 1024) {
      return 'Profile photo must be 5 MB or smaller.';
    }

    return '';
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);
    setSubmitting(true);
    setError('');
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, value));
      if (photo) body.append('profilePhoto', photo);

      const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body
      });
      const payload = await readPayload(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to create employee.');
      toast.success('Employee account created successfully!');
      await onCreated();
      onClose();
    } catch (requestError) {
      setError(requestError.message);
      toast.error(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white">
            <UserPlus className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-xl font-bold text-[#0F172A]">Add Employee</h3>
            <p className="text-xs text-[#475569]">Set direct login credentials for immediate employee sign-in access.</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className={labelClass}>Full Name *</span>
              <input
                required
                value={form.name}
                onChange={e => update('name', e.target.value)}
                className={inputClass}
                placeholder="e.g. Sarah Connor"
              />
            </label>
            <label>
              <span className={labelClass}>Email Address *</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                className={inputClass}
                placeholder="sarah@kaizensprint.com"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="relative">
              <span className={labelClass}>Password * (For Direct Login)</span>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  className={inputClass}
                  placeholder="Set initial password (min 6 chars)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
            <label>
              <span className={labelClass}>Designation *</span>
              <input
                required
                value={form.designation}
                onChange={e => update('designation', e.target.value)}
                className={inputClass}
                placeholder="e.g. Senior Frontend Dev"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className={labelClass}>Mobile Number</span>
              <input
                type="tel"
                value={form.mobileNumber}
                onChange={e => update('mobileNumber', e.target.value)}
                className={inputClass}
                placeholder="+15550192834"
              />
            </label>
            <label>
              <span className={labelClass}>Working Hours / Day *</span>
              <input
                required
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={form.workingHoursPerDay}
                onChange={e => update('workingHoursPerDay', e.target.value)}
                className={inputClass}
              />
            </label>
            <label>
              <span className={labelClass}>Account Status</span>
              <select
                value={form.accountStatus}
                onChange={e => update('accountStatus', e.target.value)}
                className={inputClass}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className={labelClass}>Profile Photo * (Mandatory Cloudinary Upload)</span>
            <span className={`flex cursor-pointer items-center gap-3 rounded-xl border border-dashed p-4 text-sm ${photo ? 'border-emerald-400 bg-emerald-50/50 text-emerald-800' : 'border-indigo-300 bg-indigo-50/50 text-[#475569] hover:bg-indigo-50'}`}>
              <ImagePlus className={`h-5 w-5 ${photo ? 'text-emerald-600' : 'text-indigo-600'}`} />
              <span>{photo ? photo.name : 'Choose a JPEG, PNG or WebP profile photo (max 5 MB)'}</span>
              <input
                required
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => setPhoto(e.target.files?.[0] || null)}
              />
            </span>
          </label>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#475569] hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              {submitting ? 'Creating Employee…' : 'Create Employee Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
