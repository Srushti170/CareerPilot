import { useState } from 'react';
import { motion } from 'motion/react';

// Default pre-seeded users for demo & testing
const DEFAULT_USERS = [
  {
    name: 'Alex Rivera',
    email: 'student@university.edu',
    password: 'password',
    role: 'student'
  },
  {
    name: 'Sarah Jenkins',
    email: 'hr@company.com',
    password: 'password',
    role: 'recruiter'
  },
  {
    name: 'Dr. Elena Rodriguez',
    email: 'admin@university.edu',
    password: 'password',
    role: 'admin'
  }
];

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
    return JSON.parse(stored);
  };

  const handleAuth = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const users = getStoredUsers();

    if (mode === 'signin') {
      // Find user matching email, password AND role
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role
      );

      if (user) {
        onLogin(user, false);
      } else {
        // Double check if user exists with a different role to give a helpful hint
        const anyUserWithEmail = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (anyUserWithEmail && anyUserWithEmail.role !== role) {
          setError(`Account exists, but with the role: ${anyUserWithEmail.role.toUpperCase()}. Please switch roles above.`);
        } else {
          setError('Invalid email or password. Hint: Use default password "password".');
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

      const updatedUsers = [...users, newUser];
      localStorage.setItem('careerpilot_users', JSON.stringify(updatedUsers));

      if (role === 'student') {
        localStorage.setItem('careerpilot_student_onboarding_complete', 'false');
        localStorage.setItem('careerpilot_student_profile', JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: 'student',
          education: [],
          skills: [],
          socials: { LinkedIn: { connected: false, handle: '' }, GitHub: { connected: false, handle: '' }, Portfolio: { connected: false, handle: '' } },
          onboardingComplete: false,
        }));
      }

      setSuccess('Account created successfully! Logging you in...');
      
      // Auto login after 1 second
      setTimeout(() => {
        onLogin(newUser, true);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/20 blur-[120px] rounded-full pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl relative z-10 border border-outline-variant/20"
      >
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="CareerPilot Logo" className="h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-on-surface mb-1 tracking-tight">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-slate-500 text-sm">
            {mode === 'signin' ? 'Sign in to your CareerPilot account' : 'Join the elite campus recruitment loop'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {/* Role Switcher */}
        <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'student' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole('recruiter')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'recruiter' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Recruiter
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'admin' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Placement
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Alex Rivera"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={role === 'student' ? 'student@university.edu' : role === 'recruiter' ? 'hr@company.com' : 'admin@university.edu'}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className={mode === 'signup' ? '' : 'col-span-2'}>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                />
              </div>
            )}
          </div>
          
          {mode === 'signin' && (
            <div className="flex items-center justify-between pt-1 pb-2">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary" />
                Remember me
              </label>
              <a href="#" onClick={(e) => { e.preventDefault(); setError('Demo mode: Please use standard login.'); }} className="text-xs font-bold text-primary hover:underline">Forgot password?</a>
            </div>
          )}

          <button 
            type="submit"
            className="w-full mt-2 py-3.5 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm"
          >
            {mode === 'signin' ? `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}` : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-slate-100 text-sm text-slate-500">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); setMode('signup'); setError(''); }} 
                className="font-bold text-primary hover:underline"
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
                className="font-bold text-primary hover:underline"
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
