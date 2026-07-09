import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { getStudentProfile } from '../lib/studentProfile';
import { analyzeResumeWithAI, isCareerAiAvailable } from '../lib/aiCareerTools';

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
  const lastAnalyzedSignatureRef = useRef('');
  const activeRequestRef = useRef(0);

  const analysisSignature = useMemo(
    () => `${jobDescription.trim()}::${resumeText.trim()}`,
    [jobDescription, resumeText]
  );

  const extractKeywords = (text) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9+#./\s-]/g, ' ');
    const tokens = cleaned
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);

    const phrases = [];
    for (let i = 0; i < tokens.length - 1; i += 1) {
      phrases.push(`${tokens[i]} ${tokens[i + 1]}`);
    }

    return Array.from(new Set([...tokens, ...phrases]));
  };

  const buildFallbackAnalysis = () => {
    const jdKeywords = extractKeywords(jobDescription);
    const resumeKeywords = new Set(extractKeywords(resumeText));

    const curatedKeywords = Array.from(new Set(
      jdKeywords.filter((keyword) => (
        /react|node|python|java|sql|aws|docker|kubernetes|system design|machine learning|data|analytics|api|testing|ci\/cd|agile|typescript|javascript|frontend|backend|cloud|git|leadership/.test(keyword)
      ))
    )).slice(0, 12);

    const sourceKeywords = curatedKeywords.length > 0 ? curatedKeywords : jdKeywords.slice(0, 12);
    const matchedKeywords = sourceKeywords.filter((keyword) => resumeKeywords.has(keyword));
    const missingKeywords = sourceKeywords.filter((keyword) => !resumeKeywords.has(keyword));

    const matchScore = sourceKeywords.length === 0
      ? 50
      : Math.round((matchedKeywords.length / sourceKeywords.length) * 100);

    const structureSignals = [
      /skills/i.test(resumeText),
      /project/i.test(resumeText),
      /experience/i.test(resumeText),
      /education|university|college/i.test(resumeText),
      /\d+%|\d+\+|\d+\s*(users|projects|features|internships|months|years)/i.test(resumeText),
    ].filter(Boolean).length;

    const atsScore = Math.max(35, Math.min(98, Math.round(matchScore * 0.65 + structureSignals * 7)));

    const strengths = [
      structureSignals >= 4 ? { title: 'Strong section coverage', desc: 'Your resume includes most of the sections ATS systems expect.' } : null,
      matchedKeywords.length >= 4 ? { title: 'Relevant keyword alignment', desc: 'Your resume already reflects several terms from the target job description.' } : null,
      /\d+%|\d+\+|\d+\s*(users|projects|features|internships|months|years)/i.test(resumeText) ? { title: 'Quantified evidence', desc: 'You are using measurable outcomes, which improves recruiter confidence.' } : null,
    ].filter(Boolean);

    const improvementTips = [
      missingKeywords.length > 0 ? `Add these missing keywords naturally where truthful: ${missingKeywords.slice(0, 5).join(', ')}.` : 'Keyword alignment is already strong for this job description.',
      !/experience/i.test(resumeText) ? 'Create a dedicated Experience section so ATS parsers can classify work history more reliably.' : 'Keep your Experience section focused on impact, ownership, and outcomes.',
      !/project/i.test(resumeText) ? 'Add 1-2 relevant projects to show hands-on evidence for the target role.' : 'Tighten project bullets to highlight tools, scope, and measurable outcomes.',
      !/\d+%|\d+\+|\d+\s*(users|projects|features|internships|months|years)/i.test(resumeText) ? 'Add numbers to your bullets: percentages, user counts, delivery time, or scale.' : 'You already use metrics well; keep them close to the strongest achievements.',
      studentProfile.socials?.LinkedIn?.connected ? 'LinkedIn is connected, so keep job titles and dates consistent between resume and profile.' : 'Connect LinkedIn and mirror your headline with the resume for a cleaner recruiter experience.',
    ];

    const suggestedBullets = missingKeywords.slice(0, 2).map((keyword, index) => (
      `Built ${index === 0 ? 'production-ready' : 'scalable'} features using ${keyword}, improving delivery speed and strengthening alignment with role expectations.`
    ));

    const nextAnalysis = {
      atsScore,
      matchScore,
      missingKeywords,
      strengths: strengths.length > 0 ? strengths : [
        { title: 'Readable baseline', desc: 'Your resume has enough content to produce an ATS-style analysis.' },
      ],
      improvementTips,
      suggestedBullets: suggestedBullets.length > 0 ? suggestedBullets : [
        'Improved feature delivery by collaborating closely with cross-functional teams and documenting implementation decisions clearly.',
      ],
    };

    return nextAnalysis;
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim() || !resumeText.trim()) {
      setAnalysis(null);
      setIsAnalyzing(false);
      return;
    }

    if (lastAnalyzedSignatureRef.current === analysisSignature) {
      return;
    }

    lastAnalyzedSignatureRef.current = analysisSignature;
    const requestId = activeRequestRef.current + 1;
    activeRequestRef.current = requestId;
    setIsAnalyzing(true);

    if (aiAvailable) {
      try {
        const aiAnalysis = await analyzeResumeWithAI({
          jobDescription,
          resumeText,
          studentProfile,
        });

        const normalizedAnalysis = {
          ...aiAnalysis,
          strengths: aiAnalysis.strengths.length > 0 ? aiAnalysis.strengths : [
            { title: 'Readable baseline', desc: 'Your resume has enough content to produce an ATS-style analysis.' },
          ],
          improvementTips: aiAnalysis.improvementTips.length > 0 ? aiAnalysis.improvementTips : [
            'Tighten your strongest bullets around impact, ownership, and measurable outcomes.',
          ],
          suggestedBullets: aiAnalysis.suggestedBullets.length > 0 ? aiAnalysis.suggestedBullets : [
            'Improved delivery quality by documenting implementation decisions clearly and collaborating closely with teammates.',
          ],
        };

        if (activeRequestRef.current === requestId) {
          localStorage.setItem('careerpilot_latest_resume_analysis', JSON.stringify(normalizedAnalysis));
          setAnalysis(normalizedAnalysis);
          setIsAnalyzing(false);
        }
        return;
      } catch (error) {
        console.error('Gemini ATS analysis error, using fallback:', error);
      }
    }

    const fallbackAnalysis = buildFallbackAnalysis();
    if (activeRequestRef.current === requestId) {
      localStorage.setItem('careerpilot_latest_resume_analysis', JSON.stringify(fallbackAnalysis));
      setAnalysis(fallbackAnalysis);
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
    <div className={embedded ? 'space-y-8' : 'mx-auto max-w-7xl space-y-10 px-8 pb-12 pt-24'}>
      {embedded && (
        <header className="rounded-2xl border border-outline-variant bg-white p-6 elev-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Resume AI Match</p>
          <h2 className="mt-2 text-2xl font-headline font-bold tracking-tight text-slate-900">
            Score the same resume against the selected role
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            The analyzer uses your saved profile and the current target job to surface ATS score, JD match, missing keywords, strengths, and AI recommendations.
          </p>
        </header>
      )}

      <section className={embedded ? 'grid grid-cols-1 gap-4 items-start' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'}>
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

        <div className={`${embedded ? '' : 'lg:col-span-2'} rounded-xl border border-slate-200 bg-slate-50 px-4 py-3`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Analysis status</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {isAnalyzing ? 'Analyzing the latest resume and job match...' : analysis ? 'Analysis is synced with the latest editor state.' : 'Waiting for a selected job and resume draft.'}
              </p>
            </div>
            <span className={`h-3 w-3 rounded-full ${isAnalyzing ? 'animate-pulse bg-warning' : analysis ? 'bg-success' : 'bg-slate-300'}`} />
          </div>
        </div>
      </section>

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
                strokeDashoffset={(embedded ? 339.3 : 477.5) - ((analysis?.atsScore ?? 0) / 100) * (embedded ? 339.3 : 477.5)}
                strokeWidth="12"
                strokeLinecap="round"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={`${embedded ? 'text-4xl' : 'text-5xl'} font-headline font-bold text-slate-900 tracking-tight`}>{analysis?.atsScore ?? 0}</span>
              <span className="text-[11px] font-medium text-slate-400">ATS score</span>
            </div>
          </div>
          <h3 className="mt-6 text-lg font-semibold text-slate-900">{analysis ? `${analysis.matchScore}% JD match` : 'Waiting for sync'}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {analysis ? 'This score reflects AI-assisted ATS and recruiter-style review.' : 'Select a job and edit your resume to generate a real score.'}
          </p>
        </div>

        <div className={`${embedded ? 'p-6' : 'p-8'} rounded-xl border border-slate-200 bg-white elev-sm flex flex-col`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900">Missing keywords</h3>
            <span className="material-symbols-outlined text-warning">warning</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(analysis?.missingKeywords || []).map(kw => (
              <span key={kw} className="inline-flex items-center gap-1 px-2.5 py-1 bg-warning-soft text-warning rounded-md text-xs font-semibold">
                {kw} <span className="material-symbols-outlined text-[14px]">add</span>
              </span>
            ))}
          </div>
          {!analysis && <p className="mt-auto pt-6 text-xs text-slate-400">The analyzer will list job-specific missing keywords here.</p>}
          {analysis && <p className="mt-auto pt-6 text-xs text-slate-400">Add only skills and terms you can genuinely support in interviews.</p>}
        </div>

        <div className={`${embedded ? 'p-6' : 'p-8'} rounded-xl border border-slate-200 bg-white elev-sm flex flex-col`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900">Resume strengths</h3>
            <span className="material-symbols-outlined text-primary">verified</span>
          </div>
          <ul className="space-y-4">
            {(analysis?.strengths || [
              { title: 'Waiting for analysis', desc: 'Once you run the ATS analyzer, we will surface strengths from your actual resume text.' },
            ]).map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <div>
                  <span className="block font-semibold text-sm text-slate-900">{s.title}</span>
                  <span className="text-xs text-slate-500 leading-relaxed">{s.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={embedded ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}>
        <div className={`${embedded ? 'p-6' : 'p-8'} rounded-xl bg-white border border-slate-200 border-l-4 border-l-primary elev-sm`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-warning-soft rounded-lg flex items-center justify-center text-warning">
              <span className="material-symbols-outlined">priority_high</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Critical improvements</h3>
          </div>
          <div className="space-y-2">
            {(analysis?.improvementTips || [
              'Paste a real job description and resume to generate prioritized improvement tips.',
            ]).map((item, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg flex justify-between items-center group hover:bg-slate-100 transition-colors cursor-pointer">
                <span className="text-sm font-medium text-slate-700">{item}</span>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">chevron_right</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`${embedded ? 'p-6' : 'p-8'} rounded-xl bg-white border border-slate-200 elev-sm`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">AI suggested bullets</h3>
          </div>
          <div className="space-y-4">
            {(analysis?.suggestedBullets || [
              'Your suggested rewrite bullets will appear here after analysis.',
            ]).map((bullet, index) => (
              <div key={index} className="relative bg-primary text-white p-6 rounded-xl font-mono text-xs leading-relaxed group shadow-sm">
                <p className="text-white font-medium">"{bullet}"</p>
                <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-md hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100">
                  <span className="material-symbols-outlined text-xs text-white">content_copy</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!embedded && (
        <div className="fixed bottom-8 right-8 bg-white rounded-full py-2.5 px-5 elev-md flex items-center gap-2.5 border border-slate-200 z-50">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-primary">{aiAvailable ? 'Gemini ATS active' : 'Fallback analyzer active'}</span>
        </div>
      )}
    </div>
  );
}
