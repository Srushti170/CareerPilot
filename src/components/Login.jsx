import { useState } from 'react';
import { motion } from 'motion/react';
import { saveStudentProfile } from '../lib/studentProfile';
import { authApi } from '../lib/backendSync';

const DEFAULT_USERS = [];
const LEGACY_DEMO_EMAILS = new Set([
  'student@university.edu',
  'hr@company.com',
  'admin@university.edu',
]);

export function Login({ onLogin }) {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getStoredUsers = () => {
    const stored = localStorage.getItem('careerpilot_users');
    if (!stored) {
      localStorage.setItem('careerpilot_users', JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(stored).filter(
      (user) => !LEGACY_DEMO_EMAILS.has(String(user?.email || '').toLowerCase())
    );
    localStorage.setItem('careerpilot_users', JSON.stringify(parsed));
    return parsed;
  };

  const persistLocalUser = (user) => {
    const users = getStoredUsers();
    const existingIndex = users.findIndex((entry) => entry.email.toLowerCase() === user.email.toLowerCase());
    const existingUser = existingIndex >= 0 ? users[existingIndex] : null;
    const normalizedUser = {
      ...existingUser,
      ...user,
      password: user.password || existingUser?.password || '',
    };
    const updatedUsers = existingIndex >= 0
      ? users.map((entry, index) => (index === existingIndex ? normalizedUser : entry))
      : [...users, normalizedUser];

    localStorage.setItem('careerpilot_users', JSON.stringify(updatedUsers));
    return normalizedUser;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const users = getStoredUsers();

    if (mode === 'signin') {
      try {
        const { user: authenticatedUser, sessionToken } = await authApi.login({ email, password, role });
        persistLocalUser({ ...authenticatedUser, password, role });
        onLogin(authenticatedUser, false, sessionToken);
        return;
      } catch (apiError) {
        console.warn('Backend login unavailable, using local auth fallback.', apiError);
      }

      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role
      );

      if (user) {
        persistLocalUser(user);
        onLogin(user, false);
      } else {
        const anyUserWithEmail = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (anyUserWithEmail && anyUserWithEmail.role !== role) {
          setError(`Account exists, but with the role: ${anyUserWithEmail.role.toUpperCase()}. Please switch roles above.`);
        } else {
          setError('Invalid email or password.');
        }
      }
    } else {
      // Sign Up Validation
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailExists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
      if (emailExists) {
        setError('An account with this email already exists.');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setError('Use a valid email address to create your account.');
        return;
      }

      const newUser = {
        name: name.trim(),
        email: normalizedEmail,
        password,
        role
      };

      if (role === 'student') {
        saveStudentProfile({
          name: newUser.name,
          email: newUser.email,
          role: 'CS Senior Student',
          skills: [],
          onboardingComplete: false,
        }, newUser);
      }

      setSuccess('Account created successfully! Logging you in...');
      try {
        const { user: createdUser, sessionToken } = await authApi.register(newUser);
        persistLocalUser(createdUser);
        setTimeout(() => {
          onLogin(createdUser, true, sessionToken);
        }, 700);
      } catch (apiError) {
        console.warn('Backend register unavailable, using local auth fallback.', apiError);
        persistLocalUser(newUser);
        setTimeout(() => {
          onLogin(newUser, true);
        }, 700);
      }
    }
  };

  const roles = [
    { id: 'student', label: 'Student' },
    { id: 'recruiter', label: 'Recruiter' },
    { id: 'admin', label: 'Placement' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 elev-md md:p-10"
      >
        <div className="mb-6 text-center">
          <div className="mb-2 flex justify-center">
            <img src="/logo.png" alt="CareerPilot Logo" className="h-30 object-contain" />
          </div>
          <h1 className="mb-1 text-2xl font-headline font-bold tracking-tight text-slate-900">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-slate-500">
            {mode === 'signin' ? 'Sign in to your CareerPilot account' : 'Join the campus recruitment network'}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger/20 bg-danger-soft px-3 py-2.5 text-xs font-medium text-danger">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/20 bg-success-soft px-3 py-2.5 text-xs font-medium text-success">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {/* Role Switcher (segmented control) */}
        <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${role === r.id ? 'bg-white text-primary elev-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Alex Rivera"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={role === 'student' ? 'Enter your student email' : role === 'recruiter' ? 'Enter your recruiter email' : 'Enter your placement email'}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className={mode === 'signup' ? '' : 'col-span-2'}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </div>
            )}
          </div>

          {mode === 'signin' && (
            <div className="flex items-center justify-between pb-2 pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary" />
                Remember me
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); setError('Password reset is not configured yet.'); }} className="text-sm font-medium text-primary hover:text-primary-hover">Forgot password?</a>
            </div>
          )}

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/10"
          >
            {mode === 'signin' ? `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}` : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setMode('signup'); setError(''); }}
                className="font-semibold text-primary hover:text-primary-hover"
              >
                Sign up
              </a>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setMode('signin'); setError(''); }}
                className="font-semibold text-primary hover:text-primary-hover"
              >
                Sign in
              </a>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
