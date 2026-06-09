import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
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
import { Login } from './components/Login';
import { Settings } from './components/Settings';
import { InterviewDesk } from './components/InterviewDesk';
import { GlobalReports } from './components/GlobalReports';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem('careerpilot_current_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('careerpilot_current_user') !== null;
  });
  const [persona, setPersona] = useState(() => {
    const stored = localStorage.getItem('careerpilot_current_user');
    return stored ? JSON.parse(stored).role : 'student';
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  const studentItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'search', label: 'Search & Match', icon: 'search' },
    { id: 'applications', label: 'My Applications', icon: 'assignment_turned_in' },
    { id: 'profile', label: 'Student Profile', icon: 'person' },
    { id: 'interviews', label: 'Mock Interviews', icon: 'interpreter_mode' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const recruiterItems = [
    { id: 'dashboard', label: 'Recruiter Hub', icon: 'dashboard' },
    { id: 'jobs', label: 'Job Management', icon: 'work' },
    { id: 'candidates', label: 'Talent Pool', icon: 'group' },
    { id: 'schedule', label: 'Interview Desk', icon: 'calendar_month' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const adminItems = [
    { id: 'dashboard', label: 'Placement Hub', icon: 'analytics' },
    { id: 'companies', label: 'Partner Companies', icon: 'domain' },
    { id: 'students', label: 'Student Records', icon: 'school' },
    { id: 'reports', label: 'Global Reports', icon: 'description' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const bottomItems = [
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
          title: 'CareerPilot Portal',
          items: studentItems,
        };
    }
  };

  const sidebarData = getSidebarData();

  const handleLogout = () => {
    localStorage.removeItem('careerpilot_current_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPersona('student');
    setActiveTab('dashboard');
  };

  if (!isAuthenticated) {
    return <Login onLogin={(user) => {
      localStorage.setItem('careerpilot_current_user', JSON.stringify(user));
      setCurrentUser(user);
      setPersona(user.role);
      setIsAuthenticated(true);
    }} />;
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        items={sidebarData.items}
        activeId={activeTab}
        onItemSelect={setActiveTab}
        personaTitle="CareerPilot"
        personaSubtitle={sidebarData.title}
        bottomItems={bottomItems}
        onBottomItemClick={(id) => {
          if (id === 'logout') handleLogout();
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <main className={`min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <TopBar
          userName={currentUser?.name || "Alex Rivera"}
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

            {activeTab === 'settings' && <Settings />}

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
                {activeTab === 'schedule' && <InterviewDesk />}
              </>
            )}

            {persona === 'admin' && (
              <>
                {activeTab === 'companies' && <Companies />}
                {activeTab === 'students' && <StudentRecords />}
                {activeTab === 'reports' && <GlobalReports />}
              </>
            )}

            {/* Fallback for components not yet implemented */}
            {activeTab === 'help' && (
              <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto">
                <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center gap-4">
                  <span className="material-symbols-outlined text-6xl text-slate-300">construction</span>
                  <h2 className="text-2xl font-bold text-slate-800">Help Center Coming Soon</h2>
                  <p className="text-slate-500 max-w-md">The Help Center guide is currently being compiled for the CareerPilot editorial experience.</p>
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
