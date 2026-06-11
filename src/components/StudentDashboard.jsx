import { useState } from 'react';
import { MetricCard } from './MetricCard';
import { JobCard } from './JobCard';
import { motion, AnimatePresence } from 'motion/react';

export function StudentDashboard({ applications = [], setApplications, setActiveTab }) {
  const savedProfile = JSON.parse(localStorage.getItem('careerpilot_student_profile') || '{}');
  const studentName = savedProfile.name || 'Student';
  const jobs = [
    {
      id: '1',
      title: 'Associate Software Engineer',
      company: 'Google',
      location: 'Mountain View, CA',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6n9O4Yw1sHm33bnxv42c3Lc__KboJawPt7X0Q7ccBUqzaPBfqbyO3NijginBJ6pnNTcE0_zmA7b1bGoiapK3X6BW-S-8TbXCeAv06XaZs1HCk-oGvvv1g-VLo9cAZjCiqB0aOwe6GDt5BS-e1hdsRwWFNw_UkfrG-HrmWWGQZ8xxzZibnX37QHy3ASKJFheqhCdg0lpHIJRVgXK5s52Z5gSAIq78DMoGGiR60gBtoynaU4cZUm8k_PZT2u6YCkx7jmjC36lPZNho',
      match: 94,
      type: 'Full-time',
      locationType: 'Hybrid',
      salary: '$140k - $180k',
      missingSkills: ['GoLang', 'Docker'],
      shortDescription: "Contribute to core infrastructure services and improve cloud scalability."
    },
    {
      id: '2',
      title: 'Product Design Intern',
      company: 'Spotify',
      location: 'New York, NY',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg5TCxfVEVTwqJBz3K-PoZz7BV9o2AA5pVePpvL0rcQ2qmEXRmFlA0q4xQj7Ledty0tT-oWh2v2MJfW10NJ7T7tBsXlcXcFhkRCegUsSzWpq1n-AwnLT3vxcZslE9dqzR8qr6GivlnTq0nPfj52oIBX2EI5FBBkYXMZKOXFqLvniLWgMp_jvg1z5bBSSGNYbv98_i3eMvUx7ss6vf3rnSI7gZmquBT9kSXD_J-T9MEFc6Y8BfHITPC-q8VBN9vrnEJMIYTTXdwmiA',
      match: 88,
      type: 'Internship',
      locationType: 'Remote',
      salary: '$6k/mo',
      missingSkills: ['Prototyping'],
      shortDescription: "Design intuitive features for listeners worldwide as part of our summer program."
    }
  ];

  const actions = [
    { title: "Improve your Resume", desc: "Add your recent Hackathon project.", progress: 90, icon: "edit_document", color: "primary", actionKey: "profile" },
    { title: "Mock Interview", desc: "Practice System Design concepts.", progress: 45, icon: "interpreter_mode", color: "secondary", actionKey: "interviews" },
    { title: "Apply to 3 Jobs", desc: "Hit your weekly application target.", progress: 33, icon: "send", color: "tertiary", actionKey: "search" },
  ];

  const [activeTrackerIndex, setActiveTrackerIndex] = useState(0);

  const handleApply = (job) => {
    const isAlreadyApplied = applications.some(
      app => app.company.toLowerCase() === job.company.toLowerCase() && 
             app.role.toLowerCase() === job.title.toLowerCase()
    );
    if (isAlreadyApplied) return;

    const newApp = {
      id: Date.now().toString(),
      company: job.company,
      role: job.title,
      appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'Applied',
      logo: job.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`
    };

    setApplications([newApp, ...applications]);
  };

  const getStepsForStatus = (status, date) => {
    return [
      { label: "Applied", date: date, active: true, done: true, icon: "check" },
      { 
        label: "Shortlisted", 
        date: status !== 'Applied' ? "Completed" : "In Progress", 
        active: status !== 'Applied', 
        done: ['Interview', 'Offered', 'Rejected'].includes(status), 
        current: status === 'Reviewing',
        icon: status === 'Reviewing' ? "schedule" : "check" 
      },
      { 
        label: "Interview", 
        date: status === 'Interview' ? "Scheduled" : (['Offered', 'Rejected'].includes(status) ? "Completed" : "Pending"), 
        active: ['Interview', 'Offered', 'Rejected'].includes(status), 
        done: ['Offered', 'Rejected'].includes(status), 
        current: status === 'Interview',
        icon: status === 'Interview' ? "schedule" : "check" 
      },
      { 
        label: status === 'Rejected' ? "Closed" : "Offer", 
        date: status === 'Offered' ? "Received" : (status === 'Rejected' ? "Not Selected" : "Pending"), 
        active: ['Offered', 'Rejected'].includes(status), 
        done: ['Offered', 'Rejected'].includes(status), 
        current: false, 
        icon: status === 'Rejected' ? "cancel" : "celebration" 
      }
    ];
  };

  const activeApps = applications.filter(app => app.status !== 'Rejected');
  const currentTracker = activeApps[activeTrackerIndex % (activeApps.length || 1)];

  const handlePrevTracker = () => {
    setActiveTrackerIndex(prev => (prev === 0 ? activeApps.length - 1 : prev - 1));
  };

  const handleNextTracker = () => {
    setActiveTrackerIndex(prev => (prev === activeApps.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      <section>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 bg-[linear-gradient(130deg,#0f172a_0%,#1e3a8a_45%,#2563eb_100%)] p-8 text-white shadow-2xl shadow-primary/10"
        >
          <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-100">Student dashboard</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight">Welcome back, {studentName}.</h2>
          <p className="mt-2 max-w-2xl text-sm text-blue-100/90">Track applications, polish your profile, and keep your opportunities pipeline moving with a cleaner, recruiter-ready view.</p>
        </motion.div>
        <p className="text-slate-500 mt-1">You have {applications.filter(a => a.status === 'Interview').length} upcoming interviews this week. Let's get prepared.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="ATS Resume Score" value="82/100" subtext="Based on standard ATS parsing" progress={82} icon="document_scanner" color="primary" />
        <MetricCard label="Profile Match Avg" value="76%" subtext="Across your saved job listings" progress={76} icon="radar" color="secondary" />
        <MetricCard label="Mock Interview Score" value="68%" subtext="Average across 5 technical mocks" progress={68} icon="record_voice_over" color="tertiary" />
      </section>

      <div className="grid grid-cols-1 gap-8 items-start">
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold tracking-tight">Recommended for You</h3>
            <button onClick={() => setActiveTab('search')} className="text-primary text-sm font-semibold hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => {
              const isApplied = applications.some(
                app => app.company.toLowerCase() === job.company.toLowerCase() && 
                       app.role.toLowerCase() === job.title.toLowerCase()
              );
              return (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  applied={isApplied} 
                  onApply={() => handleApply(job)} 
                />
              );
            })}
          </div>
        </section>
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold tracking-tight">Active Trackers</h3>
          {activeApps.length > 1 && (
            <div className="flex gap-2">
              <button 
                onClick={handlePrevTracker} 
                className="p-2 bg-white rounded-lg shadow-sm border border-outline-variant/10 hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">chevron_left</span>
              </button>
              <button 
                onClick={handleNextTracker} 
                className="p-2 bg-white rounded-lg shadow-sm border border-outline-variant/10 hover:bg-slate-50 transition-colors"
              >
                <span className="material-symbols-outlined text-slate-500">chevron_right</span>
              </button>
            </div>
          )}
        </div>
        
        {activeApps.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/5 text-center flex flex-col items-center justify-center gap-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">work_outline</span>
            <p className="text-slate-500 font-medium">No active applications currently tracking.</p>
            <button 
              onClick={() => setActiveTab('search')} 
              className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/25 transition-all uppercase tracking-wider"
            >
              Find and Apply for Jobs
            </button>
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/5">
            <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 p-2">
                  <img 
                    src={currentTracker.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentTracker.company)}&background=random`} 
                    className="w-7 h-7 object-contain" 
                    alt={currentTracker.company} 
                  />
                </div>
                <div>
                  <h4 className="font-bold">{currentTracker.role}</h4>
                  <p className="text-xs text-slate-500">{currentTracker.company}</p>
                </div>
              </div>
              <div className="text-center md:text-right">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Status</p>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                  {currentTracker.status}
                </span>
              </div>
            </div>

            <div className="pt-4 overflow-x-auto">
              <div className="relative min-w-[600px]">
                {/* Background Line */}
                <div className="absolute top-[20px] left-[12.5%] right-[12.5%] h-1 bg-slate-200 z-0"></div>
                
                {/* Progress Line */}
                <div className="absolute top-[20px] left-[12.5%] h-1 bg-primary z-0 transition-all duration-500" 
                     style={{ width: `${(getStepsForStatus(currentTracker.status, currentTracker.appliedDate).filter(s => s.done).length - 1) * 25}%` }}></div>
                
                <div className="relative z-10 grid grid-cols-4">
                  {getStepsForStatus(currentTracker.status, currentTracker.appliedDate).map((step, i) => (
                    <div key={i} className={`flex flex-col items-center gap-2 ${!step.active ? 'opacity-30' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                        step.done ? 'bg-primary text-white shadow-primary/20' : 
                        step.current ? 'bg-white border-2 border-primary text-primary animate-pulse' : 'bg-white border-2 border-slate-200 text-slate-400'
                      }`}>
                        <span className="material-symbols-outlined" style={step.done ? { fontVariationSettings: "'FILL' 1" } : {}}>{step.icon}</span>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-bold ${step.current ? 'text-primary' : 'text-on-surface'}`}>{step.label}</p>
                        <p className={`text-[10px] ${step.current ? 'text-primary-container font-semibold' : 'text-slate-400'}`}>{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
