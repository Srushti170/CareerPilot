import { motion } from 'motion/react';
import { Card } from './MetricCard';

export function Companies() {
  const partners = [
    { name: 'Google', tier: 'Platinum', hiring: 45, visits: 3, logo: 'https://ui-avatars.com/api/?name=Google&background=random' },
    { name: 'Microsoft', tier: 'Platinum', hiring: 32, visits: 2, logo: 'https://ui-avatars.com/api/?name=Microsoft&background=random' },
    { name: 'Amazon', tier: 'Gold', hiring: 58, visits: 4, logo: 'https://ui-avatars.com/api/?name=Amazon&background=random' },
    { name: 'Meta', tier: 'Gold', hiring: 12, visits: 1, logo: 'https://ui-avatars.com/api/?name=Meta&background=random' },
    { name: 'Stripe', tier: 'Silver', hiring: 5, visits: 1, logo: 'https://ui-avatars.com/api/?name=Stripe&background=random' },
  ];

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tighter">Corporate Partners</h2>
          <p className="text-slate-500 mt-1 font-medium">Manage relationships with 142 registered companies.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
          <span className="material-symbols-outlined">add_business</span>
          Onboard Partner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {partners.map((partner, index) => (
          <motion.div
            key={partner.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
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
                <button className="w-full py-3 bg-surface-container-low text-on-surface font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all">
                  Manage Relationship
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
