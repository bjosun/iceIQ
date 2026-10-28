import { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTemplates } from '../../contexts/TemplateContext';

interface SeasonTotalsProps {
  games: { counts?: Record<string, number> }[];
}

// Antal i vyn innan "visa alla" — de vanligaste aktionerna först.
const TOP = 8;

// Summan per aktion över periodens matcher, t.ex. "blockerade skott totalt".
// Sparade matcher har de ENGELSKA aktionsnamnen som nycklar (äldre har
// JSON-nycklar {sv,en}, normaliseras som i awards.ts); visningsnamnet slås
// upp i mallarna så det blir på användarens språk.
export default function SeasonTotals({ games }: SeasonTotalsProps) {
  const { t, language } = useLanguage();
  const { templates } = useTemplates();
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const g of games) {
      for (const [key, value] of Object.entries(g.counts || {})) {
        let name = key;
        if (key.startsWith('{')) {
          try {
            const parsed = JSON.parse(key);
            name = parsed.en || parsed.sv || key;
          } catch { /* behåll nyckeln som den är */ }
        }
        totals[name] = (totals[name] ?? 0) + (Number(value) || 0);
      }
    }
    const svByEn: Record<string, string> = {};
    for (const tpl of Object.values(templates)) {
      for (const a of tpl.actions ?? []) svByEn[a.name.en] = a.name.sv;
    }
    return Object.entries(totals)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([en, total]) => ({
        label: language === 'sv' ? svByEn[en] ?? en : en,
        total,
        perGame: Math.round((total / games.length) * 10) / 10,
      }));
  }, [games, templates, language]);

  if (rows.length === 0) return null;
  const visible = showAll ? rows : rows.slice(0, TOP);

  return (
    <div className="mt-6">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-200">{t('seasonView.totalsTitle')}</h3>
        <span className="text-xs text-gray-500">{t('seasonView.totalsPerGame')}</span>
      </div>
      <ul className="divide-y divide-white/5 bg-gray-900/60 rounded-xl">
        {visible.map(r => (
          <li key={r.label} className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="text-gray-300 truncate">{r.label}</span>
            <span className="shrink-0 tabular-nums">
              <span className="font-bold text-white">{r.total}</span>
              <span className="text-gray-500 ml-3">{r.perGame}</span>
            </span>
          </li>
        ))}
      </ul>
      {rows.length > TOP && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-2 text-xs text-cyan-300 hover:text-cyan-200"
        >
          {showAll ? t('seasonView.totalsShowLess') : t('seasonView.totalsShowAll', { count: rows.length })}
        </button>
      )}
    </div>
  );
}
