import { useState, useEffect } from 'react';
import {
  Building2, Clock, Lock, Sliders, Check, RefreshCw
} from 'lucide-react';
import toast from '../utils/toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const labelClass = 'block text-xs font-semibold text-[#475569] uppercase tracking-wide mb-1.5';
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-4 focus:ring-blue-100';

const allWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdministrationSettingsView({ currentUser, token, users = [] }) {
  const [activeSubTab, setActiveSubTab] = useState('org_profile');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSettings(await res.json());
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettingsSection = async (section, updatedPayload) => {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/settings/${section}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedPayload)
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        toast.success(`Section "${section.replace('_', ' ')}" updated successfully!`);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Logo image file must be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target.result;
      setSettings(prev => ({
        ...prev,
        orgProfile: { ...prev.orgProfile, logoUrl: base64Url }
      }));
      toast.success('Company logo uploaded and preview updated!');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOrgProfile = async () => {
    if (!settings.orgProfile.name?.trim() || !settings.orgProfile.contactEmail?.trim()) {
      toast.warning('Organization Name and Contact Email are required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.orgProfile.contactEmail.trim())) {
      toast.warning('Please enter a valid official contact email address.');
      return;
    }
    await saveSettingsSection('orgProfile', settings.orgProfile);
  };

  const handleSaveWorkingDays = async () => {
    const workDays = settings.workingDays?.workDays || [];
    const standardHours = Number(settings.workingDays?.standardHoursPerDay) || 8;
    const overtime = Number(settings.workingDays?.overtimeThresholdHours) || 40;

    if (workDays.length === 0) {
      toast.warning('At least one working day must be selected.');
      return;
    }
    if (standardHours < 4 || standardHours > 12) {
      toast.warning('Standard hours per day must be between 4 and 12 hours.');
      return;
    }
    if (overtime < 35 || overtime > 60) {
      toast.warning('Overtime threshold must be between 35 and 60 hours per week.');
      return;
    }

    await saveSettingsSection('workingDays', settings.workingDays);
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin" />
          <p className="text-sm text-[#475569]">Loading Administration & Settings Configuration...</p>
        </div>
      </div>
    );
  }

  const selectedWorkDays = settings.workingDays?.workDays || [];
  const stdHoursPerDay = Number(settings.workingDays?.standardHoursPerDay) || 8;
  const calculatedWeeklyCapacity = selectedWorkDays.length * stdHoursPerDay;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Top Banner Header */}
      <div className="rounded-2xl p-6 border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-[#0F172A] flex items-center space-x-2">
              <span>Administration & Settings Hub</span>
              <span className="text-xs bg-blue-50 text-[#2563EB] border border-blue-200 px-3 py-0.5 rounded-full uppercase tracking-wider font-bold">
                Module 15
              </span>
            </h2>
            <p className="text-xs text-[#475569] mt-1">
              Organization profile, working hours and security controls.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Navigation Tabs (Exactly 3 Equally Sized Tabs in a Single Row) */}
      <div className="rounded-2xl p-3 grid grid-cols-3 gap-3 border border-slate-200 bg-white shadow-sm">
        <SubTabBtn id="org_profile" label="Org Profile" icon={<Building2 className="w-4 h-4" />} activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
        <SubTabBtn id="working_days" label="Work Days & Hours" icon={<Clock className="w-4 h-4" />} activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
        <SubTabBtn id="security" label="Account Security" icon={<Lock className="w-4 h-4" />} activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab} />
      </div>

      {/* SUB-SECTION 1: ORGANIZATION PROFILE */}
      {activeSubTab === 'org_profile' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#2563EB]" />
                <span>Organization Profile Master</span>
              </h3>
              <p className="text-xs text-[#475569]">Configure core organization identity, currency, timezone and contact information.</p>
            </div>
            <button
              type="button"
              onClick={handleSaveOrgProfile}
              disabled={saving}
              className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm flex items-center space-x-2 transition cursor-pointer disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label>
                <span className={labelClass}>Organization Legal Name *</span>
                <input
                  type="text"
                  required
                  value={settings.orgProfile.name}
                  onChange={(e) => setSettings({ ...settings, orgProfile: { ...settings.orgProfile, name: e.target.value } })}
                  className={inputClass}
                />
              </label>
            </div>

            <div>
              <label>
                <span className={labelClass}>Official Contact Email *</span>
                <input
                  type="email"
                  required
                  value={settings.orgProfile.contactEmail}
                  onChange={(e) => setSettings({ ...settings, orgProfile: { ...settings.orgProfile, contactEmail: e.target.value } })}
                  className={inputClass}
                />
              </label>
            </div>

            <div>
              <label>
                <span className={labelClass}>Default System Timezone *</span>
                <select
                  value={settings.orgProfile.timezone}
                  onChange={(e) => setSettings({ ...settings, orgProfile: { ...settings.orgProfile, timezone: e.target.value } })}
                  className={inputClass}
                >
                  <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (Pacific Time)</option>
                  <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (Eastern Time)</option>
                  <option value="UTC+00:00 (London GMT)">UTC+00:00 (London GMT)</option>
                  <option value="UTC+05:30 (India Standard Time IST)">UTC+05:30 (India Standard Time IST)</option>
                  <option value="UTC+09:00 (Tokyo JST)">UTC+09:00 (Tokyo JST)</option>
                </select>
              </label>
            </div>

            <div>
              <label>
                <span className={labelClass}>Default Organization Currency *</span>
                <select
                  value={settings.orgProfile.currency}
                  onChange={(e) => setSettings({ ...settings, orgProfile: { ...settings.orgProfile, currency: e.target.value } })}
                  className={inputClass}
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                  <option value="GBP (£)">GBP (£)</option>
                  <option value="INR (₹)">INR (₹)</option>
                  <option value="CAD ($)">CAD ($)</option>
                </select>
              </label>
            </div>

            <div className="md:col-span-2">
              <label>
                <span className={labelClass}>Company Logo (Upload File or Image URL with Live Preview)</span>
                <div className="flex items-center space-x-4">
                  <img
                    src={settings.orgProfile.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'}
                    alt="Company Logo Preview"
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-blue-500/30 border border-slate-200 shrink-0"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'; }}
                  />
                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="text-xs text-[#475569] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#2563EB] hover:file:bg-blue-100 cursor-pointer"
                    />
                    <input
                      type="url"
                      value={settings.orgProfile.logoUrl}
                      onChange={(e) => setSettings({ ...settings, orgProfile: { ...settings.orgProfile, logoUrl: e.target.value } })}
                      className={`flex-1 ${inputClass}`}
                      placeholder="Or paste image URL..."
                    />
                  </div>
                </div>
              </label>
            </div>

            <div className="md:col-span-2">
              <label>
                <span className={labelClass}>Headquarters Address</span>
                <textarea
                  rows={2}
                  value={settings.orgProfile.address}
                  onChange={(e) => setSettings({ ...settings, orgProfile: { ...settings.orgProfile, address: e.target.value } })}
                  className={`w-full resize-none ${inputClass}`}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: WORKING DAYS & HOURS */}
      {activeSubTab === 'working_days' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
                <Clock className="w-5 h-5 text-[#2563EB]" />
                <span>Work Days & Standard Operating Hours</span>
              </h3>
              <p className="text-xs text-[#475569]">Configure Monday–Sunday working days, daily hours, and dynamic weekly capacity.</p>
            </div>
            <button
              type="button"
              onClick={handleSaveWorkingDays}
              disabled={saving}
              className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm flex items-center space-x-2 transition cursor-pointer disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Working Hours'}</span>
            </button>
          </div>

          <div className="space-y-6 text-xs">
            {/* Live Calculated Capacity Banner */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="font-bold text-[#0F172A] text-sm">Calculated Weekly Working Capacity</span>
                <p className="text-xs text-[#475569] mt-0.5">Based on {selectedWorkDays.length} selected working days × {stdHoursPerDay} hours per day.</p>
              </div>
              <span className="text-xl font-extrabold text-[#2563EB]">{calculatedWeeklyCapacity} Hours / Week</span>
            </div>

            {/* Monday - Sunday Selectable Working Days */}
            <div className="space-y-2">
              <span className={labelClass}>Select Active Working Days (Monday – Sunday)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {allWeekDays.map(day => {
                  const isChecked = selectedWorkDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const updatedDays = isChecked
                          ? selectedWorkDays.filter(d => d !== day)
                          : [...selectedWorkDays, day];
                        setSettings({
                          ...settings,
                          workingDays: { ...settings.workingDays, workDays: updatedDays }
                        });
                      }}
                      className={`p-3 rounded-xl border text-center font-bold transition cursor-pointer ${
                        isChecked
                          ? 'bg-blue-50 text-[#2563EB] border-blue-300 shadow-xs'
                          : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div>
                <label>
                  <span className={labelClass}>Standard Hours Per Day (4–12)</span>
                  <input
                    type="number"
                    min="4"
                    max="12"
                    value={settings.workingDays?.standardHoursPerDay || 8}
                    onChange={(e) => setSettings({ ...settings, workingDays: { ...settings.workingDays, standardHoursPerDay: Number(e.target.value) } })}
                    className={inputClass}
                  />
                </label>
              </div>

              <div>
                <label>
                  <span className={labelClass}>Overtime Threshold (Weekly Hours, 35–60)</span>
                  <input
                    type="number"
                    min="35"
                    max="60"
                    value={settings.workingDays?.overtimeThresholdHours || 40}
                    onChange={(e) => setSettings({ ...settings, workingDays: { ...settings.workingDays, overtimeThresholdHours: Number(e.target.value) } })}
                    className={inputClass}
                  />
                </label>
              </div>

              <div>
                <label>
                  <span className={labelClass}>Core Hours (Start - End)</span>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={settings.workingDays?.coreHoursStart || '09:00 AM'}
                      onChange={(e) => setSettings({ ...settings, workingDays: { ...settings.workingDays, coreHoursStart: e.target.value } })}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      value={settings.workingDays?.coreHoursEnd || '05:00 PM'}
                      onChange={(e) => setSettings({ ...settings, workingDays: { ...settings.workingDays, coreHoursEnd: e.target.value } })}
                      className={inputClass}
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: SECURITY TAB */}
      {activeSubTab === 'security' && (
        <div className="rounded-2xl p-8 border border-slate-200 bg-white shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F172A] flex items-center space-x-2">
                <Lock className="w-5 h-5 text-[#2563EB]" />
                <span>Account Security & Authentication Policy</span>
              </h3>
              <p className="text-xs text-[#475569]">Configure password complexity requirements, two-factor authentication and session timeouts.</p>
            </div>
            <button
              type="button"
              onClick={() => saveSettingsSection('accountSecurity', settings.accountSecurity)}
              disabled={saving}
              className="rounded-xl bg-[#2563EB] hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm flex items-center space-x-2 transition cursor-pointer disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Security Settings'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label>
                <span className={labelClass}>Minimum Password Length</span>
                <input
                  type="number"
                  min="6"
                  max="32"
                  value={settings.accountSecurity?.minPasswordLength || 8}
                  onChange={(e) => setSettings({ ...settings, accountSecurity: { ...settings.accountSecurity, minPasswordLength: Number(e.target.value) } })}
                  className={inputClass}
                />
              </label>
            </div>

            <div>
              <label>
                <span className={labelClass}>Session Timeout (Minutes)</span>
                <input
                  type="number"
                  min="15"
                  max="1440"
                  value={settings.accountSecurity?.sessionTimeoutMinutes || 60}
                  onChange={(e) => setSettings({ ...settings, accountSecurity: { ...settings.accountSecurity, sessionTimeoutMinutes: Number(e.target.value) } })}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="reqSpecial"
                checked={Boolean(settings.accountSecurity?.requireSpecialChar)}
                onChange={(e) => setSettings({ ...settings, accountSecurity: { ...settings.accountSecurity, requireSpecialChar: e.target.checked } })}
                className="rounded border-slate-300 text-[#2563EB] focus:ring-0 h-4 w-4 cursor-pointer"
              />
              <label htmlFor="reqSpecial" className="text-xs font-semibold text-[#0F172A] cursor-pointer">Require Special Characters in Passwords</label>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="reqNum"
                checked={Boolean(settings.accountSecurity?.requireNumber)}
                onChange={(e) => setSettings({ ...settings, accountSecurity: { ...settings.accountSecurity, requireNumber: e.target.checked } })}
                className="rounded border-slate-300 text-[#2563EB] focus:ring-0 h-4 w-4 cursor-pointer"
              />
              <label htmlFor="reqNum" className="text-xs font-semibold text-[#0F172A] cursor-pointer">Require Numbers in Passwords</label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SubTabBtn({ id, label, icon, activeSubTab, setActiveSubTab }) {
  const isActive = activeSubTab === id;
  return (
    <button
      type="button"
      onClick={() => setActiveSubTab(id)}
      className={`flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
        isActive
          ? 'bg-blue-50 text-[#2563EB] border border-blue-200 font-bold shadow-xs'
          : 'text-[#475569] hover:bg-slate-50 hover:text-[#0F172A]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
