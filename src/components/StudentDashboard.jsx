import { useState } from 'react';
import { MetricCard } from './MetricCard';
import { JobCard } from './JobCard';
import { SectionHeader } from './ui/SectionHeader';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { motion } from 'motion/react';

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
    <div className="mx-auto max-w-7xl space-y-10 px-8 pb-12 pt-24">
      <section>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8faf9_55%,#eef7f5_100%)] p-8 elev-sm"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-primary">Student dashboard</p>
          <h2 className="mt-3 text-3xl font-headline font-bold tracking-tight text-slate-900">Welcome back, {studentName}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Track applications, improve your profile, and keep your search moving with a clean view of what needs attention next.</p>
          <p className="mt-3 text-sm text-slate-500">You have <span className="font-semibold text-slate-900">{applications.filter(a => a.status === 'Interview').length}</span> upcoming interviews this week.</p>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="ATS Resume Score" value="82/100" subtext="Based on standard ATS parsing" progress={82} icon="document_scanner" color="primary" />
        <MetricCard label="Profile Match Avg" value="76%" subtext="Across your saved job listings" progress={76} icon="radar" color="secondary" />
        <MetricCard label="Mock Interview Score" value="68%" subtext="Average across 5 technical mocks" progress={68} icon="record_voice_over" color="tertiary" />
      </section>

      <div className="grid grid-cols-1 gap-8 items-start">
        <section className="space-y-6">
          <SectionHeader
            title="Recommended for you"
            action={<Button variant="ghost" size="sm" onClick={() => setActiveTab('search')}>View all</Button>}
          />
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
        <SectionHeader
          title="Active trackers"
          action={activeApps.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={handlePrevTracker}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                onClick={handleNextTracker}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          )}
        />

        {activeApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-8 text-center elev-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <span className="material-symbols-outlined text-2xl">work_outline</span>
            </div>
            <p className="text-sm text-slate-500">No active applications currently tracking.</p>
            <Button onClick={() => setActiveTab('search')}>Find and apply for jobs</Button>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 elev-sm">
            <div className="mb-10 flex flex-col items-center justify-between gap-4 md:flex-row">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <img
                    src={currentTracker.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentTracker.company)}&background=random`}
                    className="h-7 w-7 object-contain"
                    alt={currentTracker.company}
                  />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-slate-900">{currentTracker.role}</h4>
                  <p className="mt-0.5 text-sm text-slate-500">{currentTracker.company}</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1.5 md:items-end">
                <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-400">Status</p>
                <Badge tone="brand">{currentTracker.status}</Badge>
              </div>
            </div>

            <div className="overflow-x-auto pt-4">
              <div className="relative min-w-[600px]">
                {/* Background Line */}
                <div className="absolute top-[20px] left-[12.5%] right-[12.5%] z-0 h-0.5 bg-slate-200"></div>

                {/* Progress Line */}
                <div className="absolute top-[20px] left-[12.5%] z-0 h-0.5 bg-primary transition-all duration-500"
                     style={{ width: `${(getStepsForStatus(currentTracker.status, currentTracker.appliedDate).filter(s => s.done).length - 1) * 25}%` }}></div>

                <div className="relative z-10 grid grid-cols-4">
                  {getStepsForStatus(currentTracker.status, currentTracker.appliedDate).map((step, i) => (
                    <div key={i} className={`flex flex-col items-center gap-2 ${!step.active ? 'opacity-40' : ''}`}>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                        step.done ? 'bg-primary text-white' :
                        step.current ? 'border-2 border-primary bg-white text-primary' : 'border-2 border-slate-200 bg-white text-slate-400'
                      }`}>
                        <span className="material-symbols-outlined text-[20px]" style={step.done ? { fontVariationSettings: "'FILL' 1" } : {}}>{step.icon}</span>
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-medium ${step.current ? 'text-primary' : 'text-slate-700'}`}>{step.label}</p>
                        <p className={`text-xs ${step.current ? 'font-medium text-primary' : 'text-slate-400'}`}>{step.date}</p>
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
