import { cn } from '../lib/utils';

export function TopBar({ userName, userRole, avatarUrl, placeholder = "Search for jobs, skills, or companies..." }) {
  return (
    <header className="fixed top-0 right-0 left-64 z-30 flex justify-between items-center px-8 h-16 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md transition-all">
      <div className="flex items-center w-1/3">
        <div className="relative w-full max-w-sm group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-primary transition-colors">search</span>
          <input 
            type="text" 
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400" 
            placeholder={placeholder}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:text-primary transition-colors relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-tertiary rounded-full"></span>
        </button>
        <button className="p-2 text-slate-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-bold text-on-surface leading-tight">{userName}</p>
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
