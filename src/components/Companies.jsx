import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';
import { getStoredCompanies, normalizeCompany, saveStoredCompanies } from '../lib/adminData';
import { getStoredJobs } from '../lib/recruiterData';

const inputClass = 'w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/10';

function getTierTone(tier) {
  if (tier === 'Platinum') return 'bg-primary-soft text-primary';
  if (tier === 'Gold') return 'bg-warning-soft text-warning';
  return 'bg-slate-100 text-slate-500';
}

function getStatusTone(status) {
  if (status === 'Approved') return 'bg-success-soft text-success';
  if (status === 'Rejected') return 'bg-danger-soft text-danger';
  return 'bg-warning-soft text-warning';
}

export function Companies() {
  const [partners, setPartners] = useState(() => getStoredCompanies());
  const [jobs, setJobs] = useState(() => getStoredJobs());
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [draft, setDraft] = useState({
    name: '',
    tier: 'Platinum',
    visits: 1,
    status: 'Pending',
    documents: '',
    note: '',
  });

  useEffect(() => {
    const syncCompanies = () => setPartners(getStoredCompanies());
    const syncJobs = () => setJobs(getStoredJobs());
    window.addEventListener('careerpilot:companies-updated', syncCompanies);
    window.addEventListener('careerpilot:jobs-updated', syncJobs);
    return () => {
      window.removeEventListener('careerpilot:companies-updated', syncCompanies);
      window.removeEventListener('careerpilot:jobs-updated', syncJobs);
    };
  }, []);

  const enrichedPartners = useMemo(
    () => partners.map((partner) => ({
      ...partner,
      hiring: jobs.filter((job) => job.company.toLowerCase() === partner.name.toLowerCase() && ['Active', 'Closing Soon'].includes(job.status)).length,
    })),
    [jobs, partners]
  );

  const handleOpenOnboard = () => {
    setEditingPartner(null);
    setDraft({ name: '', tier: 'Platinum', visits: 1, status: 'Pending', documents: '', note: '' });
    setShowModal(true);
  };

  const handleOpenManage = (partner) => {
    setEditingPartner(partner);
    setDraft({
      name: partner.name,
      tier: partner.tier,
      visits: partner.visits,
      status: partner.status,
      documents: partner.documents,
      note: partner.note,
    });
    setShowModal(true);
  };

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSave = (event) => {
    event.preventDefault();
    if (!draft.name) return;

    const nextPartner = normalizeCompany({
      ...editingPartner,
      ...draft,
      id: editingPartner?.id || `${Date.now()}`,
    });

    const updated = editingPartner
      ? partners.map((partner) => (partner.id === editingPartner.id ? nextPartner : partner))
      : [nextPartner, ...partners];

    setPartners(saveStoredCompanies(updated));
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!editingPartner) return;
    setPartners(saveStoredCompanies(partners.filter((partner) => partner.id !== editingPartner.id)));
    setShowModal(false);
  };

  const handleQuickStatus = (partner, status) => {
    setPartners(saveStoredCompanies(
      partners.map((item) => (item.id === partner.id ? { ...item, status } : item))
    ));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-8 pb-12 pt-24">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-headline font-semibold tracking-tight text-slate-900 md:text-3xl">Corporate partners</h2>
          <p className="mt-1 text-sm text-slate-500">Approve recruiter registrations, verify documents, and track active hiring partners.</p>
        </div>
        <button
          onClick={handleOpenOnboard}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/10"
        >
          <span className="material-symbols-outlined text-base">add_business</span>
          Onboard partner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {enrichedPartners.length === 0 ? (
          <p className="col-span-3 py-12 text-center text-sm text-slate-400">No partners registered. Click "Onboard partner" to begin.</p>
        ) : (
          enrichedPartners.map((partner, index) => (
            <motion.div key={partner.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card hover className="overflow-hidden p-0">
                <div className="relative h-24 border-b border-slate-200 bg-slate-50">
                  <div className="absolute -bottom-7 left-6 flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                    <img src={partner.logo} alt={partner.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="absolute right-4 top-4 flex gap-2">
                    <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${getTierTone(partner.tier)}`}>{partner.tier}</span>
                    <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(partner.status)}`}>{partner.status}</span>
                  </div>
                </div>

                <div className="p-6 pt-10">
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{partner.name}</h3>
                  <p className="mb-4 text-sm leading-6 text-slate-500">{partner.documents}</p>
                  <div className="mb-5 flex items-center justify-between border-y border-slate-100 py-3">
                    <div className="text-center">
                      <p className="mb-1 text-[11px] font-medium text-slate-500">Open roles</p>
                      <p className="text-lg font-headline font-bold text-slate-900">{partner.hiring}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="text-center">
                      <p className="mb-1 text-[11px] font-medium text-slate-500">Visits</p>
                      <p className="text-lg font-headline font-bold text-slate-900">{partner.visits}</p>
                    </div>
                  </div>

                  <div className="mb-4 flex gap-2">
                    <button onClick={() => handleQuickStatus(partner, 'Approved')} className="flex-1 rounded-lg bg-success-soft px-3 py-2 text-xs font-semibold text-success transition-opacity hover:opacity-80">
                      Approve
                    </button>
                    <button onClick={() => handleQuickStatus(partner, 'Rejected')} className="flex-1 rounded-lg bg-danger-soft px-3 py-2 text-xs font-semibold text-danger transition-opacity hover:opacity-80">
                      Reject
                    </button>
                  </div>

                  <button onClick={() => handleOpenManage(partner)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                    Manage relationship
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-headline font-semibold text-slate-900">{editingPartner ? 'Manage relationship' : 'Onboard partner'}</h3>
                <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Company name</label>
                  <input value={draft.name} onChange={(e) => updateDraft('name', e.target.value)} required disabled={editingPartner !== null} className={`${inputClass} disabled:bg-slate-50`} placeholder="e.g. Google" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Tier</label>
                    <select value={draft.tier} onChange={(e) => updateDraft('tier', e.target.value)} className={inputClass}>
                      <option>Platinum</option>
                      <option>Gold</option>
                      <option>Silver</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Visits</label>
                    <input type="number" value={draft.visits} onChange={(e) => updateDraft('visits', e.target.value)} required min="0" className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">Status</label>
                    <select value={draft.status} onChange={(e) => updateDraft('status', e.target.value)} className={inputClass}>
                      <option>Pending</option>
                      <option>Approved</option>
                      <option>Rejected</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Documents</label>
                  <textarea value={draft.documents} onChange={(e) => updateDraft('documents', e.target.value)} rows="3" className={`${inputClass} resize-none`} placeholder="GST, PAN, company registration notes..." />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">Admin note</label>
                  <textarea value={draft.note} onChange={(e) => updateDraft('note', e.target.value)} rows="3" className={`${inputClass} resize-none`} placeholder="Relationship notes, risks, or next steps..." />
                </div>

                <div className="mt-2 flex justify-between gap-3 border-t border-slate-100 pt-4">
                  <div>
                    {editingPartner && (
                      <button type="button" onClick={handleDelete} className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm font-semibold text-danger transition-opacity hover:opacity-80">
                        Offboard partner
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                      Cancel
                    </button>
                    <button type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover">
                      {editingPartner ? 'Save changes' : 'Onboard partner'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpenOnboard}
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-xl transition-colors hover:bg-primary-hover"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </motion.button>
    </div>
  );
}
