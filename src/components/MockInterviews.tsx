import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './MetricCard';

export function MockInterviews() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const topics = [
    { id: 'algorithms', title: 'Data Structures & Algorithms', icon: 'account_tree', sessions: 12, difficulty: 'Advanced' },
    { id: 'system-design', title: 'System Design', icon: 'hub', sessions: 8, difficulty: 'Intermediate' },
    { id: 'behave', title: 'Behavioral & Leadership', icon: 'psychology', sessions: 5, difficulty: 'Beginner' },
    { id: 'frontend', title: 'Frontend Core (React/JS)', icon: 'terminal', sessions: 15, difficulty: 'Advanced' },
  ];

  return (
    <div className="pt-24 px-8 pb-12 max-w-6xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2 p-1 px-3 bg-primary/10 rounded-full w-fit">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">AI Agent Ready</span>
          </div>
          <h2 className="text-4xl font-black text-on-surface tracking-tighter">Mock Interview Hub</h2>
          <p className="text-slate-500 mt-2 text-lg font-medium">Practice with our AI interviewer and get real-time feedback on your performance.</p>
        </div>
        <button className="px-8 py-4 bg-gradient-to-br from-slate-900 to-black text-white rounded-2xl font-bold flex items-center gap-3 shadow-2xl hover:scale-[1.03] transition-all">
          <span className="material-symbols-outlined">auto_awesome</span>
          Start Random Prep
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topics.map(topic => (
          <Card 
            key={topic.id}
            className={`p-6 cursor-pointer transition-all border-2 ${selectedTopic === topic.id ? 'border-primary shadow-xl shadow-primary/5' : 'border-transparent hover:border-slate-200'}`}
            onClick={() => setSelectedTopic(topic.id)}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${selectedTopic === topic.id ? 'bg-primary text-white' : 'bg-surface-container-low text-slate-400'}`}>
              <span className="material-symbols-outlined text-3xl">{topic.icon}</span>
            </div>
            <h3 className="text-sm font-black text-on-surface mb-2 tracking-tight leading-tight h-10">{topic.title}</h3>
            <div className="flex justify-between items-center mt-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{topic.sessions} Sessions</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                topic.difficulty === 'Advanced' ? 'bg-red-50 text-red-500' : 
                topic.difficulty === 'Intermediate' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'
              }`}>{topic.difficulty}</span>
            </div>
          </Card>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selectedTopic ? (
          <motion.div
            key={selectedTopic}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-12 gap-8 mt-12"
          >
            <div className="col-span-12 lg:col-span-8">
              <Card className="p-0 overflow-hidden relative min-h-[400px] flex flex-col justify-center items-center bg-slate-50 border-dashed border-2 border-slate-200">
                <div className="flex flex-col items-center gap-6 text-center max-w-sm">
                   <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center p-4">
                      <span className="material-symbols-outlined text-6xl text-primary animate-pulse-slow">smart_toy</span>
                   </div>
                   <h4 className="text-2xl font-black text-on-surface leading-tight">Ready to begin your {topics.find(t => t.id === selectedTopic)?.title} session?</h4>
                   <p className="text-slate-500 text-sm font-medium">The session will include 5 technical questions and 1 live coding challenge tailored to your level.</p>
                   <button className="px-10 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                     Initialize Session
                   </button>
                </div>
                
                {/* Floating tooltips for aesthetic */}
                <div className="absolute top-10 left-10 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                   <span className="material-symbols-outlined text-primary text-sm">mic</span>
                   <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Mic Ready</span>
                </div>
                <div className="absolute bottom-10 right-10 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                   <span className="material-symbols-outlined text-purple-500 text-sm">videocam</span>
                   <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Camera Enabled</span>
                </div>
              </Card>
            </div>
            
            <div className="col-span-12 lg:col-span-4 space-y-6">
               <Card className="p-6">
                 <h4 className="font-bold text-on-surface mb-6 flex items-center justify-between">
                   Recent Feedback
                   <span className="text-[10px] font-black text-slate-400 uppercase">Archive</span>
                 </h4>
                 <div className="space-y-4">
                   {[
                     { title: 'Array Manipulation', score: 85, date: 'Oct 28' },
                     { title: 'React Hooks Deep Dive', score: 92, date: 'Oct 22' },
                     { title: 'Behavioral: Conflict Res', score: 78, date: 'Oct 15' }
                   ].map((fb, i) => (
                     <div key={i} className="p-4 rounded-xl bg-surface-container-low hover:bg-slate-100 transition-colors group cursor-pointer border border-transparent hover:border-slate-200">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="text-xs font-black text-on-surface group-hover:text-primary transition-colors">{fb.title}</h5>
                          <span className="text-sm font-bold text-primary">{fb.score}%</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{fb.date} • 45m Session</p>
                     </div>
                   ))}
                 </div>
                 <button className="w-full mt-6 py-3 border-2 border-slate-100 rounded-xl text-xs font-black text-on-surface uppercase tracking-widest hover:bg-slate-50 transition-colors">View All Stats</button>
               </Card>
               
               <Card className="p-6 bg-primary text-white border-0 shadow-xl overflow-hidden relative">
                 <div className="relative z-10">
                   <h4 className="font-bold mb-2">Weekly Leaderboard</h4>
                   <p className="text-xs opacity-70 mb-6">Top performers in Prep sessions.</p>
                   <div className="flex items-end justify-around h-32">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 overflow-hidden shadow-lg"><img src="https://i.pravatar.cc/100?img=3" alt="" /></div>
                        <div className="w-10 bg-white/20 rounded-t-lg h-16"></div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-primary overflow-hidden shadow-2xl scale-110"><img src="https://i.pravatar.cc/100?img=1" alt="" /></div>
                        <div className="w-12 bg-white rounded-t-lg h-24"></div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 overflow-hidden shadow-lg"><img src="https://i.pravatar.cc/100?img=5" alt="" /></div>
                        <div className="w-10 bg-white/20 rounded-t-lg h-20"></div>
                      </div>
                   </div>
                 </div>
                 <span className="absolute -bottom-10 -right-10 material-symbols-outlined text-[160px] opacity-10 rotate-12">emoji_events</span>
               </Card>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-surface-container-low/30 rounded-3xl border-2 border-dashed border-slate-200 text-center gap-4">
             <span className="material-symbols-outlined text-6xl text-slate-200">arrow_upward</span>
             <h4 className="text-xl font-bold text-slate-400">Select a topic above to begin your preparation</h4>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
