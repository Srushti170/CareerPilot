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
        "fixed left-0 top-0 z-40 flex h-full flex-col border-r border-slate-200 bg-slate-50 p-4 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header & Toggle */}
      <div className={cn("relative mb-8 flex items-center", isCollapsed ? "justify-center" : "justify-between px-1")}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>all_inclusive</span>
            </div>
            <div>
              <h1 className="text-lg font-headline font-semibold tracking-tight text-slate-900 leading-none">{personaTitle}</h1>
              <p className="mt-1 max-w-[140px] truncate text-xs text-slate-500">{personaSubtitle}</p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary"
            title="Expand sidebar"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>all_inclusive</span>
          </button>
        )}

        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
            title="Collapse sidebar"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemSelect(item.id)}
            className={cn(
              "flex w-full items-center rounded-xl text-sm font-medium transition-colors duration-200",
              isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
              activeId === item.id
                ? "bg-primary-soft text-primary"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="material-symbols-outlined shrink-0 text-[20px]">{item.icon}</span>
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom Items */}
      <div className="mt-auto space-y-1 border-t border-slate-200 pt-4">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onBottomItemClick ? onBottomItemClick(item.id) : onItemSelect(item.id)}
            className={cn(
              "flex w-full items-center rounded-xl text-sm font-medium transition-colors duration-200",
              isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
              item.id === 'logout'
                ? "text-danger hover:bg-danger-soft"
                : activeId === item.id
                  ? "bg-primary-soft text-primary"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="material-symbols-outlined shrink-0 text-[20px]">{item.icon}</span>
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
}
