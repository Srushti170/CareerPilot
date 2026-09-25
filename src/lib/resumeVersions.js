import { resumeDraftToText } from './resumeTools';
import { getScopedJson, setScopedJson } from './userScopedStorage';

const RESUME_VERSIONS_KEY = 'careerpilot_resume_versions';

function readVersions() {
  return getScopedJson(RESUME_VERSIONS_KEY, []);
}

function writeVersions(versions) {
  setScopedJson(RESUME_VERSIONS_KEY, versions);
  return versions;
}

export function getResumeVersions() {
  return readVersions();
}

export function saveResumeVersion({ draft, job = null, source = 'resume-builder' }) {
  const current = readVersions();
  const nextVersion = {
    id: `resume-version-${Date.now()}`,
    createdAt: new Date().toISOString(),
    source,
    jobTitle: job?.title || draft?.targetRole || 'General Resume',
    company: job?.company || draft?.targetCompany || '',
    matchScore: Number(draft?.matchScore || 0),
    draft,
    resumeText: resumeDraftToText(draft),
  };

  const next = [nextVersion, ...current].slice(0, 30);
  return writeVersions(next);
}

export function openResumePrintPreview(draft = {}) {
  const previewWindow = window.open('', '_blank');
  if (!previewWindow) return;

  const education = draft.education || {};
  const targetLine = draft.targetCompany
    ? `Targeting ${draft.targetRole} at ${draft.targetCompany}`
    : draft.targetRole || 'Tailored resume';

  previewWindow.document.write(`
    <html>
      <head>
        <title>${draft.candidateName || 'Candidate'} Resume</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 36px; line-height: 1.5; }
          h1 { margin-bottom: 6px; }
          h2 { margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; font-size: 16px; text-transform: uppercase; }
          .muted { color: #475569; font-size: 13px; }
          ul { padding-left: 18px; }
          li { margin-bottom: 6px; }
          .chips { margin-top: 8px; }
          .chip { display: inline-block; padding: 4px 8px; margin: 0 6px 6px 0; background: #e6f4f1; border-radius: 999px; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${draft.candidateName || 'Candidate'}</h1>
        <div class="muted">${targetLine}</div>
        <div class="muted">${draft.headline || ''}</div>
        <h2>Professional Summary</h2>
        <p>${draft.summary || draft.tailoredSummary || ''}</p>
        <h2>Skills</h2>
        <div class="chips">${(draft.skills || []).map((skill) => `<span class="chip">${skill}</span>`).join('')}</div>
        <h2>Education</h2>
        <p><strong>${education.university || 'University'}</strong> - ${education.degree || 'Degree / Major'}</p>
        <p class="muted">${education.graduation || ''} ${education.gpa ? `| GPA: ${education.gpa}` : ''}</p>
        ${education.coursework ? `<p>${education.coursework}</p>` : ''}
        <h2>Experience</h2>
        <ul>${(draft.experienceBullets || []).map((item) => `<li>${item}</li>`).join('')}</ul>
        <h2>Projects</h2>
        <ul>${(draft.projectBullets || []).map((item) => `<li>${item}</li>`).join('')}</ul>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `);
  previewWindow.document.close();
}
