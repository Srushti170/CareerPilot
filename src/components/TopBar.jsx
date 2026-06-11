import { useState, useRef, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function TopBar({ 
  userName, 
  userRole, 
  avatarUrl, 
  placeholder = "Search for jobs, skills, or companies...",
  onNavigateSettings,
  searchQuery = "",
  setSearchQuery,
  notifications = [],
  setNotifications,
  isSidebarCollapsed
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);
  const notificationRef = useRef(null);

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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={cn(
      "fixed top-0 right-0 z-30 flex justify-between items-center px-8 h-16 transition-all duration-300 border-b border-outline-variant/10",
      "bg-white shadow-sm dark:bg-slate-900",
      isSidebarCollapsed ? "left-20" : "left-64"
    )}>
      <div className="flex items-center w-1/3">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-primary transition-colors">search</span>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 font-medium" 
            placeholder={placeholder}
          />
        </form>
      </div>
      
      <div className="flex items-center gap-4 relative shrink-0">
        {/* Notifications Icon & Panel */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-primary transition-colors relative flex items-center justify-center rounded-lg hover:bg-slate-100/50"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-tertiary text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
              >
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="font-bold text-sm text-slate-800">Notifications</h4>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 font-medium">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={cn(
                          "p-3.5 flex gap-3 hover:bg-slate-50/80 transition-colors relative group",
                          !notif.read ? "bg-primary/5" : ""
                        )}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 leading-tight">{notif.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{notif.desc}</p>
                          <span className="text-[9px] text-slate-400 mt-1 block font-medium">{notif.time}</span>
                        </div>
                        <button 
                          onClick={() => clearNotification(notif.id)}
                          className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
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
          className="p-2 text-slate-500 hover:text-primary transition-colors flex items-center justify-center rounded-lg hover:bg-slate-100/50"
        >
          <span className="material-symbols-outlined">settings</span>
        </button>

        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{userName}</p>
            <p className="text-[10px] text-slate-500">{userRole}</p>
          </div>
          <img 
            src={avatarUrl} 
            alt="User Profile" 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover group-hover:scale-105 transition-transform" 
          />
        </div>
      </div>
    </header>
  );
}

