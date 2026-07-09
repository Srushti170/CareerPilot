import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { getStudentProfile, saveStudentProfile } from '../lib/studentProfile';
import { buildResumeDraft, tailorResumeForJob } from '../lib/resumeTools';
import { isCareerAiAvailable, tailorResumeWithAI } from '../lib/aiCareerTools';
import { openResumePrintPreview, saveResumeVersion } from '../lib/resumeVersions';

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

function ResumePreviewContent({ currentDraft, studentProfile, onUseForApply, targetJob, handleSave }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h3 className="text-lg font-semibold text-slate-900">Resume Preview</h3>
        <p className="mt-1 text-sm text-slate-500">
          {currentDraft.targetCompany ? `Prepared for ${currentDraft.targetRole} at ${currentDraft.targetCompany}` : 'General-purpose ATS-friendly student resume'}
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div>
          <h4 className="text-2xl font-headline font-bold tracking-tight text-slate-900">{currentDraft.candidateName}</h4>
          <p className="mt-1 text-sm text-slate-500">{currentDraft.headline}</p>
          <p className="mt-1 text-xs text-slate-400">{studentProfile.email} {studentProfile.phone ? `- ${studentProfile.phone}` : ''}</p>
        </div>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Summary</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{currentDraft.summary}</p>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Skills</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {currentDraft.skills.map((skill) => (
              <span key={skill} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">{skill}</span>
            ))}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Education</p>
          <div className="mt-2 rounded-xl bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">{currentDraft.education.university}</p>
            <p className="text-sm text-slate-600">{currentDraft.education.degree}</p>
            <p className="mt-1 text-xs text-slate-500">
              {currentDraft.education.graduation} {currentDraft.education.gpa ? `- GPA: ${currentDraft.education.gpa}` : ''}
            </p>
            {currentDraft.education.coursework && (
              <p className="mt-2 text-xs leading-5 text-slate-500">{currentDraft.education.coursework}</p>
            )}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Experience</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
            {currentDraft.experienceBullets.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Projects</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
            {currentDraft.projectBullets.map((item) => <li key={item}>- {item}</li>)}
          </ul>
        </section>

        {onUseForApply && targetJob && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-primary/20 bg-primary-soft p-4">
            <p className="text-sm font-semibold text-primary">Application-ready resume prepared</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              Save the latest edits, then launch one-click apply with this tailored resume package.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => onUseForApply(currentDraft)}>Use For One-Click Apply</Button>
              <Button variant="secondary" onClick={handleSave}>Save Before Applying</Button>
            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}

export function ResumeBuilder({ targetJob = null, onUseForApply, reviewContext = null, renderAnalysis }) {
  const studentProfile = getStudentProfile();
  const aiAvailable = isCareerAiAvailable();
  const tailoredDraft = useMemo(() => tailorResumeForJob(studentProfile, targetJob), [studentProfile, targetJob]);

  const [summary, setSummary] = useState(tailoredDraft.tailoredSummary || tailoredDraft.summary);
  const [skillsText, setSkillsText] = useState((tailoredDraft.skills || []).join(', '));
  const [experienceText, setExperienceText] = useState((tailoredDraft.experienceBullets || []).join('\n'));
  const [projectsText, setProjectsText] = useState((tailoredDraft.projectBullets || []).join('\n'));
  const [coursework, setCoursework] = useState(studentProfile.coursework || '');
  const [savedMessage, setSavedMessage] = useState('');
  const [isAiTailoring, setIsAiTailoring] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    setSummary(tailoredDraft.tailoredSummary || tailoredDraft.summary);
    setSkillsText((tailoredDraft.skills || []).join(', '));
    setExperienceText((tailoredDraft.experienceBullets || []).join('\n'));
    setProjectsText((tailoredDraft.projectBullets || []).join('\n'));
    setCoursework(studentProfile.coursework || '');
  }, [studentProfile.coursework, tailoredDraft]);

  const parsedSkills = useMemo(
    () => skillsText.split(',').map((skill) => skill.trim()).filter(Boolean),
    [skillsText]
  );

  const currentDraft = useMemo(() => ({
    ...buildResumeDraft(studentProfile, targetJob),
    summary,
    skills: parsedSkills,
    experienceBullets: experienceText.split('\n').map((line) => line.trim()).filter(Boolean),
    projectBullets: projectsText.split('\n').map((line) => line.trim()).filter(Boolean),
    education: {
      university: studentProfile.university || 'University',
      degree: studentProfile.degree || studentProfile.branch || 'Degree / Major',
      graduation: studentProfile.graduation || 'Graduation Year',
      gpa: studentProfile.gpa || '',
      coursework,
    },
    targetRole: targetJob?.title || studentProfile.degree || studentProfile.branch || 'Target Role',
    targetCompany: targetJob?.company || '',
    missingSkills: tailoredDraft.missingSkills || [],
    suggestedBullets: tailoredDraft.suggestedBullets || [],
    matchScore: tailoredDraft.matchScore || 70,
  }), [coursework, experienceText, parsedSkills, projectsText, studentProfile, summary, targetJob, tailoredDraft]);

  const handleSave = () => {
    saveStudentProfile({
      ...studentProfile,
      summary,
      skills: parsedSkills,
      experience: experienceText,
      projects: projectsText,
      coursework,
      onboardingComplete: true,
    });
    saveResumeVersion({ draft: currentDraft, job: targetJob, source: 'resume-builder' });
    setSavedMessage('Resume sections saved to your student profile.');
    window.setTimeout(() => setSavedMessage(''), 2500);
  };

  const handleExport = () => {
    saveResumeVersion({ draft: currentDraft, job: targetJob, source: 'resume-export' });
    openResumePrintPreview(currentDraft);
  };

  const handleAiTailor = async () => {
    if (!targetJob || !aiAvailable || isAiTailoring) return;
    setIsAiTailoring(true);

    try {
      const aiDraft = await tailorResumeWithAI({
        profile: studentProfile,
        job: targetJob,
        currentDraft,
      });

      if (aiDraft.tailoredSummary) {
        setSummary(aiDraft.tailoredSummary);
      }
      if (aiDraft.skills.length > 0) {
        setSkillsText(aiDraft.skills.join(', '));
      }
      if (aiDraft.experienceBullets.length > 0) {
        setExperienceText(aiDraft.experienceBullets.join('\n'));
      }
      if (aiDraft.projectBullets.length > 0) {
        setProjectsText(aiDraft.projectBullets.join('\n'));
      }
      setSavedMessage('Gemini tailored your resume draft for this role.');
      window.setTimeout(() => setSavedMessage(''), 2500);
    } catch (error) {
      console.error('Gemini tailoring error, keeping fallback draft:', error);
      setSavedMessage('AI tailoring was unavailable, so the fallback tailored draft is still active.');
      window.setTimeout(() => setSavedMessage(''), 3000);
    }

    setIsAiTailoring(false);
  };

  const editorContent = (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Core Sections</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Professional Summary</label>
            <textarea rows="5" value={summary} onChange={(e) => setSummary(e.target.value)} className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Skills</label>
            <input value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className={inputClass} placeholder="React, Node.js, SQL, AWS" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Experience Bullets</label>
            <textarea rows="6" value={experienceText} onChange={(e) => setExperienceText(e.target.value)} className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Project Bullets</label>
            <textarea rows="6" value={projectsText} onChange={(e) => setProjectsText(e.target.value)} className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Relevant Coursework</label>
            <input value={coursework} onChange={(e) => setCoursework(e.target.value)} className={inputClass} placeholder="Algorithms, DBMS, Operating Systems..." />
          </div>
        </div>
      </Card>

      {targetJob && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900">Tailoring Insights</h3>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Apply guidance</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                The one-click apply flow will now re-check this draft with AI before submission. If the ATS fit is still low, CareerPilot will stop the application and show improvement recommendations instead of applying blindly.
              </p>
            </div>
            {reviewContext && (
              <div className="rounded-xl border border-warning/20 bg-warning-soft/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-warning">Priority fixes before apply</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {(reviewContext.improvementTips || []).map((item) => <li key={item}>- {item}</li>)}
                </ul>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Recommended Keywords</p>
              <div className="flex flex-wrap gap-2">
                {currentDraft.jobKeywords.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{keyword}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Missing Skills To Address Carefully</p>
              <div className="flex flex-wrap gap-2">
                {currentDraft.missingSkills.length === 0 && (
                  <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">No major gaps flagged</span>
                )}
                {currentDraft.missingSkills.map((skill) => (
                  <span key={skill} className="rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">{skill}</span>
                ))}
                {(reviewContext?.missingKeywords || []).map((skill) => (
                  <span key={`review-${skill}`} className="rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">{skill}</span>
                ))}
              </div>
            </div>
            {reviewContext?.requirementsToImprove?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Requirements To Strengthen</p>
                <ul className="space-y-2 text-sm leading-6 text-slate-600">
                  {reviewContext.requirementsToImprove.map((item) => <li key={item}>- {item}</li>)}
                </ul>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Suggested Bullet Angles</p>
              <ul className="space-y-2 text-sm leading-6 text-slate-600">
                {currentDraft.suggestedBullets.map((bullet) => <li key={bullet}>- {bullet}</li>)}
                {(reviewContext?.suggestedBullets || []).map((bullet) => <li key={`review-bullet-${bullet}`}>- {bullet}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-[linear-gradient(135deg,#ffffff_0%,#f6fbfa_55%,#eaf6f3_100%)] dark:bg-[linear-gradient(135deg,#1e293b_0%,#0f172a_100%)] p-6 elev-sm md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Resume Builder</p>
          <h2 className="mt-2 text-3xl font-headline font-bold tracking-tight text-slate-900 dark:text-white">
            {targetJob ? `Tailor for ${targetJob.title} at ${targetJob.company}` : 'Build your ATS-ready resume'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Save resume sections once, tailor them to a job in seconds, and keep your application package ready for one-click apply.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {targetJob && (
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              Match score: {currentDraft.matchScore}%
            </span>
          )}
          {targetJob && (
            <Button variant="secondary" onClick={handleAiTailor} disabled={!aiAvailable || isAiTailoring}>
              {isAiTailoring ? 'Tailoring...' : 'AI Tailor Draft'}
            </Button>
          )}
          <Button variant="secondary" onClick={() => setIsPreviewOpen(true)}>Resume Preview</Button>
          <Button variant="secondary" onClick={handleExport}>Download PDF</Button>
          <Button onClick={handleSave}>Save Resume</Button>
        </div>
      </header>

      {savedMessage && (
        <div className="rounded-xl border border-success/20 bg-success-soft px-4 py-3 text-sm font-medium text-success">
          {savedMessage}
        </div>
      )}

      {renderAnalysis ? (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.82fr)]">
          <div className="min-w-0">{editorContent}</div>
          <aside className="min-w-0 xl:sticky xl:top-28 xl:self-start">{renderAnalysis(currentDraft)}</aside>
        </div>
      ) : editorContent}

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white elev-md"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">Resume Preview</p>
                <h3 className="mt-1 text-xl font-headline font-semibold text-slate-900">Inspect your final resume before exporting</h3>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-5">
              <ResumePreviewContent
                currentDraft={currentDraft}
                studentProfile={studentProfile}
                onUseForApply={onUseForApply}
                targetJob={targetJob}
                handleSave={handleSave}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
