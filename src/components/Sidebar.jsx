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
              <svg className="h-6 w-6 text-on-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1.1.1-1.3.6l-.3.7c-.2.5-.1 1.1.4 1.4L9 12l-3.5 3.5H3L2 17l2 1 1 2 1.5-1v-2.5L10 13l3.2 5.2c.3.5.9.6 1.4.4l.7-.3c.5-.2.7-.8.6-1.3z" />
              </svg>
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
            <svg className="h-6 w-6 text-on-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-1.1.1-1.3.6l-.3.7c-.2.5-.1 1.1.4 1.4L9 12l-3.5 3.5H3L2 17l2 1 1 2 1.5-1v-2.5L10 13l3.2 5.2c.3.5.9.6 1.4.4l.7-.3c.5-.2.7-.8.6-1.3z" />
            </svg>
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
