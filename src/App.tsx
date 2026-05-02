import { useState } from 'react';
import { Sidebar, SidebarItem } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { StudentDashboard } from './components/StudentDashboard';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { PlacementDashboard } from './components/PlacementDashboard';
import { JobSearch } from './components/JobSearch';
import { Applications } from './components/Applications';
import { Profile } from './components/Profile';
import { MockInterviews } from './components/MockInterviews';
import { Candidates } from './components/Candidates';
import { JobManagement } from './components/JobManagement';
import { Companies } from './components/Companies';
import { StudentRecords } from './components/StudentRecords';
import { motion, AnimatePresence } from 'motion/react';

type Persona = 'student' | 'recruiter' | 'admin';

export default function App() {
  const [persona, setPersona] = useState<Persona>('student');
  const [activeTab, setActiveTab] = useState('dashboard');

  const studentItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'search', label: 'Search & Match', icon: 'search' },
    { id: 'applications', label: 'My Applications', icon: 'assignment_turned_in' },
    { id: 'profile', label: 'Student Profile', icon: 'person' },
    { id: 'interviews', label: 'Mock Interviews', icon: 'interpreter_mode' },
  ];

  const recruiterItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Recruiter Hub', icon: 'dashboard' },
    { id: 'jobs', label: 'Job Management', icon: 'work' },
    { id: 'candidates', label: 'Talent Pool', icon: 'group' },
    { id: 'schedule', label: 'Interview Desk', icon: 'calendar_month' },
    { id: 'settings', label: 'Team Settings', icon: 'settings' },
  ];

  const adminItems: SidebarItem[] = [
    { id: 'dashboard', label: 'Placement Hub', icon: 'analytics' },
    { id: 'companies', label: 'Partner Companies', icon: 'domain' },
    { id: 'students', label: 'Student Records', icon: 'school' },
    { id: 'reports', label: 'Global Reports', icon: 'description' },
    { id: 'settings', label: 'Coordination', icon: 'tune' },
  ];

  const bottomItems: SidebarItem[] = [
    { id: 'help', label: 'Help Center', icon: 'help' },
    { id: 'logout', label: 'Logout', icon: 'logout' },
  ];

  const getSidebarData = () => {
    switch (persona) {
      case 'student':
        return {
          title: 'Student Experience',
          items: studentItems,
        };
      case 'recruiter':
        return {
          title: 'Recruiter Console',
          items: recruiterItems,
        };
      case 'admin':
        return {
          title: 'Placement Center',
          items: adminItems,
        };
      default:
        return {
          title: 'HireLoop Portal',
          items: studentItems,
        };
    }
  };

  const sidebarData = getSidebarData();

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar 
        items={sidebarData.items}
        activeId={activeTab}
        onItemSelect={setActiveTab}
        personaTitle="HireLoop"
        personaSubtitle={sidebarData.title}
        bottomItems={bottomItems}
      />
      
      <main className="ml-64 min-h-screen">
        <TopBar 
          userName="Alex Rivera"
          userRole={persona === 'student' ? 'CS Senior Student' : persona === 'recruiter' ? 'Talent Lead' : 'Placement Head'}
          avatarUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuC42WzyRRM9i-A-ICmV_pg60wrnV6wmP2YNel9d09qWP8QDl2Z5I0UTb-etCnEIu3CR6etIn6A1mvu9hW8Nu905W_iU-v39Jmhr3643oecpxiMi__iNi9fkrb5kxEv150M8m9agiFNGNyqvy1n9Tlo54Czu1umtCZOmVVDeD6ga9MEaDTIFsB23F95vkFtAHieg1w2r4MxiQwjFr6r77oUKzRgPhI45cIwOIef4r0P29jWL9GS1Y_j85DmndrFu8roy5VTB0UHtRB0"
        />

        {/* Persona Switcher (For Demo Purposes) */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 bg-white/80 backdrop-blur p-2 rounded-2xl shadow-xl border border-primary/10">
          <p className="text-[10px] font-bold text-center text-slate-400 uppercase tracking-widest px-2">Preview Role</p>
          <div className="flex gap-1">
            <button 
              onClick={() => setPersona('student')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${persona === 'student' ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}
            >
              Student
            </button>
            <button 
              onClick={() => setPersona('recruiter')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${persona === 'recruiter' ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}
            >
              Recruiter
            </button>
            <button 
              onClick={() => setPersona('admin')} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${persona === 'admin' ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}
            >
              Admin
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${persona}-${activeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Direct Routing */}
            {activeTab === 'dashboard' && (
              <>
                {persona === 'student' && <StudentDashboard />}
                {persona === 'recruiter' && <RecruiterDashboard />}
                {persona === 'admin' && <PlacementDashboard />}
              </>
            )}
            
            {persona === 'student' && (
              <>
                {activeTab === 'search' && <JobSearch />}
                {activeTab === 'applications' && <Applications />}
                {activeTab === 'profile' && <Profile />}
                {activeTab === 'interviews' && <MockInterviews />}
              </>
            )}

            {persona === 'recruiter' && (
              <>
                {activeTab === 'jobs' && <JobManagement />}
                {activeTab === 'candidates' && <Candidates />}
              </>
            )}

            {persona === 'admin' && (
              <>
                {activeTab === 'companies' && <Companies />}
                {activeTab === 'students' && <StudentRecords />}
              </>
            )}

            {/* Fallback for components not yet implemented */}
            {((persona !== 'student' && activeTab !== 'dashboard' && activeTab !== 'jobs' && activeTab !== 'candidates' && activeTab !== 'companies' && activeTab !== 'students')) && (
              <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto">
                <div className="bg-surface-container-lowest p-12 rounded-2xl shadow-sm border border-outline-variant/10 flex flex-col items-center justify-center text-center gap-4">
                  <span className="material-symbols-outlined text-6xl text-slate-200">construction</span>
                  <h2 className="text-2xl font-bold text-on-surface">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Coming Soon</h2>
                  <p className="text-slate-500 max-w-md">The {activeTab} section for {persona}s is currently being optimized for the "HireLoop Editorial" experience.</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button (for appropriate tabs) */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-container text-white shadow-2xl flex items-center justify-center hover:shadow-primary/30 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </motion.button>
    </div>
  );
}
