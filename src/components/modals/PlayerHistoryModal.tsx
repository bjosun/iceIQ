import React, { useState, useEffect } from 'react';
import { X, BarChart3, Table, TrendingUp } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PlayerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'table' | 'chart' | 'stats';

interface GameRecord {
  id: string;
  date: string;
  team: string;
  points: number;
  bonus: number;
}

export default function PlayerHistoryModal({ isOpen, onClose }: PlayerHistoryModalProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  
  const [activeTab, setActiveTab] = useState<TabType>('table');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [players, setPlayers] = useState<string[]>([]);
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    if (isOpen && user) {
      // Load player list
      setPlayers(['Player 1', 'Player 2', 'Player 3']);
      setSelectedPlayer('Player 1');
      
      // Load games for selected player
      const mockGames: GameRecord[] = [
        { id: '1', date: '2024-01-15', team: 'Team A', points: 85, bonus: 850 },
        { id: '2', date: '2024-01-22', team: 'Team B', points: 72, bonus: 720 },
        { id: '3', date: '2024-01-29', team: 'Team C', points: 91, bonus: 910 },
        { id: '4', date: '2024-02-05', team: 'Team D', points: 68, bonus: 680 },
        { id: '5', date: '2024-02-12', team: 'Team E', points: 94, bonus: 940 },
      ];
      setGames(mockGames);
    }
  }, [isOpen, user, selectedPlayer]);

  const chartData = {
    labels: games.map(game => game.date),
    datasets: [
      {
        label: t('points'),
        data: games.map(game => game.points),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#9ca3af',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#9ca3af'
        }
      },
      x: {
        grid: {
          color: '#374151'
        },
        ticks: {
          color: '#9ca3af'
        }
      }
    }
  };

  const calculateStats = () => {
    if (games.length === 0) return null;
    
    const totalGames = games.length;
    const totalPoints = games.reduce((sum, game) => sum + game.points, 0);
    const avgPoints = totalPoints / totalGames;
    const bestGame = games.reduce((best, game) => game.points > best.points ? game : best);
    const worstGame = games.reduce((worst, game) => game.points < worst.points ? game : worst);
    
    return {
      totalGames,
      avgPoints: Number(avgPoints.toFixed(1)),
      bestGame,
      worstGame,
      totalPoints
    };
  };

  const stats = calculateStats();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('playerHistory')}
      size="xl"
    >
      <div className="p-6">
        {/* Player Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('selectPlayer')}
          </label>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            {players.map(player => (
              <option key={player} value={player}>
                {player}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('table')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'table'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Table size={16} className="mr-2" />
                {t('matches')}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('chart')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'chart'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BarChart3 size={16} className="mr-2" />
                {t('graph')}
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stats'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center">
                <TrendingUp size={16} className="mr-2" />
                {t('statsAndTrends')}
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="max-h-[400px] overflow-y-auto">
          {activeTab === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                  <tr>
                    <th className="px-4 py-3">{t('date')}</th>
                    <th className="px-4 py-3">{t('team')}</th>
                    <th className="px-4 py-3">{t('points')}</th>
                    <th className="px-4 py-3">{t('bonus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game) => (
                    <tr key={game.id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="px-4 py-3">{game.date}</td>
                      <td className="px-4 py-3">{game.team}</td>
                      <td className={`px-4 py-3 font-bold ${
                        game.points > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {game.points}
                      </td>
                      <td className={`px-4 py-3 font-bold ${
                        game.bonus > 0 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {game.bonus.toLocaleString()} {language === 'en' ? 'USD' : 'SEK'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'chart' && (
            <div className="p-4">
              {games.length >= 2 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="text-center py-12">
                  <BarChart3 size={48} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">{t('needMoreMatches')}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              {subscription.plan === 'free' ? (
                <Card className="text-center p-8">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">
                    {t('premiumStats')}
                  </h3>
                  <p className="text-gray-300 mb-6">
                    {t('upgradeForStats')}
                  </p>
                  <Button variant="premium" fullWidth>
                    {t('upgradeToPremium')}
                  </Button>
                </Card>
              ) : stats ? (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card border={false} className="text-center p-4">
                      <p className="text-sm text-gray-400 mb-1">{t('matches')}</p>
                      <p className="text-2xl font-bold text-white">{stats.totalGames}</p>
                    </Card>
                    
                    <Card border={false} className="text-center p-4">
                      <p className="text-sm text-gray-400 mb-1">{t('avgPoints')}</p>
                      <p className="text-2xl font-bold text-green-400">{stats.avgPoints}</p>
                    </Card>
                    
                    <Card border={false} className="text-center p-4">
                      <p className="text-sm text-gray-400 mb-1">{t('bestGame')}</p>
                      <p className="text-2xl font-bold text-green-400">{stats.bestGame.points}</p>
                      <p className="text-xs text-gray-500">{stats.bestGame.date}</p>
                    </Card>
                    
                    <Card border={false} className="text-center p-4">
                      <p className="text-sm text-gray-400 mb-1">{t('worstGame')}</p>
                      <p className="text-2xl font-bold text-red-400">{stats.worstGame.points}</p>
                      <p className="text-xs text-gray-500">{stats.worstGame.date}</p>
                    </Card>
                  </div>

                  {/* Cumulative Chart */}
                  <Card>
                    <h4 className="text-lg font-semibold text-cyan-400 mb-4">
                      {t('pointDevelopment')}
                    </h4>
                    <div className="h-64">
                      <Line 
                        data={{
                          labels: games.map(g => g.date),
                          datasets: [{
                            label: 'Cumulative Points',
                            data: games.reduce((acc, game) => {
                              const last = acc.length > 0 ? acc[acc.length - 1] : 0;
                              acc.push(last + game.points);
                              return acc;
                            }, [] as number[]),
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4
                          }]
                        }}
                        options={chartOptions}
                      />
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">{t('noMatchesRegistered')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}