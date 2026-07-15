import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getStudentProfile, saveStudentProfile } from '../lib/studentProfile';
import { authApi } from '../lib/backendSync';

const SETTINGS_KEY = 'careerpilot_settings';
const NOTIFICATION_SETTINGS_KEY = 'careerpilot_notification_preferences';

const DEFAULT_ROLE_SETTINGS = {
  student: {
    jobType: 'Full-time',
    alertFrequency: 'Daily',
  },
  recruiter: {
    companyName: 'Stripe',
    autoShortlist: true,
  },
  admin: {
    placementYear: '2026-2027',
    registrationAllowed: true,
  },
};

export function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'notifications', 'security'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Student specific settings
  const [jobType, setJobType] = useState('Full-time');
  const [alertFrequency, setAlertFrequency] = useState('Daily');

  // Recruiter specific settings
  const [companyName, setCompanyName] = useState('Stripe');
  const [autoShortlist, setAutoShortlist] = useState(true);

  // Admin specific settings
  const [placementYear, setPlacementYear] = useState('2026-2026');
  const [registrationAllowed, setRegistrationAllowed] = useState(true);

  // Notifications state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('careerpilot_current_user');
    if (user) {
      const parsed = JSON.parse(user);
      setCurrentUser(parsed);
      setName(parsed.name || '');
      setEmail(parsed.email || '');

      const savedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      const roleSettings = { ...DEFAULT_ROLE_SETTINGS[parsed.role], ...(savedSettings[parsed.role] || {}) };
      const savedNotifications = JSON.parse(localStorage.getItem(NOTIFICATION_SETTINGS_KEY) || '{}');

      if (parsed.role === 'student') {
        setJobType(roleSettings.jobType);
        setAlertFrequency(roleSettings.alertFrequency);
      } else if (parsed.role === 'recruiter') {
        setCompanyName(roleSettings.companyName);
        setAutoShortlist(roleSettings.autoShortlist);
      } else if (parsed.role === 'admin') {
        setPlacementYear(roleSettings.placementYear);
        setRegistrationAllowed(roleSettings.registrationAllowed);
      }

      setEmailNotifications(savedNotifications.emailNotifications ?? true);
      setSmsNotifications(savedNotifications.smsNotifications ?? false);
      setBrowserNotifications(savedNotifications.browserNotifications ?? true);
    }
  }, []);

  const persistRoleSettings = (role, nextSettings) => {
    const allSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    const updated = { ...allSettings, [role]: nextSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentUser) return;

    try {
      const response = await authApi.updateProfile({
        currentEmail: currentUser.email,
        name,
        email,
      });
      const updatedUser = response.user || { ...currentUser, name, email };

      localStorage.setItem('careerpilot_current_user', JSON.stringify(updatedUser));

      if (currentUser.role === 'student') {
        const studentProfile = getStudentProfile(updatedUser);
        saveStudentProfile({ ...studentProfile, name, email }, updatedUser);
        persistRoleSettings(currentUser.role, { jobType, alertFrequency });
      } else if (currentUser.role === 'recruiter') {
        persistRoleSettings(currentUser.role, { companyName, autoShortlist });
      } else if (currentUser.role === 'admin') {
        persistRoleSettings(currentUser.role, { placementYear, registrationAllowed });
      }

      setCurrentUser(updatedUser);
      setSuccess('Profile details updated successfully!');
    } catch (apiError) {
      setError(apiError.message || 'Profile update failed.');
    }
  };

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify({
      emailNotifications,
      smsNotifications,
      browserNotifications,
    }));
    setSuccess('Notification preferences saved successfully!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleSaveSecurity = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !newPassword || !confirmPassword) {
      setError('All password fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await authApi.updatePassword({
        email: currentUser.email,
        currentPassword: password,
        newPassword,
      });
      setSuccess('Password updated successfully!');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (apiError) {
      setError(apiError.message || 'Password update failed.');
    }
  };

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-4xl px-8 pb-12 pt-24 flex items-center justify-center">
        <p className="text-slate-400 font-medium">Loading settings...</p>
      </div>
    );
  }

  const role = currentUser.role;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-8 pb-12 pt-24">
      <header>
        <h2 className="text-3xl font-black text-on-surface tracking-tighter mb-1">Account Settings</h2>
        <p className="text-slate-500 text-sm">Manage your profile, system settings, and notifications</p>
      </header>

      {success && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 text-sm font-semibold rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-semibold rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Sidebar inside Settings page */}
        <div className="space-y-2">
          <div class="p-4 bg-white rounded-2xl border border-slate-200/50 shadow-sm">
            <div class="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200/50">
              <div class="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                {name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div class="min-w-0">
                <p className="font-bold text-sm truncate">{name}</p>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
            </div>
            <div class="space-y-1">
              <button
                type="button"
                onClick={() => { setActiveTab('profile'); setError(''); setSuccess(''); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'profile' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Profile Settings
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('notifications'); setError(''); setSuccess(''); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'notifications' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined text-sm">notifications</span>
                Notifications
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('security'); setError(''); setSuccess(''); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'security' ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined text-sm">security</span>
                Security
              </button>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <div className="md:col-span-2">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-on-surface border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">manage_accounts</span>
                  Profile Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                {role === 'student' && (
                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Preferences</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Preferred Job Type</label>
                        <select
                          value={jobType}
                          onChange={(e) => setJobType(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                        >
                          <option>Full-time</option>
                          <option>Internship</option>
                          <option>Contract</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Job Alerts</label>
                        <select
                          value={alertFrequency}
                          onChange={(e) => setAlertFrequency(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                        >
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Off</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {role === 'recruiter' && (
                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recruiter Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Company Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-6">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Auto-Shortlist Fit Candidates</span>
                        <button
                          type="button"
                          onClick={() => setAutoShortlist(!autoShortlist)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoShortlist ? 'bg-primary' : 'bg-slate-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoShortlist ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {role === 'admin' && (
                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Portal Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Active Academic Year</label>
                        <select
                          value={placementYear}
                          onChange={(e) => setPlacementYear(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                        >
                          <option>2026-2026</option>
                          <option>2026-2026</option>
                          <option>2026-2026</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between pt-6">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Allow Student Registration</span>
                        <button
                          type="button"
                          onClick={() => setRegistrationAllowed(!registrationAllowed)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${registrationAllowed ? 'bg-primary' : 'bg-slate-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${registrationAllowed ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-xs uppercase tracking-wider"
                  >
                    Save Profile Settings
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveNotifications} className="space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-on-surface border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">notifications_active</span>
                  Notification Channels
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Email Notifications</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Receive job alerts, calendar invites, and progress summaries.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailNotifications(!emailNotifications)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emailNotifications ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">SMS / WhatsApp Alerts</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Get urgent updates on scheduled interview loops on your phone.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSmsNotifications(!smsNotifications)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${smsNotifications ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${smsNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Browser Push Notifications</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Show real-time notifications on updates when CareerPilot is active.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBrowserNotifications(!browserNotifications)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${browserNotifications ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${browserNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-xs uppercase tracking-wider"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurity} className="space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-on-surface border-b border-slate-100 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">security</span>
                  Change Password
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Current Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-xs uppercase tracking-wider"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
