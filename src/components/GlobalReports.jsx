import { useEffect, useMemo, useState } from 'react';
import { MetricCard } from './MetricCard';
import { Card } from './ui/Card';
import { getDepartmentBreakdown, getPlacementStats, getStoredStudents, mergeStudentRecords } from '../lib/adminData';
import { integrationApi } from '../lib/backendSync';

export function GlobalReports() {
  const [students, setStudents] = useState(() => getStoredStudents());
  const [applications, setApplications] = useState(() => {
    const stored = localStorage.getItem('careerpilot_applications');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    const syncStudents = () => setStudents(getStoredStudents());
    const syncApplications = () => {
      const stored = localStorage.getItem('careerpilot_applications');
      setApplications(stored ? JSON.parse(stored) : []);
    };
    window.addEventListener('careerpilot:students-updated', syncStudents);
    window.addEventListener('careerpilot:storage-updated:careerpilot_applications', syncApplications);
    return () => {
      window.removeEventListener('careerpilot:students-updated', syncStudents);
      window.removeEventListener('careerpilot:storage-updated:careerpilot_applications', syncApplications);
    };
  }, []);

  const mergedStudents = useMemo(() => mergeStudentRecords(students, applications), [applications, students]);
  const departmentBreakdown = useMemo(() => getDepartmentBreakdown(mergedStudents), [mergedStudents]);
  const placementStats = useMemo(() => getPlacementStats(mergedStudents), [mergedStudents]);

  const topPlacement = mergedStudents.find((student) => student.placement.startsWith('Placed'));

  const handleDownloadMasterReport = async () => {
    try {
      const report = await integrationApi.generateReport({
        title: 'CareerPilot Master Placement Report',
        lines: departmentBreakdown.flatMap((dept) => [
          `${dept.name}: ${dept.placed}/${dept.total} placed`,
          `Placement rate: ${dept.rate}%`,
          `Average CGPA: ${dept.avgCgpa}`,
          '',
        ]),
      });
      window.open(`/reports/${report.fileName}`, '_blank');
    } catch (error) {
      console.error('PDF report generation error, falling back to CSV:', error);
      const headers = ['Branch', 'Placed Students', 'Placement Rate', 'Average CGPA'];
      const rows = departmentBreakdown.map((dept) => [dept.name, `${dept.placed}/${dept.total}`, `${dept.rate}%`, dept.avgCgpa]);
      const csvContent = `data:text/csv;charset=utf-8,${[headers.join(','), ...rows.map((entry) => entry.map((value) => `"${value}"`).join(','))].join('\n')}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'careerpilot_master_placement_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-12 pt-24">
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-headline font-semibold tracking-tight text-slate-900 md:text-3xl">Global reports</h2>
          <p className="mt-1 text-sm text-slate-500">Monitor university-wide hiring KPIs, department conversion, and student placement outcomes.</p>
        </div>
        <button onClick={handleDownloadMasterReport} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/10">
          <span className="material-symbols-outlined text-base">cloud_download</span>
          Download master report
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <MetricCard label="Average campus CGPA" value={placementStats.averageCgpa} subtext="Derived from shared registry" color="primary" icon="payments" />
        <MetricCard label="Top confirmed placement" value={topPlacement?.placement.replace('Placed ', '') || 'No accepted offer yet'} subtext={topPlacement?.name || 'Awaiting accepted applications'} color="secondary" icon="military_tech" />
        <MetricCard label="Overall placement rate" value={`${placementStats.placementRate}%`} progress={placementStats.placementRate} color="tertiary" icon="query_stats" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-base font-semibold text-slate-900">Department-wise breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-[11px] font-semibold text-slate-500">Branch</th>
                  <th className="pb-3 text-center text-[11px] font-semibold text-slate-500">Placed</th>
                  <th className="pb-3 text-center text-[11px] font-semibold text-slate-500">Rate</th>
                  <th className="pb-3 text-right text-[11px] font-semibold text-slate-500">Avg CGPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departmentBreakdown.map((dept) => (
                  <tr key={dept.name} className="transition-colors hover:bg-slate-50">
                    <td className="py-3.5 text-sm font-medium text-slate-900">{dept.name}</td>
                    <td className="py-3.5 text-center text-sm text-slate-600">{dept.placed}/{dept.total}</td>
                    <td className="py-3.5 text-center text-sm font-semibold text-primary">{dept.rate}%</td>
                    <td className="py-3.5 text-right text-sm font-semibold text-slate-900">{dept.avgCgpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h4 className="mb-4 font-semibold text-slate-900">Placement milestones</h4>
            <div className="space-y-4">
              {[
                { title: 'Placed Students', count: `${placementStats.placed} Students`, desc: 'Accepted final offers', icon: 'auto_awesome', color: 'text-warning' },
                { title: 'In Process', count: `${placementStats.inProcess} Students`, desc: 'Interviewing or offer stage', icon: 'workspace_premium', color: 'text-primary' },
                { title: 'Open Pipeline', count: `${placementStats.open} Students`, desc: 'Still seeking first conversion', icon: 'work', color: 'text-slate-400' },
              ].map((milestone) => (
                <div key={milestone.title} className="flex gap-3.5">
                  <span className={`material-symbols-outlined mt-0.5 text-xl ${milestone.color}`}>{milestone.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{milestone.title} ({milestone.count})</p>
                    <p className="text-xs text-slate-500">{milestone.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
