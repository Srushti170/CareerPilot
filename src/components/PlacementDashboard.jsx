import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, MetricCard } from './MetricCard';
import { getDepartmentBreakdown, getPlacementStats, getStoredAnnouncements, getStoredCompanies, getStoredStudents, mergeStudentRecords, normalizeCompany, saveStoredAnnouncements, saveStoredCompanies } from '../lib/adminData';
import { getStoredJobs } from '../lib/recruiterData';

export function PlacementDashboard({ applications = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [companies, setCompanies] = useState(() => getStoredCompanies());
  const [students, setStudents] = useState(() => getStoredStudents());
  const [jobs, setJobs] = useState(() => getStoredJobs());
  const [announcements, setAnnouncements] = useState(() => getStoredAnnouncements());
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [draft, setDraft] = useState({
    companyName: '',
    tier: 'Platinum',
    visits: 1,
    documents: '',
  });
  const [announcementDraft, setAnnouncementDraft] = useState({
    title: '',
    message: '',
    audience: 'All Students',
  });

  useEffect(() => {
    const syncCompanies = () => setCompanies(getStoredCompanies());
    const syncStudents = () => setStudents(getStoredStudents());
    const syncJobs = () => setJobs(getStoredJobs());
    const syncAnnouncements = () => setAnnouncements(getStoredAnnouncements());

    window.addEventListener('careerpilot:companies-updated', syncCompanies);
    window.addEventListener('careerpilot:students-updated', syncStudents);
    window.addEventListener('careerpilot:jobs-updated', syncJobs);
    window.addEventListener('careerpilot:announcements-updated', syncAnnouncements);

    return () => {
      window.removeEventListener('careerpilot:companies-updated', syncCompanies);
      window.removeEventListener('careerpilot:students-updated', syncStudents);
      window.removeEventListener('careerpilot:jobs-updated', syncJobs);
      window.removeEventListener('careerpilot:announcements-updated', syncAnnouncements);
    };
  }, []);

  const mergedStudents = useMemo(() => mergeStudentRecords(students, applications), [applications, students]);
  const placementStats = useMemo(() => getPlacementStats(mergedStudents), [mergedStudents]);
  const departmentBreakdown = useMemo(() => getDepartmentBreakdown(mergedStudents), [mergedStudents]);

  const placements = useMemo(
    () => mergedStudents.filter((student) => student.placement.startsWith('Placed')).slice(0, 6),
    [mergedStudents]
  );

  const visits = useMemo(
    () =>
      companies
        .filter((company) => company.status !== 'Rejected')
        .map((company) => ({
          name: company.name,
          date: `${company.visits} campus visit${company.visits === 1 ? '' : 's'} planned`,
          roles: jobs.filter((job) => job.company.toLowerCase() === company.name.toLowerCase()).map((job) => job.title).slice(0, 2).join(', ') || 'General intake',
          status: company.status === 'Approved' ? 'Confirmed' : 'Pending',
          logo: company.logo,
        }))
        .slice(0, 4),
    [companies, jobs]
  );

  const handleExportCSV = () => {
    const headers = ['Student Name', 'Role', 'Branch', 'CGPA', 'Status'];
    const rows = mergedStudents.map((student) => [student.name, student.role, student.branch, student.cgpa, student.placement]);
    const csvContent = `data:text/csv;charset=utf-8,${[headers.join(','), ...rows.map((entry) => entry.map((value) => `"${value}"`).join(','))].join('\n')}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'careerpilot_placement_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegisterCompany = (event) => {
    event.preventDefault();
    if (!draft.companyName) return;

    const newPartner = normalizeCompany({
      id: `${Date.now()}`,
      name: draft.companyName,
      tier: draft.tier,
      visits: Number(draft.visits),
      status: 'Pending',
      documents: draft.documents || 'Awaiting verification documents',
      note: 'Added from admin placement dashboard',
    });

    setCompanies(saveStoredCompanies([newPartner, ...companies]));
    setDraft({ companyName: '', tier: 'Platinum', visits: 1, documents: '' });
    setShowModal(false);
  };

  const handleCreateAnnouncement = (event) => {
    event.preventDefault();
    if (!announcementDraft.title || !announcementDraft.message) return;

    setAnnouncements(saveStoredAnnouncements([
      {
        id: `${Date.now()}`,
        title: announcementDraft.title,
        message: announcementDraft.message,
        audience: announcementDraft.audience,
        createdAt: new Date().toISOString(),
      },
      ...announcements,
    ]));
    setAnnouncementDraft({ title: '', message: '', audience: 'All Students' });
    setShowAnnouncementModal(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-8 pb-12 pt-24">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h3 className="mb-2 text-3xl font-headline font-extrabold tracking-tight text-on-surface">Performance Analytics</h3>
          <p className="font-medium text-on-surface-variant opacity-80">Live overview of students, recruiter approvals, and placement conversion.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleExportCSV} className="flex items-center gap-2 rounded-xl bg-surface-container-highest px-6 py-3 text-xs font-bold text-primary transition-colors hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-sm">ios_share</span>
            Export Placement Report
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-6 py-3 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[0.98]">
            <span className="material-symbols-outlined text-sm">add</span>
            Register New Company
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Companies Registered" value={companies.length.toString()} subtext={`${companies.filter((company) => company.status === 'Pending').length} pending approval`} color="primary" icon="domain" />
        <MetricCard label="Students Placed" value={placementStats.placed.toString()} subtext={`${placementStats.inProcess} in-process`} color="secondary" icon="person_check" />
        <MetricCard label="Placement Percentage" value={`${placementStats.placementRate}%`} progress={placementStats.placementRate} color="tertiary" icon="analytics" />
        <MetricCard label="Average CGPA" value={placementStats.averageCgpa} subtext={`${jobs.filter((job) => ['Active', 'Closing Soon'].includes(job.status)).length} active jobs`} color="primary" icon="payments" />
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 lg:col-span-7">
          <div className="mb-8 flex items-center justify-between">
            <h5 className="text-xl font-headline font-bold">Upcoming Company Visits</h5>
            <button className="text-sm font-bold text-primary hover:underline">View Calendar</button>
          </div>
          <div className="space-y-6">
            {visits.map((visit, index) => (
              <div key={`${visit.name}-${index}`} className="group flex items-center gap-6 transition-transform hover:translate-x-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container p-2">
                  <img src={visit.logo} className="h-full w-full object-contain" alt={visit.name} />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-start justify-between">
                    <h6 className="font-bold text-on-surface">{visit.name}</h6>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${visit.status === 'Confirmed' ? 'bg-primary-container/10 text-primary' : 'bg-tertiary-container/10 text-tertiary'}`}>{visit.status}</span>
                  </div>
                  <div className="flex gap-4 text-xs font-medium text-on-surface-variant">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> {visit.date}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">school</span> {visit.roles}</span>
                  </div>
                </div>
                <button className="rounded-lg p-2 transition-colors hover:bg-surface-container-low">
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 lg:col-span-5">
          <div className="mb-8 flex items-center justify-between">
            <h5 className="text-xl font-headline font-bold">Branch Placement Health</h5>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Live by registry</div>
          </div>
          <div className="space-y-5">
            {departmentBreakdown.slice(0, 5).map((dept) => (
              <div key={dept.name}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{dept.name}</span>
                  <span className="text-xs font-semibold text-primary">{dept.rate}% placed</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${dept.rate}%` }}></div>
                </div>
                <p className="mt-2 text-xs text-slate-500">{dept.placed}/{dept.total} students placed · Avg CGPA {dept.avgCgpa}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h4 className="text-lg font-headline font-semibold text-slate-900">Placement announcements</h4>
              <p className="mt-1 text-sm text-slate-500">Push updates to students by audience and keep campus communication centralized.</p>
            </div>
            <button onClick={() => setShowAnnouncementModal(true)} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover">
              New announcement
            </button>
          </div>
          <div className="space-y-4">
            {announcements.slice(0, 4).map((announcement) => (
              <div key={announcement.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h5 className="font-semibold text-slate-900">{announcement.title}</h5>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold text-primary">{announcement.audience}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{announcement.message}</p>
                <p className="mt-3 text-xs text-slate-400">{new Date(announcement.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <section className="mb-12 overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest">
        <div className="flex items-center justify-between p-8">
          <h5 className="text-xl font-headline font-bold">Recent Placements</h5>
          <button className="rounded-lg p-2 transition-colors hover:bg-surface-container">
            <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-[12px] font-bold uppercase tracking-widest text-on-surface-variant">
                <th className="px-8 py-4">Student Name</th>
                <th className="px-8 py-4">Role</th>
                <th className="px-8 py-4">Branch</th>
                <th className="px-8 py-4 text-right">CGPA</th>
                <th className="px-8 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {placements.map((student) => (
                <tr key={student.id} className="transition-colors hover:bg-surface-container-low/30">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-xs font-bold">{student.initial}</div>
                      <span className="font-bold text-on-surface">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5"><span className="font-medium text-on-surface-variant">{student.role}</span></td>
                  <td className="px-8 py-5 text-sm text-on-surface-variant">{student.branch}</td>
                  <td className="px-8 py-5 text-right font-bold text-primary">{student.cgpa}</td>
                  <td className="px-8 py-5">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary"></span>
                      <span className="text-sm font-bold text-primary">{student.placement}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md space-y-6 rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-800">Register New Company</h3>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleRegisterCompany} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">Company Name</label>
                  <input type="text" value={draft.companyName} onChange={(e) => setDraft((current) => ({ ...current, companyName: e.target.value }))} required placeholder="e.g. Google India" className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">Tier</label>
                    <select value={draft.tier} onChange={(e) => setDraft((current) => ({ ...current, tier: e.target.value }))} className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <option>Platinum</option>
                      <option>Gold</option>
                      <option>Silver</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">Visits</label>
                    <input type="number" value={draft.visits} onChange={(e) => setDraft((current) => ({ ...current, visits: e.target.value }))} required min="1" className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">Verification notes</label>
                  <textarea value={draft.documents} onChange={(e) => setDraft((current) => ({ ...current, documents: e.target.value }))} rows="3" className="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="GST, PAN, SPOC verification status..." />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="rounded-xl bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
                    Register Company
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg space-y-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-800">Post Announcement</h3>
                <button onClick={() => setShowAnnouncementModal(false)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">Title</label>
                  <input type="text" value={announcementDraft.title} onChange={(e) => setAnnouncementDraft((current) => ({ ...current, title: e.target.value }))} required className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Drive update, prep week, deadline reminder..." />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">Audience</label>
                  <select value={announcementDraft.audience} onChange={(e) => setAnnouncementDraft((current) => ({ ...current, audience: e.target.value }))} className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20">
                    <option>All Students</option>
                    <option>Computer Science</option>
                    <option>Information Technology</option>
                    <option>Electronics</option>
                    <option>2026 Batch</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-700">Message</label>
                  <textarea value={announcementDraft.message} onChange={(e) => setAnnouncementDraft((current) => ({ ...current, message: e.target.value }))} rows="5" required className="w-full resize-none rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Share eligibility, deadlines, or prep instructions..." />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowAnnouncementModal(false)} className="rounded-xl bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]">
                    Publish Announcement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl transition-transform hover:shadow-primary/30"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </motion.button>
    </div>
  );
}
