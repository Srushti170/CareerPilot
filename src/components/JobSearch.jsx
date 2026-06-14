import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JobCard } from './JobCard';
import { ResumeIntelligence } from './ResumeIntelligence';
import { ResumeBuilder } from './ResumeBuilder';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { buildFallbackApplyReview, createApplicationRecord, generateCoverLetter, resumeDraftToText, tailorResumeForJob } from '../lib/resumeTools';
import { getStudentProfile } from '../lib/studentProfile';
import { getPublishedJobs } from '../lib/recruiterData';
import { generateCoverLetterWithAI, isCareerAiAvailable, rankJobsForStudentWithAI, reviewTailoredResumeForJobWithAI, tailorResumeWithAI } from '../lib/aiCareerTools';
import { openResumePrintPreview, saveResumeVersion } from '../lib/resumeVersions';

const APPLY_READY_ATS_SCORE = 70;
const APPLY_READY_MATCH_SCORE = 65;

export function JobSearch({ searchQuery = '', setSearchQuery, applications = [], setApplications, setActiveTab }) {
  const [activeSearchTab, setActiveSearchTab] = useState('listings');
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicationDraft, setApplicationDraft] = useState(null);
  const [applicationResumeDraft, setApplicationResumeDraft] = useState(null);
  const [builderReviewContext, setBuilderReviewContext] = useState(null);
  const [isGeneratingApplyPackage, setIsGeneratingApplyPackage] = useState(false);
  const [isRefreshingMatches, setIsRefreshingMatches] = useState(false);
  const [aiJobInsights, setAiJobInsights] = useState({});

  const [filterJobTypes, setFilterJobTypes] = useState([]);
  const [filterLocationTypes, setFilterLocationTypes] = useState([]);
  const [filterLocationText, setFilterLocationText] = useState('');
  const [filterExperience, setFilterExperience] = useState('Any Experience');
  const [filterIncome, setFilterIncome] = useState(0);
  const [jobs, setJobs] = useState(() => getPublishedJobs());
  const studentProfile = getStudentProfile();
  const aiAvailable = isCareerAiAvailable();

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const syncJobs = () => setJobs(getPublishedJobs());
    window.addEventListener('careerpilot:jobs-updated', syncJobs);
    return () => window.removeEventListener('careerpilot:jobs-updated', syncJobs);
  }, []);

  const refreshAiMatches = async () => {
    if (!aiAvailable || isRefreshingMatches) return;
    setIsRefreshingMatches(true);
    try {
      const rankedJobs = await rankJobsForStudentWithAI({
        profile: studentProfile,
        jobs,
      });
      const insightMap = rankedJobs.reduce((acc, item) => {
        acc[`${item.company}::${item.title}`] = item;
        return acc;
      }, {});
      setAiJobInsights(insightMap);
    } catch (error) {
      console.error('Gemini job ranking error, keeping default ranking:', error);
    }
    setIsRefreshingMatches(false);
  };

  const handleApply = async (job) => {
    const isAlreadyApplied = applications.some(
      app => app.company.toLowerCase() === job.company.toLowerCase() &&
             app.role.toLowerCase() === job.title.toLowerCase()
    );
    if (isAlreadyApplied) return;

    setIsGeneratingApplyPackage(true);
    let tailoredResume = applicationResumeDraft && selectedJob?.company === job.company && selectedJob?.title === job.title
      ? applicationResumeDraft
      : tailorResumeForJob(studentProfile, job);
    let coverLetter = generateCoverLetter(studentProfile, job, tailoredResume);
    let applyReview = buildFallbackApplyReview({
      draft: tailoredResume,
      job,
      profile: studentProfile,
    });

    if (aiAvailable) {
      try {
        const aiResumeDraft = await tailorResumeWithAI({
          profile: studentProfile,
          job,
          currentDraft: tailoredResume,
        });

        tailoredResume = {
          ...tailoredResume,
          summary: aiResumeDraft.tailoredSummary || tailoredResume.summary,
          tailoredSummary: aiResumeDraft.tailoredSummary || tailoredResume.tailoredSummary,
          skills: aiResumeDraft.skills.length > 0 ? aiResumeDraft.skills : tailoredResume.skills,
          experienceBullets: aiResumeDraft.experienceBullets.length > 0 ? aiResumeDraft.experienceBullets : tailoredResume.experienceBullets,
          projectBullets: aiResumeDraft.projectBullets.length > 0 ? aiResumeDraft.projectBullets : tailoredResume.projectBullets,
          missingSkills: aiResumeDraft.missingSkills.length > 0 ? aiResumeDraft.missingSkills : tailoredResume.missingSkills,
          suggestedBullets: aiResumeDraft.suggestedBullets.length > 0 ? aiResumeDraft.suggestedBullets : tailoredResume.suggestedBullets,
          matchScore: aiResumeDraft.matchScore || tailoredResume.matchScore,
        };

        coverLetter = await generateCoverLetterWithAI({
          profile: studentProfile,
          job,
          tailoredResume,
        });

        const aiReview = await reviewTailoredResumeForJobWithAI({
          profile: studentProfile,
          job,
          tailoredResume,
          coverLetter,
        });

        applyReview = {
          ...applyReview,
          ...aiReview,
          missingKeywords: aiReview.missingKeywords.length > 0 ? aiReview.missingKeywords : applyReview.missingKeywords,
          improvementTips: aiReview.improvementTips.length > 0 ? aiReview.improvementTips : applyReview.improvementTips,
          suggestedBullets: aiReview.suggestedBullets.length > 0 ? aiReview.suggestedBullets : applyReview.suggestedBullets,
        };
      } catch (error) {
        console.error('Gemini apply package error, using fallback:', error);
      }
    }

    const isReadyToApply = applyReview.readiness === 'ready'
      || (applyReview.atsScore >= APPLY_READY_ATS_SCORE && applyReview.matchScore >= APPLY_READY_MATCH_SCORE);

    setSelectedJob(job);
    setApplicationResumeDraft(tailoredResume);
    saveResumeVersion({ draft: tailoredResume, job, source: 'one-click-apply-review' });
    setApplicationDraft({
      job,
      coverLetter,
      tailoredResume,
      applyReview,
      isReadyToApply,
      resumeText: resumeDraftToText(tailoredResume),
    });
    setIsGeneratingApplyPackage(false);
  };

  const handleConfirmApply = () => {
    if (!applicationDraft) return;
    const newApp = createApplicationRecord(applicationDraft.job, studentProfile, applicationDraft.tailoredResume);
    newApp.coverLetter = applicationDraft.coverLetter;
    saveResumeVersion({ draft: applicationDraft.tailoredResume, job: applicationDraft.job, source: 'application-submitted' });
    setApplications([newApp, ...applications]);
    setApplicationDraft(null);
  };

  const handleTailorResume = (job) => {
    setSelectedJob(job);
    setApplicationResumeDraft(tailorResumeForJob(studentProfile, job));
    setBuilderReviewContext(null);
    setActiveSearchTab('builder');
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    if (setSearchQuery) {
      setSearchQuery(val);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const q = localQuery.toLowerCase();
    const matchesQuery = !q || job.title.toLowerCase().includes(q) ||
                         job.company.toLowerCase().includes(q) ||
                         job.location.toLowerCase().includes(q) ||
                         job.tags.some(tag => tag.toLowerCase().includes(q));

    const matchesType = filterJobTypes.length === 0 || filterJobTypes.includes(job.type);
    const matchesLocType = filterLocationTypes.length === 0 || filterLocationTypes.includes(job.locationType);
    const matchesLocText = !filterLocationText || job.location.toLowerCase().includes(filterLocationText.toLowerCase());
    const matchesExp = filterExperience === 'Any Experience' || job.experience === filterExperience;
    const matchesIncome = job.salaryMin >= filterIncome;

    return matchesQuery && matchesType && matchesLocType && matchesLocText && matchesExp && matchesIncome;
  }).sort((a, b) => {
    const aInsight = aiJobInsights[`${a.company}::${a.title}`];
    const bInsight = aiJobInsights[`${b.company}::${b.title}`];
    return (bInsight?.matchScore || b.match || 0) - (aInsight?.matchScore || a.match || 0);
  });

  const tabClass = (active) =>
    `px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-white elev-sm text-primary' : 'text-slate-500 hover:text-slate-900'}`;

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-8">
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-slate-900 tracking-tight">Opportunities</h2>
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button onClick={() => setActiveSearchTab('listings')} className={tabClass(activeSearchTab === 'listings')}>
              All listings
            </button>
            <button onClick={() => setActiveSearchTab('builder')} className={tabClass(activeSearchTab === 'builder')}>
              Resume builder
            </button>
            <button onClick={() => setActiveSearchTab('intelligence')} className={tabClass(activeSearchTab === 'intelligence')}>
              Resume AI match
            </button>
          </div>
        </div>

        {activeSearchTab === 'listings' && (
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search by role, company, or keywords..."
                value={localQuery}
                onChange={handleSearchChange}
                className="w-full bg-white pl-12 pr-6 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-colors text-slate-900"
              />
            </div>
            <button
              onClick={refreshAiMatches}
              disabled={!aiAvailable || isRefreshingMatches}
              className="px-5 bg-white rounded-xl border border-slate-300 flex items-center gap-2 font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              {isRefreshingMatches ? 'Refreshing...' : 'AI match'}
            </button>
            <button className="px-5 bg-white rounded-xl border border-slate-300 flex items-center gap-2 font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined">tune</span>
              Filters
            </button>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {activeSearchTab === 'listings' ? (
          <motion.div
            key="listings"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="grid grid-cols-12 gap-8"
          >
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {filteredJobs.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
                  No jobs match your search query. Try another keyword!
                </div>
              ) : (
                filteredJobs.map((job, i) => {
                  const isApplied = applications.some(
                    app => app.company.toLowerCase() === job.company.toLowerCase() &&
                           app.role.toLowerCase() === job.title.toLowerCase()
                  );
                  return (
                    <JobCard
                      key={i}
                      job={{
                        ...job,
                        match: aiJobInsights[`${job.company}::${job.title}`]?.matchScore || job.match,
                        shortDescription: aiJobInsights[`${job.company}::${job.title}`]?.reason || job.shortDescription,
                        missingSkills: aiJobInsights[`${job.company}::${job.title}`]?.skillGap ? [aiJobInsights[`${job.company}::${job.title}`].skillGap] : job.missingSkills,
                      }}
                      applied={isApplied}
                      onApply={() => handleApply(job)}
                      onTailorResume={handleTailorResume}
                    />
                  );
                })
              )}

              <div className="flex justify-center pt-6">
                <button className="px-6 py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors">
                  Load more results
                </button>
              </div>
            </div>

            <aside className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 elev-sm sticky top-28">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">tune</span>
                    Filters
                  </h3>
                  <button className="text-xs font-semibold text-slate-400 hover:text-primary transition-colors">Clear all</button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-3">Job type</h4>
                    <div className="space-y-2.5">
                      {['Full-time', 'Part-time', 'Internship', 'Contract'].map(type => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filterJobTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) setFilterJobTypes([...filterJobTypes, type]);
                              else setFilterJobTypes(filterJobTypes.filter(t => t !== type));
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                          />
                          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-3">Location type</h4>
                    <div className="space-y-2.5">
                      {['Remote', 'Hybrid', 'On-site'].map(type => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filterLocationTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) setFilterLocationTypes([...filterLocationTypes, type]);
                              else setFilterLocationTypes(filterLocationTypes.filter(t => t !== type));
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                          />
                          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-3">Location</h4>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">location_on</span>
                      <input
                        type="text"
                        placeholder="e.g. San Francisco, CA"
                        value={filterLocationText}
                        onChange={(e) => setFilterLocationText(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-colors text-slate-700 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-3">Experience level</h4>
                    <select
                      value={filterExperience}
                      onChange={(e) => setFilterExperience(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-colors text-slate-700 cursor-pointer"
                    >
                      <option>Any Experience</option>
                      <option>Entry Level (0-2 years)</option>
                      <option>Mid Level (3-5 years)</option>
                      <option>Senior (5+ years)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-semibold text-slate-700">Min income range</h4>
                      <span className="text-xs font-semibold text-primary bg-primary-soft px-2 py-0.5 rounded-md">${Math.round(filterIncome / 1000)}k+</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="250000"
                      step="10000"
                      value={filterIncome}
                      onChange={(e) => setFilterIncome(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
                      <span>$0</span>
                      <span>$250k+</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFilterJobTypes([]);
                    setFilterLocationTypes([]);
                    setFilterLocationText('');
                    setFilterExperience('Any Experience');
                    setFilterIncome(0);
                  }}
                  className="w-full mt-8 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-hover transition-colors"
                >
                  Clear filters
                </button>
              </div>
            </aside>
          </motion.div>
        ) : activeSearchTab === 'builder' ? (
          <motion.div
            key="builder"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
          >
            <ResumeBuilder
              targetJob={selectedJob}
              setActiveTab={setActiveTab}
              reviewContext={builderReviewContext}
              onUseForApply={(draft) => {
                if (!selectedJob) return;
                setApplicationResumeDraft(draft);
                setApplicationDraft({
                  job: selectedJob,
                  coverLetter: generateCoverLetter(studentProfile, selectedJob, draft),
                  tailoredResume: draft,
                });
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="intelligence"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
          >
            <ResumeIntelligence />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {applicationDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 elev-md"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">One-click apply</p>
                  <h3 className="mt-2 text-2xl font-headline font-semibold text-slate-900">
                    {applicationDraft.job.title} at {applicationDraft.job.company}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Review the tailored resume package and cover letter before sending your application.
                  </p>
                </div>
                <button onClick={() => setApplicationDraft(null)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <Card className="p-5">
                  <h4 className="text-sm font-semibold text-slate-900">Application Package</h4>
                  <div className="mt-4 space-y-4 text-sm text-slate-600">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Candidate</p>
                      <p className="mt-1 text-slate-900">{studentProfile.name || 'Student Candidate'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Resume Match</p>
                      <p className="mt-1 text-slate-900">
                        {applicationDraft.applyReview?.matchScore || applicationDraft.tailoredResume.matchScore}% job match
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">ATS Readiness</p>
                      <p className="mt-1 text-slate-900">{applicationDraft.applyReview?.atsScore || 0}/100 ATS score</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Generation Mode</p>
                      <p className="mt-1 text-slate-900">{aiAvailable ? 'Gemini-assisted package' : 'Fallback local package'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Apply Decision</p>
                      <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        applicationDraft.isReadyToApply ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'
                      }`}>
                        {applicationDraft.isReadyToApply ? 'Ready to apply' : 'Improve before applying'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Skills Submitted</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {applicationDraft.tailoredResume.skills.slice(0, 8).map((skill) => (
                          <span key={skill} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{skill}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Role-specific summary</p>
                      <p className="mt-1 leading-6 text-slate-700">{applicationDraft.tailoredResume.summary}</p>
                    </div>
                    {applicationDraft.tailoredResume.missingSkills?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Skill gaps to close next</p>
                        <p className="mt-1 leading-6 text-slate-700">{applicationDraft.tailoredResume.missingSkills.join(', ')}</p>
                      </div>
                    )}
                    {applicationDraft.applyReview?.reasoning && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">AI Verdict</p>
                        <p className="mt-1 leading-6 text-slate-700">{applicationDraft.applyReview.reasoning}</p>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {applicationDraft.isReadyToApply ? 'AI Cover Letter' : 'AI Improvement Plan'}
                    </h4>
                    <Button variant="ghost" size="sm" onClick={() => setActiveSearchTab('builder')}>
                      Edit Resume
                    </Button>
                  </div>
                  {applicationDraft.isReadyToApply ? (
                    <textarea
                      value={applicationDraft.coverLetter}
                      onChange={(e) => setApplicationDraft({ ...applicationDraft, coverLetter: e.target.value })}
                      rows="12"
                      className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="rounded-xl border border-warning/20 bg-warning-soft/50 p-4">
                        <p className="text-sm font-semibold text-warning">This role is not ready for one-click apply yet.</p>
                        <p className="mt-1 text-sm leading-6 text-slate-700">
                          The tailored resume still looks weak for this job after optimization. Improve the package first, then apply.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Missing keywords</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(applicationDraft.applyReview?.missingKeywords || []).map((keyword) => (
                            <span key={keyword} className="rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">{keyword}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Requirements to strengthen</p>
                        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                          {(applicationDraft.applyReview?.requirementsToImprove || []).map((item) => <li key={item}>- {item}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Recommended improvements</p>
                        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                          {(applicationDraft.applyReview?.improvementTips || []).map((item) => <li key={item}>- {item}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-400">Suggested bullet angles</p>
                        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                          {(applicationDraft.applyReview?.suggestedBullets || []).map((item) => <li key={item}>- {item}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button variant="secondary" onClick={() => openResumePrintPreview(applicationDraft.tailoredResume)}>
                  Download Tailored Resume
                </Button>
                <Button variant="secondary" onClick={() => {
                  setSelectedJob(applicationDraft.job);
                  setBuilderReviewContext(applicationDraft.applyReview || null);
                  setActiveSearchTab('builder');
                }}>
                  Tailor Resume More
                </Button>
                <Button onClick={handleConfirmApply} disabled={!applicationDraft.isReadyToApply}>
                  Submit Application
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
