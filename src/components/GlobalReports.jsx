import { MetricCard } from './MetricCard';
import { Card } from './ui/Card';

export function GlobalReports() {
  const departments = [
    { name: 'Computer Science', placed: '245/250', rate: '98%', avgPackage: '18.2 LPA' },
    { name: 'Information Technology', placed: '180/190', rate: '94%', avgPackage: '15.4 LPA' },
    { name: 'Electronics & Communication', placed: '192/210', rate: '91%', avgPackage: '12.1 LPA' },
    { name: 'Mechanical Engineering', placed: '110/140', rate: '78%', avgPackage: '8.5 LPA' },
    { name: 'Electrical Engineering', placed: '115/135', rate: '85%', avgPackage: '9.2 LPA' }
  ];

  const handleDownloadMasterReport = () => {
    const headers = ['Branch', 'Placed Students', 'Placement Rate', 'Average Package'];
    const rows = departments.map(d => [d.name, d.placed, d.rate, d.avgPackage]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "careerpilot_master_placement_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pt-24 px-8 pb-12 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-slate-900 tracking-tight">Global reports</h2>
          <p className="text-slate-500 text-sm mt-1">Monitor university-wide hiring KPIs, conversion stats, and department performance.</p>
        </div>
        <button
          onClick={handleDownloadMasterReport}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/10"
        >
          <span className="material-symbols-outlined text-base">cloud_download</span>
          Download master report
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="Average campus offer" value="₹12.4 LPA" subtext="Up 12% vs last year" color="primary" icon="payments" />
        <MetricCard label="Top offer received" value="₹44.0 LPA" subtext="By Microsoft India" color="secondary" icon="military_tech" />
        <MetricCard label="Overall placement rate" value="85%" progress={85} color="tertiary" icon="query_stats" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 elev-sm space-y-6">
          <h3 className="font-semibold text-slate-900 text-base">Department-wise breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-[11px] font-semibold text-slate-500">Branch</th>
                  <th className="pb-3 text-[11px] font-semibold text-slate-500 text-center">Placed</th>
                  <th className="pb-3 text-[11px] font-semibold text-slate-500 text-center">Rate</th>
                  <th className="pb-3 text-[11px] font-semibold text-slate-500 text-right">Avg package</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 text-sm font-medium text-slate-900">{dept.name}</td>
                    <td className="py-3.5 text-sm text-slate-600 text-center">{dept.placed}</td>
                    <td className="py-3.5 text-sm font-semibold text-primary text-center">{dept.rate}</td>
                    <td className="py-3.5 text-sm font-semibold text-slate-900 text-right">{dept.avgPackage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-4">Placement milestones</h4>
            <div className="space-y-4">
              {[
                { title: 'Dream Packages', count: '42 Offers', desc: 'Over ₹25 LPA', icon: 'auto_awesome', color: 'text-warning' },
                { title: 'Super Dream', count: '105 Offers', desc: '₹15 LPA - ₹25 LPA', icon: 'workspace_premium', color: 'text-primary' },
                { title: 'Regular Offers', count: '695 Offers', desc: 'Under ₹15 LPA', icon: 'work', color: 'text-slate-400' }
              ].map((m, idx) => (
                <div key={idx} className="flex gap-3.5">
                  <span className={`material-symbols-outlined ${m.color} text-xl mt-0.5`}>{m.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{m.title} ({m.count})</p>
                    <p className="text-xs text-slate-500">{m.desc}</p>
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
