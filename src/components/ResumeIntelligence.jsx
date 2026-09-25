import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { getStudentProfile } from '../lib/studentProfile';
import { analyzeResumeWithAI, isCareerAiAvailable } from '../lib/aiCareerTools';
import { setScopedJson } from '../lib/userScopedStorage';

export function ResumeIntelligence({ targetJob = null, resumeTextOverride = '', embedded = false }) {
  const studentProfile = getStudentProfile();
  const aiAvailable = isCareerAiAvailable();
  const targetJobDescription = useMemo(() => {
    if (!targetJob) return '';

    return [
      `${targetJob.title || ''} at ${targetJob.company || ''}`.trim(),
      targetJob.shortDescription || targetJob.description || '',
      targetJob.requirements?.length ? `Requirements: ${targetJob.requirements.join(', ')}` : '',
      targetJob.tags?.length ? `Skills: ${targetJob.tags.join(', ')}` : '',
      targetJob.missingSkills?.length ? `Priority keywords: ${targetJob.missingSkills.join(', ')}` : '',
      targetJob.location ? `Location: ${targetJob.location}` : '',
    ].filter(Boolean).join('\n');
  }, [targetJob]);

  const defaultResumeText = useMemo(() => {
    const sections = [
      studentProfile.name,
      studentProfile.email,
      studentProfile.university,
      studentProfile.degree || studentProfile.branch,
      studentProfile.gpa ? `GPA: ${studentProfile.gpa}` : '',
      studentProfile.skills.length ? `Skills: ${studentProfile.skills.join(', ')}` : '',
      studentProfile.projects ? `Projects: ${studentProfile.projects}` : '',
      studentProfile.experience ? `Experience: ${studentProfile.experience}` : '',
      studentProfile.summary ? `Summary: ${studentProfile.summary}` : '',
    ].filter(Boolean);

    return sections.join('\n');
  }, [studentProfile]);

  const jobDescription = targetJobDescription;
  const resumeText = resumeTextOverride || defaultResumeText;
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const lastAnalyzedSignatureRef = useRef('');
  const activeRequestRef = useRef(0);

  const analysisSignature = useMemo(
    () => `${jobDescription.trim()}::${resumeText.trim()}`,
    [jobDescription, resumeText]
  );

  const handleAnalyze = async (force = false) => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      setAnalysis(null);
      setIsAnalyzing(false);
      setError(null);
      return;
    }

    if (!force && lastAnalyzedSignatureRef.current === analysisSignature && !error) {
      return;
    }

    lastAnalyzedSignatureRef.current = analysisSignature;
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;
    setIsAnalyzing(true);
    setError(null);

    if (aiAvailable) {
      try {
        const aiAnalysis = await analyzeResumeWithAI({
          jobDescription,
          resumeText,
          studentProfile,
        });

        if (activeRequestRef.current === requestId) {
          setScopedJson('careerpilot_latest_resume_analysis', aiAnalysis);
          setAnalysis(aiAnalysis);
          setIsAnalyzing(false);
        }
        return;
      } catch (err) {
        console.error('Gemini ATS analysis error:', err);
        if (activeRequestRef.current === requestId) {
          setError('AI analysis is currently unavailable. Please check your Gemini API configuration or try again later.');
          setIsAnalyzing(false);
        }
        return;
      }
    }

    if (activeRequestRef.current === requestId) {
      setError('AI analysis is currently unavailable. Please check your Gemini API configuration or try again later.');
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!analysisSignature || !jobDescription.trim() || !resumeText.trim()) {
      setAnalysis(null);
      return undefined;
    }

    const analyzeTimer = window.setTimeout(() => {
      handleAnalyze();
    }, 900);

    return () => window.clearTimeout(analyzeTimer);
  }, [analysisSignature]);

  return (
    <div className={embedded ? 'space-y-6' : 'mx-auto max-w-7xl space-y-10 px-8 pb-12 pt-24'}>
      {embedded && (
        <header className="rounded-2xl border border-outline-variant bg-white p-6 elev-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Resume AI Match</p>
          <h2 className="mt-2 text-2xl font-headline font-bold tracking-tight text-slate-900">
            AI analysis panel
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            ATS score, JD match, missing keywords, strengths, and recommendations update from the selected job and current resume draft.
          </p>
        </header>
      )}

      <section className={embedded ? 'grid grid-cols-1 gap-3 items-start' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'}>
        <div className="rounded-xl border border-slate-200 bg-white p-5 elev-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <span className="material-symbols-outlined">work</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Connected job description</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">
                {targetJob ? `${targetJob.title} at ${targetJob.company}` : 'Select a job to start matching'}
              </h3>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">
                {jobDescription || 'Resume AI Match will automatically use the target job selected in Resume Studio.'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 elev-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <span className="material-symbols-outlined">description</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Connected resume draft</p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">
                Latest tailored draft from Resume Builder
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {resumeText ? `${resumeText.split(/\s+/).filter(Boolean).length} words synced from the editor.` : 'Start editing your resume to generate analysis.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning-soft p-6 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-4xl text-warning mb-2">error</span>
          <p className="text-sm font-semibold text-slate-900">{error}</p>
          <button onClick={() => handleAnalyze(true)} className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-[1.02]">
            Retry Analysis
          </button>
        </div>
      ) : isAnalyzing ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-semibold text-slate-900">Analyzing resume fit...</p>
        </div>
      ) : !analysis ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-12 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">article</span>
          <p className="text-sm font-semibold text-slate-900">Awaiting Analysis</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">Select a job and edit your resume to generate an AI-powered match score and improvement tips.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Analysis Snapshot</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">Fit signals</h3>
            </div>
            <section className={embedded ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-6'}>
              <div className={`${embedded ? 'p-6' : 'md:col-span-1 p-8'} rounded-xl border border-slate-200 bg-white elev-sm flex flex-col items-center justify-center text-center`}>
                <div className={`${embedded ? 'h-32 w-32' : 'w-44 h-44'} relative flex items-center justify-center`}>
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-slate-100" cx={embedded ? '64' : '88'} cy={embedded ? '64' : '88'} fill="transparent" r={embedded ? '54' : '76'} stroke="currentColor" strokeWidth="12"></circle>
                    <circle
                      className="text-primary"
                      cx={embedded ? '64' : '88'}
                      cy={embedded ? '64' : '88'}
                      fill="transparent"
                      r={embedded ? '54' : '76'}
                      stroke="currentColor"
                      strokeDasharray={embedded ? '339.3' : '477.5'}
                      strokeDashoffset={(embedded ? 339.3 : 477.5) - ((analysis.atsScore ?? 0) / 100) * (embedded ? 339.3 : 477.5)}
                      strokeWidth="12"
                      strokeLinecap="round"
                    ></circle>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className={`${embedded ? 'text-4xl' : 'text-5xl'} font-headline font-bold text-slate-900 tracking-tight`}>{analysis.atsScore ?? 0}</span>
                    <span className="text-[11px] font-medium text-slate-400">ATS score</span>
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900">{analysis.matchScore}% JD match</h3>
                <p className="text-sm text-slate-500 mt-1">
                  This score reflects AI-assisted ATS and recruiter-style review.
                </p>
              </div>

              <div className={`${embedded ? 'p-6' : 'p-8'} rounded-xl border border-slate-200 bg-white elev-sm flex flex-col`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-slate-900">Missing keywords</h3>
                  <span className="material-symbols-outlined text-warning">warning</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(analysis.missingKeywords || []).map(kw => (
                    <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 bg-warning-soft text-warning rounded-md text-xs font-semibold">
                      {kw} <span className="material-symbols-outlined text-[14px]">add</span>
                    </span>
                  ))}
                  {(analysis.missingKeywords || []).length === 0 && (
                    <p className="text-sm text-slate-500">No missing keywords detected. Great job!</p>
                  )}
                </div>
                <p className="mt-auto pt-6 text-xs text-slate-400">Add only skills and terms you can genuinely support in interviews.</p>
              </div>

              <div className={`${embedded ? 'p-6' : 'p-8'} rounded-xl border border-slate-200 bg-white elev-sm flex flex-col`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-slate-900">Resume strengths</h3>
                  <span className="material-symbols-outlined text-primary">verified</span>
                </div>
                <ul className="space-y-4">
                  {(analysis.strengths || []).map((s, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <div>
                        <span className="block font-semibold text-sm text-slate-900">{s.title}</span>
                        <span className="text-xs text-slate-500 leading-relaxed">{s.desc}</span>
                      </div>
                    </li>
                  ))}
                  {(analysis.strengths || []).length === 0 && (
                    <p className="text-sm text-slate-500">No specific strengths detected.</p>
                  )}
                </ul>
              </div>
            </section>
          </div>

          {(analysis?.improvementTips?.length > 0 || analysis?.suggestedBullets?.length > 0) && (
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Improvement Plan</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Next edits to make</h3>
              </div>
              <section className="grid grid-cols-1 gap-4">
                <div className={`${embedded ? 'p-6' : 'p-8'} rounded-xl bg-white border border-slate-200 border-l-4 border-l-primary elev-sm`}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-warning-soft rounded-lg flex items-center justify-center text-warning">
                      <span className="material-symbols-outlined">priority_high</span>
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Critical improvements</h3>
                  </div>
                  <div className="space-y-4">
                    {Array.from({
                      length: Math.max(
                        (analysis.improvementTips || []).length,
                        (analysis.suggestedBullets || []).length
                      ),
                    }).map((_, index) => {
                      const problem = analysis.improvementTips?.[index];
                      const suggestedBullet = analysis.suggestedBullets?.[index];

                      if (!problem && !suggestedBullet) return null;

                      return (
                        <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <div className="space-y-4">
                            {problem && (
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-warning">Problem</p>
                                <p className="mt-1 text-sm font-medium leading-6 text-slate-800">{problem}</p>
                              </div>
                            )}

                            {suggestedBullet && (
                              <div className="rounded-xl bg-primary p-4 text-white">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">Suggested rewrite / bullet</p>
                                  <button
                                    type="button"
                                    onClick={() => navigator.clipboard?.writeText(suggestedBullet)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                    Copy
                                  </button>
                                </div>
                                <p className="font-mono text-xs font-medium leading-relaxed text-white">"{suggestedBullet}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {!embedded && aiAvailable && (
        <div className="fixed bottom-8 right-8 bg-white rounded-full py-2.5 px-5 elev-md flex items-center gap-2.5 border border-slate-200 z-50">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-primary">Gemini ATS active</span>
        </div>
      )}
    </div>
  );
}
