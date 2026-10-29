import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ActionChange } from '../../utils/matchChanges';

interface ChangeListProps {
  changes: ActionChange[];
  /** Visningsnamn på användarens språk för ett engelskt aktionsnamn. */
  label: (action: string) => string;
}

// Rader med "det som ändrats" mellan de två senaste matcherna. Ett tryck på en
// rad visar de senaste matcherna för just den aktionen. Bara en förbättring får
// färg — en försämring visas neutralt, aldrig som kritik.
export default function ChangeList({ changes, label }: ChangeListProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState<string | null>(null);

  if (changes.length === 0) {
    return <p className="text-sm text-gray-400">{t('playerLink.changedNone')}</p>;
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{t('playerLink.changedHint')}</p>
      <ul className="divide-y divide-white/5 bg-gray-900/60 rounded-xl">
        {changes.map((c) => {
          const isOpen = open === c.action;
          return (
            <li key={c.action}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : c.action)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-left"
              >
                <span className="text-gray-200 truncate">{label(c.action)}</span>
                <span className="shrink-0 flex items-center gap-2 tabular-nums">
                  <span className={c.tone === 'better' ? 'text-green-400 font-semibold' : 'text-gray-300'}>
                    {c.previous} → {c.current}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 text-xs text-gray-400 leading-relaxed">
                  <p>
                    {t('playerLink.lastGamesLabel', { count: c.recent.length })}: {c.recent.join(', ')}
                  </p>
                  {c.extreme && (
                    <p className="mt-1 text-cyan-300">
                      {c.extreme === 'lowest' ? t('playerLink.lowestSoFar') : t('playerLink.highestSoFar')}
                    </p>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
