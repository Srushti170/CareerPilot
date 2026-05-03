import { cn } from '../lib/utils';

export function Sidebar({
  items,
  activeId,
  onItemSelect,
  personaTitle,
  personaSubtitle,
  bottomItems = [],
  onBottomItemClick
}) {
  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col p-4 w-64 bg-slate-50 dark:bg-slate-950 z-40">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>all_inclusive</span>
        </div>
        <div>
          <h1 className="text-xl font-black text-primary tracking-tighter leading-tight">CareerPilot</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{personaSubtitle}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemSelect(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:translate-x-1",
              activeId === item.id
                ? "text-primary bg-white dark:bg-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-headline text-base">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto space-y-2 pt-6 border-t border-slate-200/60 dark:border-slate-800">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onBottomItemClick ? onBottomItemClick(item.id) : onItemSelect(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 hover:translate-x-1",
              item.id === 'logout' ? "text-tertiary" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50"
            )}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-headline text-base">{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
