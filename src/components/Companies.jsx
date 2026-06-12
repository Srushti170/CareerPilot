import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';

const DEFAULT_PARTNERS = [
  { name: 'Google', tier: 'Platinum', hiring: 45, visits: 3, logo: 'https://ui-avatars.com/api/?name=Google&background=random' },
  { name: 'Microsoft', tier: 'Platinum', hiring: 32, visits: 2, logo: 'https://ui-avatars.com/api/?name=Microsoft&background=random' },
  { name: 'Amazon', tier: 'Gold', hiring: 58, visits: 4, logo: 'https://ui-avatars.com/api/?name=Amazon&background=random' },
  { name: 'Meta', tier: 'Gold', hiring: 12, visits: 1, logo: 'https://ui-avatars.com/api/?name=Meta&background=random' },
  { name: 'Stripe', tier: 'Silver', hiring: 5, visits: 1, logo: 'https://ui-avatars.com/api/?name=Stripe&background=random' },
];

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-colors text-sm";

export function Companies() {
  const [partners, setPartners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  const [name, setName] = useState('');
  const [tier, setTier] = useState('Platinum');
  const [hiring, setHiring] = useState(1);
  const [visits, setVisits] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem('careerpilot_companies');
    if (stored) {
      setPartners(JSON.parse(stored));
    } else {
      localStorage.setItem('careerpilot_companies', JSON.stringify(DEFAULT_PARTNERS));
      setPartners(DEFAULT_PARTNERS);
    }
  }, []);

  const handleOpenOnboard = () => {
    setEditingPartner(null);
    setName('');
    setTier('Platinum');
    setHiring(1);
    setVisits(1);
    setShowModal(true);
  };

  const handleOpenManage = (partner) => {
    setEditingPartner(partner);
    setName(partner.name);
    setTier(partner.tier);
    setHiring(partner.hiring);
    setVisits(partner.visits);
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name) return;

    let updated;
    if (editingPartner) {
      updated = partners.map(p => p.name === editingPartner.name ? { ...p, name, tier, hiring: Number(hiring), visits: Number(visits) } : p);
    } else {
      const newPartner = {
        name,
        tier,
        hiring: Number(hiring),
        visits: Number(visits),
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      };
      updated = [newPartner, ...partners];
    }

    localStorage.setItem('careerpilot_companies', JSON.stringify(updated));
    setPartners(updated);
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!editingPartner) return;
    const updated = partners.filter(p => p.name !== editingPartner.name);
    localStorage.setItem('careerpilot_companies', JSON.stringify(updated));
    setPartners(updated);
    setShowModal(false);
  };

  const tierTone = (t) =>
    t === 'Platinum' ? 'bg-primary-soft text-primary'
      : t === 'Gold' ? 'bg-warning-soft text-warning'
      : 'bg-slate-100 text-slate-500';

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-slate-900 tracking-tight">Corporate partners</h2>
          <p className="text-slate-500 mt-1 text-sm">Manage relationships and intake statistics with registered companies.</p>
        </div>
        <button
          onClick={handleOpenOnboard}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm transition-colors hover:bg-primary-hover focus:outline-none focus:ring-4 focus:ring-primary/10"
        >
          <span className="material-symbols-outlined text-base">add_business</span>
          Onboard partner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {partners.length === 0 ? (
          <p className="text-center col-span-3 py-12 text-slate-400 text-sm">No partners registered. Click "Onboard partner" to begin.</p>
        ) : (
          partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover className="p-0 overflow-hidden">
                <div className="h-20 bg-slate-50 border-b border-slate-200 relative">
                  <div className="absolute -bottom-7 left-6 w-14 h-14 rounded-xl bg-white border border-slate-200 elev-sm flex items-center justify-center p-2.5">
                    <img src={partner.logo} alt={partner.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${tierTone(partner.tier)}`}>
                      {partner.tier}
                    </span>
                  </div>
                </div>
                <div className="p-6 pt-10">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">{partner.name}</h3>
                  <div className="flex justify-between items-center py-3 border-y border-slate-100 mb-5">
                    <div className="text-center">
                      <p className="text-[11px] font-medium text-slate-500 mb-1">Open roles</p>
                      <p className="text-lg font-headline font-bold text-slate-900">{partner.hiring}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-100"></div>
                    <div className="text-center">
                      <p className="text-[11px] font-medium text-slate-500 mb-1">Visits</p>
                      <p className="text-lg font-headline font-bold text-slate-900">{partner.visits}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenManage(partner)}
                    className="w-full py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                  >
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
          <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-md rounded-2xl border border-slate-200 elev-md p-8 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-headline font-semibold text-slate-900">
                  {editingPartner ? 'Manage relationship' : 'Onboard partner'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Company name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={editingPartner !== null} placeholder="e.g. Google" className={`${inputClass} disabled:bg-slate-50`} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Tier</label>
                    <select value={tier} onChange={(e) => setTier(e.target.value)} className={inputClass}>
                      <option>Platinum</option>
                      <option>Gold</option>
                      <option>Silver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Open roles</label>
                    <input type="number" value={hiring} onChange={(e) => setHiring(e.target.value)} required min="0" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Visits</label>
                    <input type="number" value={visits} onChange={(e) => setVisits(e.target.value)} required min="0" className={inputClass} />
                  </div>
                </div>

                <div className="pt-4 flex justify-between gap-3 border-t border-slate-100 mt-2">
                  <div>
                    {editingPartner && (
                      <button type="button" onClick={handleDelete} className="px-4 py-2.5 bg-danger-soft text-danger text-sm font-semibold rounded-xl hover:opacity-80 transition-opacity">
                        Offboard partner
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-xl hover:bg-primary-hover transition-colors">
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
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary text-on-primary elev-md flex items-center justify-center hover:bg-primary-hover transition-colors z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </motion.button>
    </div>
  );
}
