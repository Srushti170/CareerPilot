import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { getStudentProfile, saveStudentProfile } from '../lib/studentProfile';

const DEFAULT_PROFILE = {
  name: '',
  email: '',
  phone: '',
  university: '',
  degree: '',
  branch: '',
  graduation: '',
  gpa: '',
  summary: '',
  skills: [],
  projects: '',
  experience: '',
  achievements: '',
  certifications: '',
  responsibility: '',
  codingProfiles: {
    LinkedIn: '',
    GitHub: '',
    Portfolio: '',
    LeetCode: '',
    CodeChef: '',
    HackerRank: '',
  },
};

export function StudentOnboarding({ currentUser, onComplete }) {
  const storedProfile = getStudentProfile(currentUser);
  const [form, setForm] = useState(() => ({
    ...DEFAULT_PROFILE,
    ...storedProfile,
    degree: storedProfile.degree || storedProfile.branch || '',
    gpa: storedProfile.gpa || storedProfile.cgpa || '',
    name: currentUser?.name || storedProfile.name || '',
    email: currentUser?.email || storedProfile.email || '',
  }));
  const [skillInput, setSkillInput] = useState('');
  const [message, setMessage] = useState('');

  const profileStrength = useMemo(() => {
    const required = [form.university, form.degree, form.skills.length > 0, form.codingProfiles.LinkedIn, form.codingProfiles.GitHub];
    const completed = required.filter(Boolean).length;
    return Math.min(100, Math.round((completed / 5) * 100));
  }, [form]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      codingProfiles: { ...prev.codingProfiles, [field]: value },
    }));
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill || form.skills.includes(skill)) return;
    setForm((prev) => ({ ...prev, skills: [...prev.skills, skill] }));
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((item) => item !== skill) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.university.trim() || !form.degree.trim() || form.skills.length === 0 || !form.codingProfiles.LinkedIn.trim() || !form.codingProfiles.GitHub.trim()) {
      setMessage('Education, skills, LinkedIn, and GitHub are required to activate your student dashboard.');
      return;
    }

    const profile = {
      ...form,
      role: 'CS Senior Student',
      branch: form.branch || form.degree,
      degree: form.degree || form.branch,
      gpa: form.gpa,
      cgpa: form.gpa,
      socials: {
        LinkedIn: { connected: !!form.codingProfiles.LinkedIn, handle: form.codingProfiles.LinkedIn },
        GitHub: { connected: !!form.codingProfiles.GitHub, handle: form.codingProfiles.GitHub },
        Portfolio: { connected: !!form.codingProfiles.Portfolio, handle: form.codingProfiles.Portfolio },
      },
      onboardingComplete: true,
    };

    saveStudentProfile(profile, currentUser);

    if (currentUser) {
      const updatedUser = { ...currentUser, profileCompleted: true };
      localStorage.setItem('careerpilot_current_user', JSON.stringify(updatedUser));
    }

    setMessage('Profile ready. Opening your dashboard now.');
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eff6ff_0%,#f8fafc_30%,#eefbf7_100%)] pt-20 px-4 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-6xl flex-col gap-8"
      >
        <header className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl shadow-primary/10 backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-primary">Student onboarding</p>
          <h1 className="mt-3 text-3xl font-black text-slate-900 md:text-4xl">Build your student profile before your dashboard opens.</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">Capture your academic, skills, and social details in one step. Education, skills, LinkedIn, and GitHub are required to continue.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">Profile strength: {profileStrength}%</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Required: Education + Skills + LinkedIn + GitHub</span>
          </div>
        </header>

        {message && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
            <div>
              <h2 className="text-xl font-black text-slate-900">Personal & academic details</h2>
              <p className="text-sm text-slate-500">Use this as the foundation for your recruitment profile.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Full name<input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary focus:bg-white" /></label>
              <label className="text-sm font-semibold text-slate-700">Email<input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" /></label>
              <label className="text-sm font-semibold text-slate-700">Phone<input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" /></label>
              <label className="text-sm font-semibold text-slate-700">University<span className="text-rose-500"> *</span><input value={form.university} onChange={(e) => handleChange('university', e.target.value)} required className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" /></label>
              <label className="text-sm font-semibold text-slate-700">Degree / Major<span className="text-rose-500"> *</span><input value={form.degree} onChange={(e) => handleChange('degree', e.target.value)} required className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" /></label>
              <label className="text-sm font-semibold text-slate-700">Graduation year<input value={form.graduation} onChange={(e) => handleChange('graduation', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" /></label>
              <label className="text-sm font-semibold text-slate-700">CGPA / GPA<input value={form.gpa} onChange={(e) => handleChange('gpa', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" /></label>
              <label className="md:col-span-2 text-sm font-semibold text-slate-700">Professional summary<textarea rows="3" value={form.summary} onChange={(e) => handleChange('summary', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" /></label>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Skills<span className="text-rose-500"> *</span></label>
              <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                {form.skills.map((skill) => (
                  <button key={skill} type="button" onClick={() => removeSkill(skill)} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20">{skill} ×</button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary" placeholder="React, Python, SQL..." />
                <button type="button" onClick={addSkill} className="rounded-2xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-[0.25em] text-white shadow-lg shadow-primary/20">Add</button>
              </div>
            </div>
          </section>

          <aside className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
            <div>
              <h2 className="text-xl font-black text-slate-900">Experience & portfolio</h2>
              <p className="text-sm text-slate-500">This section helps recruiters understand your profile faster.</p>
            </div>
            <label className="text-sm font-semibold text-slate-700">Projects<textarea rows="3" value={form.projects} onChange={(e) => handleChange('projects', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" placeholder="Describe major projects, hackathons, or campus initiatives." /></label>
            <label className="text-sm font-semibold text-slate-700">Experience / internships<textarea rows="3" value={form.experience} onChange={(e) => handleChange('experience', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" /></label>
            <label className="text-sm font-semibold text-slate-700">Achievements<textarea rows="3" value={form.achievements} onChange={(e) => handleChange('achievements', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" /></label>
            <label className="text-sm font-semibold text-slate-700">Certifications<textarea rows="3" value={form.certifications} onChange={(e) => handleChange('certifications', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" /></label>
            <label className="text-sm font-semibold text-slate-700">Positions of responsibility<textarea rows="3" value={form.responsibility} onChange={(e) => handleChange('responsibility', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white" /></label>

            <div className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">Coding profiles</h3>
              <div className="mt-3 space-y-3">
                <label className="text-xs font-semibold text-slate-700">LinkedIn<span className="text-rose-500"> *</span><input value={form.codingProfiles.LinkedIn} onChange={(e) => handleSocialChange('LinkedIn', e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary" /></label>
                <label className="text-xs font-semibold text-slate-700">GitHub<span className="text-rose-500"> *</span><input value={form.codingProfiles.GitHub} onChange={(e) => handleSocialChange('GitHub', e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary" /></label>
                <label className="text-xs font-semibold text-slate-700">Portfolio<input value={form.codingProfiles.Portfolio} onChange={(e) => handleSocialChange('Portfolio', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary" /></label>
                <label className="text-xs font-semibold text-slate-700">LeetCode<input value={form.codingProfiles.LeetCode} onChange={(e) => handleSocialChange('LeetCode', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary" /></label>
                <label className="text-xs font-semibold text-slate-700">CodeChef<input value={form.codingProfiles.CodeChef} onChange={(e) => handleSocialChange('CodeChef', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary" /></label>
                <label className="text-xs font-semibold text-slate-700">HackerRank<input value={form.codingProfiles.HackerRank} onChange={(e) => handleSocialChange('HackerRank', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary" /></label>
              </div>
            </div>

            <button type="submit" className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-black uppercase tracking-[0.25em] text-white shadow-xl shadow-primary/25 transition hover:scale-[1.01]">Complete onboarding</button>
          </aside>
        </form>
      </motion.div>
    </div>
  );
}
