import { useEffect, useState } from 'react';
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
import { StudentOnboarding } from './components/StudentOnboarding';
import { InterviewDesk } from './components/InterviewDesk';
import { GlobalReports } from './components/GlobalReports';
import { Card } from './components/ui/Card';
import { motion, AnimatePresence } from 'motion/react';
import { getStudentProfile, isStudentOnboardingComplete } from './lib/studentProfile';
import { authApi, stateApi } from './lib/backendSync';

const SEEDED_APPLICATION_KEYS = new Set([
  'google::software engineer intern::1',
  'amazon::aws cloud support::2',
  'meta::frontend developer::3',
]);

const SEEDED_NOTIFICATION_KEYS = new Set([
  'interview tomorrow::google interview scheduled at 10 am',
  'application update::amazon status updated to reviewing',
  'profile views::3 recruiters viewed your profile today',
]);

function sanitizeApplications(applications = []) {
  return (Array.isArray(applications) ? applications : []).filter((entry = {}) => {
    const key = `${String(entry.company || '').toLowerCase()}::${String(entry.role || '').toLowerCase()}::${String(entry.id || '')}`;
    return !SEEDED_APPLICATION_KEYS.has(key);
  });
}

function sanitizeNotifications(notifications = []) {
  return (Array.isArray(notifications) ? notifications : []).filter((entry = {}) => {
    const key = `${String(entry.title || '').toLowerCase()}::${String(entry.desc || '').toLowerCase()}`;
    return !SEEDED_NOTIFICATION_KEYS.has(key);
  });
}

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
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const [applications, setApplications] = useState(() => {
    const stored = localStorage.getItem('careerpilot_applications');
    if (stored) return sanitizeApplications(JSON.parse(stored));
    return [];
  });

  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('careerpilot_notifications');
    if (stored) return sanitizeNotifications(JSON.parse(stored));
    return [];
  });

  const updateApplications = (newApps) => {
    const sanitized = sanitizeApplications(newApps);
    setApplications(sanitized);
    localStorage.setItem('careerpilot_applications', JSON.stringify(sanitized));
    stateApi.saveApplications(sanitized).catch((error) => {
      console.error('Applications sync error:', error);
    });
  };

  const updateNotifications = (newNotifs) => {
    const sanitized = sanitizeNotifications(newNotifs);
    setNotifications(sanitized);
    localStorage.setItem('careerpilot_notifications', JSON.stringify(sanitized));
    stateApi.saveNotifications(sanitized).catch((error) => {
      console.error('Notifications sync error:', error);
    });
  };

  useEffect(() => {
    const hydrateCoreState = async () => {
      try {
        const token = localStorage.getItem('careerpilot_session_token');
        if (token) {
          try {
            const sessionUser = await authApi.me(token);
            if (sessionUser?.user) {
              localStorage.setItem('careerpilot_current_user', JSON.stringify(sessionUser.user));
              setCurrentUser(sessionUser.user);
              setIsAuthenticated(true);
              setPersona(sessionUser.user.role || 'student');
              setNeedsOnboarding(sessionUser.user.role === 'student' && !isStudentOnboardingComplete(sessionUser.user));
            } else {
              throw new Error('No user returned');
            }
          } catch (sessionError) {
            console.warn('Session restore failed, clearing stale token.', sessionError);
            localStorage.removeItem('careerpilot_session_token');
            localStorage.removeItem('careerpilot_current_user');
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        }

        const [nextApplications, nextNotifications] = await Promise.all([
          stateApi.getApplications(),
          stateApi.getNotifications(),
        ]);

        if (Array.isArray(nextApplications)) {
          const sanitizedApplications = sanitizeApplications(nextApplications);
          setApplications(sanitizedApplications);
          localStorage.setItem('careerpilot_applications', JSON.stringify(sanitizedApplications));
        }

        if (Array.isArray(nextNotifications)) {
          const sanitizedNotifications = sanitizeNotifications(nextNotifications);
          setNotifications(sanitizedNotifications);
          localStorage.setItem('careerpilot_notifications', JSON.stringify(sanitizedNotifications));
        }
      } catch (error) {
        console.warn('Core state hydrate fallback to local cache.', error);
      }
    };

    hydrateCoreState();

    const syncCurrentUser = () => {
      const stored = localStorage.getItem('careerpilot_current_user');
      const nextUser = stored ? JSON.parse(stored) : null;
      setCurrentUser(nextUser);
      setIsAuthenticated(nextUser !== null);
      setPersona(nextUser?.role || 'student');
      setNeedsOnboarding(nextUser ? nextUser.role === 'student' && !isStudentOnboardingComplete(nextUser) : false);
    };

    const syncApplications = () => {
      const stored = localStorage.getItem('careerpilot_applications');
      setApplications(stored ? sanitizeApplications(JSON.parse(stored)) : []);
    };

    const syncNotifications = () => {
      const stored = localStorage.getItem('careerpilot_notifications');
      setNotifications(stored ? sanitizeNotifications(JSON.parse(stored)) : []);
    };

    window.addEventListener('careerpilot:storage-updated:careerpilot_current_user', syncCurrentUser);
    window.addEventListener('careerpilot:storage-updated:careerpilot_applications', syncApplications);
    window.addEventListener('careerpilot:storage-updated:careerpilot_notifications', syncNotifications);

    return () => {
      window.removeEventListener('careerpilot:storage-updated:careerpilot_current_user', syncCurrentUser);
      window.removeEventListener('careerpilot:storage-updated:careerpilot_applications', syncApplications);
      window.removeEventListener('careerpilot:storage-updated:careerpilot_notifications', syncNotifications);
    };
  }, []);


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

  const handleLogin = (user, isNewUser = false, sessionToken = null) => {
    const onboardingRequired = user.role === 'student' && !isStudentOnboardingComplete(user);
    localStorage.setItem('careerpilot_current_user', JSON.stringify(user));
    if (sessionToken) {
      localStorage.setItem('careerpilot_session_token', sessionToken);
    }
    setCurrentUser(user);
    setPersona(user.role);
    setNeedsOnboarding(onboardingRequired);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('careerpilot_session_token');
      if (token) {
        await authApi.logout(token);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    }
    localStorage.removeItem('careerpilot_current_user');
    localStorage.removeItem('careerpilot_session_token');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPersona('student');
    setNeedsOnboarding(false);
    setActiveTab('dashboard');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (needsOnboarding && currentUser?.role === 'student') {
    return (
      <StudentOnboarding
        currentUser={currentUser}
        onComplete={() => {
          setNeedsOnboarding(false);
          setActiveTab('dashboard');
        }}
      />
    );
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
          userName={currentUser?.name || "Student"}
          userRole={persona === 'student' ? getStudentProfile(currentUser).role : persona === 'recruiter' ? 'Talent Lead' : 'Placement Head'}
          avatarUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuC42WzyRRM9i-A-ICmV_pg60wrnV6wmP2YNel9d09qWP8QDl2Z5I0UTb-etCnEIu3CR6etIn6A1mvu9hW8Nu905W_iU-v39Jmhr3643oecpxiMi__iNi9fkrb5kxEv150M8m9agiFNGNyqvy1n9Tlo54Czu1umtCZOmVVDeD6ga9MEaDTIFsB23F95vkFtAHieg1w2r4MxiQwjFr6r77oUKzRgPhI45cIwOIef4r0P29jWL9GS1Y_j85DmndrFu8roy5VTB0UHtRB0"
          onNavigateSettings={() => setActiveTab('settings')}
          searchQuery={globalSearchQuery}
          setSearchQuery={(q) => {
            setGlobalSearchQuery(q);
            if (persona === 'student') {
              setActiveTab('search');
            }
          }}
          notifications={notifications}
          setNotifications={updateNotifications}
          isSidebarCollapsed={isSidebarCollapsed}
        />

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
                {persona === 'student' && (
                  <StudentDashboard
                    applications={applications}
                    setApplications={updateApplications}
                    setActiveTab={setActiveTab}
                  />
                )}
                {persona === 'recruiter' && (
                  <RecruiterDashboard
                    setActiveTab={setActiveTab}
                    applications={applications}
                  />
                )}
                {persona === 'admin' && <PlacementDashboard />}
              </>
            )}

            {activeTab === 'settings' && <Settings />}

            {persona === 'student' && (
              <>
                {activeTab === 'search' && (
                  <JobSearch
                    searchQuery={globalSearchQuery}
                    setSearchQuery={setGlobalSearchQuery}
                    applications={applications}
                    setApplications={updateApplications}
                    setActiveTab={setActiveTab}
                  />
                )}
                {activeTab === 'applications' && (
                  <Applications
                    applications={applications}
                    setApplications={updateApplications}
                  />
                )}
                {activeTab === 'profile' && (
                  <Profile
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                  />
                )}
                {activeTab === 'interviews' && <MockInterviews applications={applications} />}
              </>
            )}

            {persona === 'recruiter' && (
              <>
                {activeTab === 'jobs' && <JobManagement applications={applications} />}
                {activeTab === 'candidates' && (
                  <Candidates
                    applications={applications}
                    setApplications={updateApplications}
                  />
                )}
                {activeTab === 'schedule' && (
                  <InterviewDesk
                    applications={applications}
                    setApplications={updateApplications}
                  />
                )}
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
              <div className="mx-auto max-w-7xl px-8 pb-12 pt-24">
                <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <span className="material-symbols-outlined text-3xl">support_agent</span>
                  </div>
                  <h2 className="text-2xl font-headline font-bold tracking-tight text-slate-900">Help Center coming soon</h2>
                  <p className="max-w-md text-sm leading-6 text-slate-500">We're putting together guides and answers to help you get the most out of CareerPilot. Check back shortly.</p>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>


    </div>
  );
}
