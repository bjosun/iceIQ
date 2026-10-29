interface Tab<Id extends string> {
  id: Id;
  label: string;
  /** Liten prick: något nytt sedan sist. */
  dot?: boolean;
}

interface LinkTabsProps<Id extends string> {
  tabs: Tab<Id>[];
  active: Id;
  onChange: (id: Id) => void;
  dotLabel: string;
}

export default function LinkTabs<Id extends string>({ tabs, active, onChange, dotLabel }: LinkTabsProps<Id>) {
  return (
    <div role="tablist" className="flex gap-1 bg-gray-800 border border-white/5 rounded-xl p-1">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`relative flex-1 px-2 py-2 rounded-lg text-sm transition-colors ${
              isActive ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
            {tab.dot && !isActive && (
              <span
                className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-cyan-400"
                role="img"
                aria-label={dotLabel}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
