import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export function JobCard({ job, onApply, applied, ...rest }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const data = job || rest;
  const company = data.company || '';
  const title = data.title || '';
  const location = data.location || '';
  const match = data.match || 0;
  const type = data.type || 'Full-time';
  const locationType = data.locationType || 'On-site';
  const salary = data.salary || '';
  const missingSkills = data.missingSkills || [];
  const logo = data.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(company)}&background=random`;

  const shortDescription = data.shortDescription || "Join our fast-paced engineering team to build next-generation software products.";
  const description = data.description || [
    "Strong foundation in Computer Science concepts, such as data structures, algorithms, and basic software architecture",
    "Experience or coursework in Software Development and Programming",
    "Understanding of Back-End Web Development, including APIs",
    "Knowledge of Object-Oriented Programming (OOP) principles"
  ];

  const matchLabel = match >= 90 ? 'Strong match' : match >= 75 ? 'Good match' : 'Fair match';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 elev-sm transition-colors duration-200 hover:border-slate-300"
    >
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <img src={logo} alt={company} className="h-8 w-8 object-contain" />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-base font-semibold text-slate-900">{title}</h4>
            <p className="mt-0.5 truncate text-sm text-slate-500">{company} • {location}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">{type}</Badge>
          <Badge tone="neutral">{locationType}</Badge>
          {salary && <Badge tone="brand">{salary}</Badge>}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm leading-6 text-slate-600">
          {shortDescription}
        </p>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pb-2 pt-4">
                <p className="mb-3 text-sm font-semibold text-slate-900">Required qualifications</p>
                <ul className="mb-6 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                  {description.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>

                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-headline font-bold tracking-tight text-slate-900">
                        {match}<span className="ml-0.5 text-base text-slate-400">%</span>
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">Profile match</p>
                    </div>
                    <Badge tone={match >= 75 ? 'brand' : 'neutral'}>{matchLabel}</Badge>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${match}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>

                {missingSkills.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400">Missing skills</p>
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.map(skill => (
                        <Badge key={skill} tone="danger">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          {isExpanded ? 'Show less' : 'View full description'}
          <span className="material-symbols-outlined text-[16px]">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      <div className="mt-4 flex gap-3">
        <Button
          variant={applied ? 'secondary' : 'primary'}
          size="lg"
          onClick={applied ? undefined : onApply}
          disabled={applied}
          className="flex-1"
        >
          {applied ? (
            <>
              <span className="material-symbols-outlined text-base">check_circle</span>
              Applied
            </>
          ) : "Apply now"}
        </Button>
        <Button variant="secondary" size="lg">
          <span className="material-symbols-outlined text-base">auto_awesome</span>
          Tailor resume
        </Button>
      </div>
    </motion.div>
  );
}
