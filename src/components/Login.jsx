import { useState } from 'react';
import { motion } from 'motion/react';

export function Login({ onLogin }) {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Mock authentication
    if (email && password) {
      onLogin(role);
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
        className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl relative z-10 border border-outline-variant/20"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="CareerPilot Logo" className="h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-on-surface mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 text-sm">Sign in to your CareerPilot account</p>
        </div>

        <div className="flex gap-2 p-1 bg-surface-container-low rounded-xl mb-8">
          <button
            onClick={() => setRole('student')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'student' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Student
          </button>
          <button
            onClick={() => setRole('recruiter')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'recruiter' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Recruiter
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${role === 'admin' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Placement
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={role === 'student' ? 'student@university.edu' : role === 'recruiter' ? 'hr@company.com' : 'admin@university.edu'}
              className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          
          <div className="flex items-center justify-between mt-2 mb-6">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary" />
              Remember me
            </label>
            <a href="#" className="text-sm font-bold text-primary hover:underline">Forgot password?</a>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-500">
          Don't have an account? <a href="#" className="font-bold text-primary hover:underline">Sign up</a>
        </p>
      </motion.div>
    </div>
  );
}
