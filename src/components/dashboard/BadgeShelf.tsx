import { Flag, CalendarCheck, TrendingUp, Zap, Lock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { BADGES, BadgeId, earnedBadges } from '../../utils/badges';

export const BADGE_ICONS: Record<BadgeId, typeof Flag> = {
  firstGame: Flag,
  games5: CalendarCheck,
  games10: CalendarCheck,
  games25: CalendarCheck,
  games50: CalendarCheck,
  personalBest: TrendingUp,
  threeAboveAverage: Zap,
};

// Märkeshylla: det man har i färg, det som återstår dämpat med en antydan om
// hur man får det. Inget visar andra spelare eller tar något ifrån någon.
export default function BadgeShelf({ games }: { games: { points: number }[] }) {
  const { t } = useLanguage();
  const earned = earnedBadges(games.map((g) => g.points || 0));

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('badges.title')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {BADGES.map(({ id }) => {
          const count = earned[id] ?? 0;
          const Icon = BADGE_ICONS[id];
          return (
            <div
              key={id}
              className={`rounded-xl p-3 text-center border ${
                count > 0
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-gray-900/40 border-gray-800'
              }`}
            >
              <div
                className={`mx-auto mb-2 w-10 h-10 rounded-full flex items-center justify-center ${
                  count > 0 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-800 text-gray-600'
                }`}
              >
                {count > 0 ? <Icon size={20} /> : <Lock size={16} />}
              </div>
              <p className={`text-xs font-semibold ${count > 0 ? 'text-white' : 'text-gray-500'}`}>
                {t(`badges.${id}.name`)}
                {count > 1 ? ` ×${count}` : ''}
              </p>
              <p className="text-[11px] text-gray-500 mt-1 leading-snug">{t(`badges.${id}.desc`)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
