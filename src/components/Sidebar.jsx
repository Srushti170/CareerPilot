import { cn } from '../lib/utils';

export function Sidebar({
  items,
  activeId,
  onItemSelect,
  personaTitle,
  personaSubtitle,
  bottomItems = [],
  onBottomItemClick,
  isCollapsed = false,
  onToggleCollapse
}) {
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-full flex flex-col p-4 bg-slate-50 dark:bg-slate-950 z-40 transition-all duration-300 border-r border-slate-200/40 dark:border-slate-800/40",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header & Toggle */}
      <div className={cn("flex items-center mb-10 relative", isCollapsed ? "justify-center" : "justify-between px-2")}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>all_inclusive</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-primary tracking-tighter leading-none">CareerPilot</h1>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 font-black mt-1 truncate max-w-[120px]">{personaSubtitle}</p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shadow-lg shadow-primary/20 cursor-pointer" onClick={onToggleCollapse}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>all_inclusive</span>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500 transition-colors",
            isCollapsed ? "absolute -bottom-8" : ""
          )}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <span className="material-symbols-outlined text-lg">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemSelect(item.id)}
            className={cn(
              "w-full flex items-center rounded-xl font-semibold transition-all duration-200",
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3 hover:translate-x-1",
              activeId === item.id
                ? "text-primary bg-white dark:bg-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="material-symbols-outlined shrink-0">{item.icon}</span>
            {!isCollapsed && <span className="font-headline text-base truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="mt-auto space-y-2 pt-6 border-t border-slate-200/60 dark:border-slate-800">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onBottomItemClick ? onBottomItemClick(item.id) : onItemSelect(item.id)}
            className={cn(
              "w-full flex items-center rounded-xl font-semibold transition-all duration-200",
              isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3 hover:translate-x-1",
              item.id === 'logout' 
                ? "text-tertiary" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50",
              activeId === item.id && item.id !== 'logout'
                ? "text-primary bg-white dark:bg-slate-900 shadow-sm"
                : ""
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="material-symbols-outlined shrink-0">{item.icon}</span>
            {!isCollapsed && <span className="font-headline text-base truncate">{item.label}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
}
