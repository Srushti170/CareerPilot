import { useEffect, useState } from 'react';
import { MetricCard } from './MetricCard';
import { JobCard } from './JobCard';
import { SectionHeader } from './ui/SectionHeader';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { CompanyLogo } from './ui/CompanyLogo';
import { motion } from 'motion/react';
import { getStudentProfile } from '../lib/studentProfile';
import { getInterviewDashboardStats, getInterviewFeedbackHistory } from '../lib/interviewInsights';
import { getStoredAnnouncements } from '../lib/adminData';
import { getPublishedJobs } from '../lib/recruiterData';

export function StudentDashboard({ applications = [], setApplications, setActiveTab }) {
  const savedProfile = getStudentProfile();
  const studentName = savedProfile.name || 'Student';
  const interviewStats = getInterviewDashboardStats(getInterviewFeedbackHistory());
  const [jobs, setJobs] = useState(() => getPublishedJobs().slice(0, 3));
  const [announcements, setAnnouncements] = useState(() => getStoredAnnouncements().slice(0, 3));
  const latestResumeAnalysis = JSON.parse(localStorage.getItem('careerpilot_latest_resume_analysis') || 'null');
  const applicationMatchScores = applications.map((app) => app.matchScore).filter((score) => typeof score === 'number');
  const averageApplicationMatch = applicationMatchScores.length
    ? Math.round(applicationMatchScores.reduce((sum, score) => sum + score, 0) / applicationMatchScores.length)
    : 76;

  const actions = [
    { title: "Improve your Resume", desc: "Add your recent Hackathon project.", progress: 90, icon: "edit_document", color: "primary", actionKey: "profile" },
    { title: "Mock Interview", desc: "Practice System Design concepts.", progress: 45, icon: "interpreter_mode", color: "secondary", actionKey: "interviews" },
    { title: "Apply to 3 Jobs", desc: "Hit your weekly application target.", progress: 33, icon: "send", color: "tertiary", actionKey: "search" },
  ];

  const [activeTrackerIndex, setActiveTrackerIndex] = useState(0);

  useEffect(() => {
    const syncJobs = () => setJobs(getPublishedJobs().slice(0, 3));
    const syncAnnouncements = () => setAnnouncements(getStoredAnnouncements().slice(0, 3));
    window.addEventListener('careerpilot:jobs-updated', syncJobs);
    window.addEventListener('careerpilot:announcements-updated', syncAnnouncements);
    return () => {
      window.removeEventListener('careerpilot:jobs-updated', syncJobs);
      window.removeEventListener('careerpilot:announcements-updated', syncAnnouncements);
    };
  }, []);

  const openTailoredSearch = () => {
    setActiveTab('search');
  };

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
        done: ['Interview', 'Offered', 'Accepted', 'Declined', 'Rejected'].includes(status), 
        current: status === 'Reviewing',
        icon: status === 'Reviewing' ? "schedule" : "check" 
      },
      { 
        label: "Interview", 
        date: status === 'Interview' ? "Scheduled" : (['Offered', 'Accepted', 'Declined', 'Rejected'].includes(status) ? "Completed" : "Pending"), 
        active: ['Interview', 'Offered', 'Accepted', 'Declined', 'Rejected'].includes(status), 
        done: ['Offered', 'Accepted', 'Declined', 'Rejected'].includes(status), 
        current: status === 'Interview',
        icon: status === 'Interview' ? "schedule" : "check" 
      },
      { 
        label: status === 'Rejected' ? "Closed" : status === 'Accepted' ? "Accepted" : status === 'Declined' ? "Declined" : "Offer", 
        date: status === 'Offered' ? "Received" : status === 'Accepted' ? "Joined" : status === 'Declined' ? "Closed" : (status === 'Rejected' ? "Not Selected" : "Pending"), 
        active: ['Offered', 'Accepted', 'Declined', 'Rejected'].includes(status), 
        done: ['Offered', 'Accepted', 'Declined', 'Rejected'].includes(status), 
        current: false, 
        icon: status === 'Rejected' || status === 'Declined' ? "cancel" : "celebration" 
      }
    ];
  };

  const activeApps = applications.filter(app => !['Rejected', 'Declined', 'Accepted'].includes(app.status));
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
        <MetricCard
          label="ATS Resume Score"
          value={`${latestResumeAnalysis?.atsScore ?? 82}/100`}
          subtext={latestResumeAnalysis ? `Latest JD match: ${latestResumeAnalysis.matchScore}%` : 'Run Resume AI Match to generate a real score'}
          progress={latestResumeAnalysis?.atsScore ?? 82}
          icon="document_scanner"
          color="primary"
        />
        <MetricCard
          label="Profile Match Avg"
          value={`${averageApplicationMatch}%`}
          subtext={applications.length > 0 ? 'Across your submitted applications' : 'Your average job alignment updates after one-click apply'}
          progress={averageApplicationMatch}
          icon="radar"
          color="secondary"
        />
        <MetricCard
          label="Mock Interview Score"
          value={`${interviewStats.averageScore}%`}
          subtext={interviewStats.sessions > 0 ? `Across ${interviewStats.sessions} completed mocks` : 'Complete a mock session to unlock live scoring'}
          progress={interviewStats.averageScore || 0}
          icon="record_voice_over"
          color="tertiary"
        />
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
                  onTailorResume={openTailoredSearch}
                />
              );
            })}
          </div>
        </section>
      </div>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 elev-sm">
          <SectionHeader title="Placement announcements" />
          <div className="mt-4 space-y-4">
            {announcements.length === 0 ? (
              <p className="text-sm text-slate-500">No announcements yet.</p>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-slate-900">{announcement.title}</h4>
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold text-primary">{announcement.audience}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{announcement.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 elev-sm">
          <SectionHeader title="Action plan" />
          <div className="mt-4 space-y-4">
            {actions.map((action) => (
              <div key={action.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <span className="material-symbols-outlined">{action.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-semibold text-slate-900">{action.title}</h4>
                      <span className="text-xs font-semibold text-slate-500">{action.progress}%</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{action.desc}</p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${action.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                <div className="rounded-lg border border-slate-200">
                  <CompanyLogo
                    company={currentTracker.company}
                    src={currentTracker.logo || ''}
                    className="h-11 w-11"
                    imageClassName="h-7 w-7 object-contain"
                    labelClassName="text-sm"
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
