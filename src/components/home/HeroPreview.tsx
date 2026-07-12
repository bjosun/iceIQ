import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Users, BarChart3, Target, TrendingUp, Banknote, Sparkles } from 'lucide-react';

// Levande mock av dashboarden för heron på landningssidan.
// Ersätter den statiska skärmdumpen så att förhandsvisningen aldrig
// blir inaktuell och sidan slipper ladda en ~2 MB PNG.
export default function HeroPreview() {
  const { t } = useLanguage();

  const stats = [
    { icon: <Users size={16} className="text-cyan-400" />, value: '3', label: t('players') },
    { icon: <BarChart3 size={16} className="text-green-400" />, value: '12', label: t('matches') },
    { icon: <Target size={16} className="text-yellow-400" />, value: '7.4', label: t('avgPoints') },
    { icon: <TrendingUp size={16} className="text-red-400" />, value: '2', label: t('dashboard.thisWeek') },
  ];

  // Poängutveckling över 8 matcher (stigande trend)
  const points = [4, 6, 5, 7, 6, 8, 9, 10];
  const max = Math.max(...points);
  const chartW = 560;
  const chartH = 120;
  const stepX = chartW / (points.length - 1);
  const coords = points.map((p, i) => [i * stepX, chartH - (p / max) * (chartH - 16) - 8]);
  const polyline = coords.map(([x, y]) => `${x},${y}`).join(' ');

  return (
    <div className="rounded-xl bg-gray-950/90 p-4 sm:p-6 text-left">

      {/* Toppbar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-white font-black italic tracking-tighter text-sm">
          ICE <span className="text-cyan-400">IQ</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-indigo-500/40 bg-indigo-500/10 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles size={10} className="text-yellow-400" /> 3 {t('ai.credits')}
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-yellow-500/50 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider">
            <Banknote size={10} /> {t('moneyMode.title')}
          </span>
        </div>
      </div>

      {/* Statkort */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-5">
        {stats.map(({ icon, value, label }) => (
          <div key={label} className="bg-gray-800/80 rounded-xl p-2.5 sm:p-3 text-center border border-gray-700/50">
            <div className="flex justify-center mb-1">{icon}</div>
            <p className="text-white font-bold text-sm sm:text-lg leading-none">{value}</p>
            <p className="text-gray-500 text-[9px] sm:text-[10px] mt-1 truncate">{label}</p>
          </div>
        ))}
      </div>

      {/* Poängutveckling */}
      <div className="bg-gray-800/60 rounded-xl p-3 sm:p-4 border border-gray-700/50">
        <p className="text-gray-400 text-[10px] uppercase tracking-wider font-bold mb-2">
          {t('pointDevelopment')}
        </p>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto" aria-hidden="true">
          <defs>
            <linearGradient id="heroChartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0)" />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${chartH} ${polyline} ${chartW},${chartH}`}
            fill="url(#heroChartFill)"
          />
          <polyline
            points={polyline}
            fill="none"
            stroke="rgb(34,211,238)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {coords.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="4" fill="rgb(17,24,39)" stroke="rgb(34,211,238)" strokeWidth="2" />
          ))}
        </svg>
      </div>
    </div>
  );
}
