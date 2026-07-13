import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import Card from '../ui/Card';
import { useLanguage } from '../../contexts/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface SeasonOverviewProps {
  playerName: string;
  games: { date: string; points: number }[]; // sorterade äldst -> nyast
  summary: {
    games: number;
    avgPoints: number;
    bestGame: number;
    last5Avg: number;
  } | null;
}

// Synlig utvecklingsvy utanför chatten: poängkurva över säsongens alla
// matcher plus nyckeltal, så utvecklingen syns direkt i dashboarden.
export default function SeasonOverview({ playerName, games, summary }: SeasonOverviewProps) {
  const { t, language } = useLanguage();

  const locale = language === 'sv' ? 'sv-SE' : 'en-GB';
  const shortDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };

  const chartData = {
    labels: games.map(g => shortDate(g.date)),
    datasets: [
      {
        label: t('share.pointsLabel'),
        data: games.map(g => g.points),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        pointBackgroundColor: '#111827',
        pointBorderColor: '#22d3ee',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#9ca3af',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        grid: { color: '#374151' },
        ticks: { color: '#9ca3af' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', maxTicksLimit: 8 },
      },
    },
  };

  const trendingUp = summary !== null && summary.last5Avg >= summary.avgPoints;

  return (
    <Card>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp className="text-cyan-400" size={20} />
          {t('seasonView.title')}
          <span className="text-gray-500 font-normal text-sm">• {playerName}</span>
        </h2>

        {summary && summary.games >= 3 && (
          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              trendingUp
                ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                : 'bg-red-500/10 text-red-400 border border-red-500/30'
            }`}
          >
            {trendingUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {trendingUp ? t('seasonView.trendUp') : t('seasonView.trendDown')}
          </span>
        )}
      </div>

      {games.length < 2 || !summary ? (
        <div className="flex flex-col items-center py-10 text-center">
          <BarChart3 size={40} className="text-gray-700 mb-3" />
          <p className="text-gray-400 text-sm">{t('needMoreMatches')}</p>
        </div>
      ) : (
        <>
          <div className="h-56 mb-6">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-900/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{summary.games}</p>
              <p className="text-xs text-gray-400 mt-1">{t('matches')}</p>
            </div>
            <div className="bg-gray-900/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{summary.avgPoints}</p>
              <p className="text-xs text-gray-400 mt-1">{t('avgPoints')}</p>
            </div>
            <div className="bg-gray-900/60 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{summary.bestGame}</p>
              <p className="text-xs text-gray-400 mt-1">{t('bestGame')}</p>
            </div>
            <div className="bg-gray-900/60 rounded-xl p-3 text-center">
              <p className={`text-2xl font-bold ${trendingUp ? 'text-green-400' : 'text-red-400'}`}>
                {summary.last5Avg}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t('seasonView.last5')}</p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
