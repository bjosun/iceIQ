import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Card from '../ui/Card';
import { useLanguage } from '../../contexts/LanguageContext';
import { seasonsIn, inSeason, seasonLabel, avgOf, SeasonKey } from '../../utils/season';

interface SeasonCompareProps {
  games: { date: string; points: number }[];
  selected: SeasonKey;
  onSelect: (s: SeasonKey) => void;
}

// En rad per säsong med antal matcher, snitt och förändring mot säsongen
// innan, så utvecklingen syns över tid. Jämförelsen gäller spelarens egen
// utveckling, aldrig mellan olika spelare.
export default function SeasonCompare({ games, selected, onSelect }: SeasonCompareProps) {
  const { t } = useLanguage();
  const seasons = seasonsIn(games); // nyast först
  if (seasons.length < 2) return null;

  const rows = seasons.map((start, i) => {
    const g = inSeason(games, start);
    const prev = seasons[i + 1] !== undefined ? inSeason(games, seasons[i + 1]) : null;
    const avg = avgOf(g);
    const delta = prev && prev.length > 0 ? Number((avg - avgOf(prev)).toFixed(1)) : null;
    const best = Math.max(...g.map(x => x.points || 0));
    return { start, count: g.length, avg, best, delta };
  });
  const maxAvg = Math.max(...rows.map(r => r.avg), 1);

  return (
    <Card>
      <h2 className="text-xl font-semibold text-white mb-1">{t('seasonView.compareTitle')}</h2>
      <p className="text-gray-400 text-sm mb-5">{t('seasonView.compareHint')}</p>
      <div className="space-y-2">
        {rows.map(r => {
          const active = selected === r.start;
          return (
            <button
              key={r.start}
              onClick={() => onSelect(r.start)}
              className={`w-full text-left rounded-xl border p-3 transition-colors ${
                active ? 'border-cyan-500/60 bg-cyan-500/10' : 'border-gray-700 bg-gray-900/60 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-white">{seasonLabel(r.start)}</span>
                <span className="text-xs text-gray-400">
                  {r.count} {t('matches').toLowerCase()} · {t('bestGame').toLowerCase()} {r.best}
                </span>
                <span className="flex items-center gap-2">
                  {r.delta !== null && (
                    <span
                      className={`flex items-center gap-1 text-xs font-bold ${
                        r.delta > 0 ? 'text-green-400' : r.delta < 0 ? 'text-amber-300' : 'text-gray-400'
                      }`}
                    >
                      {r.delta > 0 ? <TrendingUp size={13} /> : r.delta < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
                      {r.delta > 0 ? '+' : ''}{r.delta}
                    </span>
                  )}
                  <span className="text-lg font-bold text-white tabular-nums">{r.avg}</span>
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.max(4, (r.avg / maxAvg) * 100)}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
