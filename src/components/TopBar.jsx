import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function TopBar({
  userName,
  userRole,
  avatarUrl,
  placeholder = "Search jobs, skills, or companies",
  onNavigateSettings,
  searchQuery = "",
  setSearchQuery,
  notifications = [],
  setNotifications,
  onRefreshNotifications,
  isSidebarCollapsed
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);
  const notificationRef = useRef(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('careerpilot_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('careerpilot_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Sync input value with external query
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // Handle outside clicks to close notifications panel
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (setSearchQuery) {
      setSearchQuery(inputValue);
    }
  };

  const markAllAsRead = () => {
    if (setNotifications) {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  const clearNotification = (id) => {
    if (setNotifications) {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  const toggleNotifications = async () => {
    if (onRefreshNotifications) {
      await onRefreshNotifications();
    }
    setShowNotifications((current) => !current);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={cn(
      "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant/35 px-8 transition-all duration-300",
      "bg-surface-container-lowest/85 backdrop-blur supports-[backdrop-filter]:bg-surface-container-lowest/70",
      isSidebarCollapsed ? "left-20" : "left-64"
    )}>
      <div className="flex w-1/3 items-center" />

      <div className="relative flex shrink-0 items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
          title="Toggle theme"
        >
          <span className="material-symbols-outlined text-[22px]">
            {theme === 'light' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        {/* Notifications Icon & Panel */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={toggleNotifications}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest elev-md"
              >
                <div className="flex items-center justify-between border-b border-outline-variant/50 bg-surface-container-low px-4 py-3">
                  <h4 className="text-sm font-semibold text-on-surface">Notifications</h4>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-primary hover:text-primary-hover"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-64 divide-y divide-outline-variant/30 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-on-surface-variant">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={cn(
                          "group relative flex gap-3 px-4 py-3 transition-colors hover:bg-surface-container-low",
                          !notif.read ? "bg-primary-soft/40" : ""
                        )}
                      >
                        <div className={cn(
                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          !notif.read ? "bg-primary" : "bg-transparent"
                        )} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-tight text-on-surface">{notif.title}</p>
                          <p className="mt-0.5 text-xs leading-normal text-on-surface-variant/80">{notif.desc}</p>
                          <span className="mt-1 block text-[11px] text-on-surface-variant/60">{notif.time}</span>
                        </div>
                        <button
                          onClick={() => clearNotification(notif.id)}
                          className="text-on-surface-variant/40 opacity-0 transition-opacity hover:text-on-surface group-hover:opacity-100"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings button */}
        <button
          onClick={onNavigateSettings}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </button>

        <div className="mx-2 h-8 w-px bg-outline-variant/50"></div>

        <div className="group flex cursor-pointer items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold leading-tight text-slate-900">{userName}</p>
            <p className="mt-0.5 text-xs text-slate-500">{userRole}</p>
          </div>
          <img
            src={avatarUrl}
            alt="User Profile"
            className="h-10 w-10 rounded-full border border-slate-200 object-cover"
          />
        </div>
      </div>
    </header>
  );
}
