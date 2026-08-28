import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';
import { cn } from '../lib/utils';
import { buildCandidateFromApplication } from '../lib/recruiterData';
import { getApplicationContact, pushWorkflowNotification, sendWorkflowEmail } from '../lib/workflowActions';

const selectClass = 'w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-medium outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10';

function getStatusClasses(status) {
  if (status === 'Interview') return 'bg-primary-soft text-primary';
  if (status === 'Reviewing') return 'bg-primary-soft text-primary';
  if (status === 'Offered' || status === 'Accepted') return 'bg-success-soft text-success';
  if (status === 'Rejected' || status === 'Declined') return 'bg-danger-soft text-danger';
  return 'bg-slate-100 text-slate-500';
}

export function Candidates({ applications = [], setApplications }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterUni, setFilterUni] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [minScore, setMinScore] = useState('All');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const candidates = useMemo(
    () => applications.map((app) => buildCandidateFromApplication(app)),
    [applications]
  );

  const roles = Array.from(new Set(candidates.map((candidate) => candidate.role).filter(Boolean)));
  const universities = Array.from(new Set(candidates.map((candidate) => candidate.university).filter(Boolean)));

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.company.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterRole !== 'All' && candidate.role !== filterRole) return false;
    if (filterUni !== 'All' && candidate.university !== filterUni) return false;
    if (filterStatus !== 'All' && candidate.status !== filterStatus) return false;
    if (minScore !== 'All' && candidate.match < parseInt(minScore, 10)) return false;

    return true;
  });

  const handleStatusChange = async (id, newStatus) => {
    if (!setApplications) return;
    const targetApplication = applications.find((app) => app.id === id);
    setApplications(applications.map((app) => (app.id === id ? { ...app, status: newStatus } : app)));

    if (targetApplication) {
      pushWorkflowNotification(
        'Application status updated',
        `${targetApplication.company} updated your ${targetApplication.role} application to ${newStatus}.`,
        {
          recipientId: targetApplication.studentId,
          recipientEmail: targetApplication.studentEmail,
          recipientRole: 'student',
          type: 'application_status',
          sourceId: targetApplication.id,
        }
      );
    }

    if (targetApplication && ['Reviewing', 'Interview', 'Offered', 'Accepted', 'Declined', 'Rejected'].includes(newStatus)) {
      await sendWorkflowEmail({
        to: getApplicationContact(targetApplication),
        subject: `Application update: ${targetApplication.role}`,
        body: `Your application for ${targetApplication.role} at ${targetApplication.company} is now marked as ${newStatus}.`,
      });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Candidate Name', 'Target Role', 'University', 'Company', 'Match Score', 'Status'];
    const rows = filteredCandidates.map((candidate) => [candidate.name, candidate.role, candidate.university, candidate.company, `${candidate.match}%`, candidate.status]);
    const csvContent = `data:text/csv;charset=utf-8,${[headers.join(','), ...rows.map((entry) => entry.map((value) => `"${value}"`).join(','))].join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'careerpilot_talent_pool.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-12 pt-24">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-headline font-semibold tracking-tight text-slate-900 md:text-3xl">Unified talent pool</h2>
          <p className="mt-1 text-sm text-slate-500">Review real student applications, resume matches, and status transitions in one recruiter queue.</p>
        </div>
        <div className="flex w-full flex-wrap gap-3 md:w-auto">
          <div className="relative flex-1 md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, role, company, or college..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            {showAdvanced ? 'Hide filters' : 'Filters'}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="grid grid-cols-1 gap-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 md:grid-cols-4"
          >
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">Target role</label>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={selectClass}>
                <option value="All">All roles</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">University</label>
              <select value={filterUni} onChange={(e) => setFilterUni(e.target.value)} className={selectClass}>
                <option value="All">All colleges</option>
                {universities.map((university) => (
                  <option key={university} value={university}>{university}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectClass}>
                <option value="All">All statuses</option>
                <option value="Applied">Applied</option>
                <option value="Reviewing">Shortlisted</option>
                <option value="Interview">Interview</option>
                <option value="Offered">Offered</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">Min match score</label>
              <select value={minScore} onChange={(e) => setMinScore(e.target.value)} className={selectClass}>
                <option value="All">Any score</option>
                <option value="90">90%+</option>
                <option value="80">80%+</option>
                <option value="70">70%+</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total candidates', value: candidates.length.toString(), icon: 'groups' },
          { label: 'Shortlisted', value: candidates.filter((candidate) => candidate.status === 'Reviewing').length.toString(), icon: 'task_alt' },
          { label: 'Top 10% match', value: candidates.filter((candidate) => candidate.match >= 90).length.toString(), icon: 'stars' },
          { label: 'Interviewing', value: candidates.filter((candidate) => candidate.status === 'Interview').length.toString(), icon: 'calendar_month' },
        ].map((metric) => (
          <Card key={metric.label} className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <span className="material-symbols-outlined text-2xl">{metric.icon}</span>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium leading-none text-slate-500">{metric.label}</p>
              <h4 className="text-xl font-headline font-bold leading-none text-slate-900">{metric.value}</h4>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Candidate name</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Applied role</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">University</th>
                <th className="px-8 py-4 text-center text-[11px] font-semibold text-slate-500">Score</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-slate-500">Status / action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-10 text-center text-sm text-slate-400">No candidates match search/filter requirements.</td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => (
                  <tr key={candidate.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <img src={candidate.avatar} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" alt={candidate.name} />
                        <div>
                          <span className="font-semibold text-slate-900">{candidate.name}</span>
                          <p className="text-[11px] text-slate-500">{candidate.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-sm text-slate-600">{candidate.role}</td>
                    <td className="px-8 py-4 text-sm text-slate-600">{candidate.university}</td>
                    <td className="px-8 py-4">
                      <div className="flex items-center justify-center">
                        <div className="rounded-md bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                          {candidate.match}%
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <select
                        value={candidate.status}
                        onChange={(e) => handleStatusChange(candidate.id, e.target.value)}
                        className={cn('rounded-md border-none px-3 py-1.5 text-[11px] font-semibold outline-none focus:ring-4 focus:ring-primary/10', getStatusClasses(candidate.status))}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Reviewing">Shortlisted</option>
                        <option value="Interview">Interview</option>
                        <option value="Offered">Offered</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Declined">Declined</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
