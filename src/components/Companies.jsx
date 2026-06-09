import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './MetricCard';

const DEFAULT_PARTNERS = [
  { name: 'Google', tier: 'Platinum', hiring: 45, visits: 3, logo: 'https://ui-avatars.com/api/?name=Google&background=random' },
  { name: 'Microsoft', tier: 'Platinum', hiring: 32, visits: 2, logo: 'https://ui-avatars.com/api/?name=Microsoft&background=random' },
  { name: 'Amazon', tier: 'Gold', hiring: 58, visits: 4, logo: 'https://ui-avatars.com/api/?name=Amazon&background=random' },
  { name: 'Meta', tier: 'Gold', hiring: 12, visits: 1, logo: 'https://ui-avatars.com/api/?name=Meta&background=random' },
  { name: 'Stripe', tier: 'Silver', hiring: 5, visits: 1, logo: 'https://ui-avatars.com/api/?name=Stripe&background=random' },
];

export function Companies() {
  const [partners, setPartners] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);

  // Form states
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
      // Edit
      updated = partners.map(p => p.name === editingPartner.name ? { ...p, name, tier, hiring: Number(hiring), visits: Number(visits) } : p);
    } else {
      // New
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

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tighter">Corporate Partners</h2>
          <p className="text-slate-500 mt-1 font-medium">Manage relationships and intake statistics with registered companies.</p>
        </div>
        <button 
          onClick={handleOpenOnboard}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
        >
          <span className="material-symbols-outlined">add_business</span>
          Onboard Partner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {partners.length === 0 ? (
          <p className="text-center col-span-3 py-12 text-slate-400 font-semibold text-sm">No partners registered. Click "Onboard Partner" to begin.</p>
        ) : (
          partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-0 overflow-hidden group hover:border-primary/20 transition-all shadow-hover">
                <div className="h-24 bg-surface-container-low relative">
                  <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center p-3 border border-slate-100 group-hover:scale-110 transition-transform">
                     <img src={partner.logo} alt={partner.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="absolute top-4 right-4">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                       partner.tier === 'Platinum' ? 'bg-indigo-50 text-indigo-600' :
                       partner.tier === 'Gold' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
                     }`}>
                       {partner.tier}
                     </span>
                  </div>
                </div>
                <div className="p-6 pt-12">
                  <h3 className="text-xl font-black text-on-surface mb-4">{partner.name}</h3>
                  <div className="flex justify-between items-center py-3 border-y border-outline-variant/10 mb-6">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Open Roles</p>
                      <p className="text-lg font-black text-on-surface">{partner.hiring}</p>
                    </div>
                    <div className="h-8 w-px bg-outline-variant/10"></div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visits</p>
                      <p className="text-lg font-black text-on-surface">{partner.visits}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenManage(partner)}
                    className="w-full py-3 bg-surface-container-low text-on-surface font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all"
                  >
                    Manage Relationship
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Onboard/Manage Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-800">
                  {editingPartner ? 'Manage Relationship' : 'Onboard Partner'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Company Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={editingPartner !== null}
                    placeholder="e.g. Google"
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium disabled:bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Tier</label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    >
                      <option>Platinum</option>
                      <option>Gold</option>
                      <option>Silver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Open Roles</label>
                    <input 
                      type="number" 
                      value={hiring}
                      onChange={(e) => setHiring(e.target.value)}
                      required
                      min="0"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Visits</label>
                    <input 
                      type="number" 
                      value={visits}
                      onChange={(e) => setVisits(e.target.value)}
                      required
                      min="0"
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between gap-3 border-t border-slate-50 mt-2">
                  <div>
                    {editingPartner && (
                      <button 
                        type="button" 
                        onClick={handleDelete}
                        className="px-4 py-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors"
                      >
                        Offboard Partner
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      {editingPartner ? 'Save Changes' : 'Onboard Partner'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
