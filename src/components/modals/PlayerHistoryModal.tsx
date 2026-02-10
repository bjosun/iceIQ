import React, { useState, useEffect } from 'react';
import { BarChart3, Table, TrendingUp } from 'lucide-react';
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
import { usePlayerData } from '../../hooks/usePlayerData'; 
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

interface Player {
  id: string;
  name: string;
}

interface PlayerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[]; 
}

type TabType = 'table' | 'chart' | 'stats';

interface GameRecord {
  id: string;
  date: string;
  team: string;
  points: number;
  bonus: number;
}

export default function PlayerHistoryModal({ isOpen, onClose, players }: PlayerHistoryModalProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const { getPlayerHistory } = usePlayerData(); 

  const [activeTab, setActiveTab] = useState<TabType>('table');
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Välj första spelaren automatiskt
  useEffect(() => {
    if (isOpen && players.length > 0 && !selectedPlayerName) {
      setSelectedPlayerName(players[0].name);
    }
  }, [isOpen, players]);

  // Hämta data när spelare ändras
  useEffect(() => {
    const fetchGames = async () => {
      if (!selectedPlayerName || !user) return;

      setLoading(true);
      try {
        const history = await getPlayerHistory(selectedPlayerName, 50);
        
        const formattedGames: GameRecord[] = history.map((game: any) => ({
          id: game.id,
          date: game.date,
          team: game.team || 'Unknown Team',
          points: game.points || 0,
          bonus: game.bonus || 0
        }));

        setGames(formattedGames);
      } catch (error) {
        console.error("Failed to load player history", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchGames();
    }
  }, [selectedPlayerName, isOpen, user, getPlayerHistory]);

  const chartData = {
    labels: games.map(game => game.date).reverse(),
    datasets: [
      {
        label: t('points') || 'Points',
        data: games.map(game => game.points).reverse(),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
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
        borderWidth: 1
      }
    },
    scales: {
      y: {
        grid: { color: '#374151' },
        ticks: { color: '#9ca3af' }
      },
      x: {
        grid: { color: '#374151' },
        ticks: { color: '#9ca3af' }
      }
    }
  };

  const calculateStats = () => {
    if (games.length === 0) return null;
    
    const totalGames = games.length;
    const totalPoints = games.reduce((sum, game) => sum + game.points, 0);
    const avgPoints = totalPoints / totalGames;
    
    const bestGame = games.reduce((best, game) => (game.points > best.points ? game : best), games[0]);
    const worstGame = games.reduce((worst, game) => (game.points < worst.points ? game : worst), games[0]);
    
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
      title={t('playerHistory') || 'Player History'}
      size="xl"
    >
      <div className="p-6 h-[80vh] flex flex-col">
        {/* Player Selector */}
        <div className="mb-6 flex-shrink-0">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('selectPlayer') || 'Select Player'}
          </label>
          {players.length > 0 ? (
            <select
              value={selectedPlayerName}
              onChange={(e) => setSelectedPlayerName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              {players.map(player => (
                <option key={player.id} value={player.name}>
                  {player.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-500 italic">{t('noPlayersFound') || 'No players found.'}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-6 flex-shrink-0">
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
                {t('matches') || 'Matches'}
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
                {t('graph') || 'Graph'}
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
                {t('statsAndTrends') || 'Stats'}
              </div>
            </button>
          </nav>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading history...</p>
            </div>
          ) : (
            <>
              {activeTab === 'table' && (
                <div className="overflow-x-auto">
                  {games.length > 0 ? (
                    <table className="w-full text-sm text-left text-gray-400">
                      <thead className="text-xs text-gray-300 uppercase bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">{t('date') || 'Date'}</th>
                          <th className="px-4 py-3">{t('team') || 'Team'}</th>
                          <th className="px-4 py-3">{t('points') || 'Points'}</th>
                          <th className="px-4 py-3 rounded-tr-lg">{t('bonus') || 'Bonus'}</th>
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
                  ) : (
                    <div className="text-center py-8 text-gray-500">{t('noMatchesRegistered') || 'No matches recorded yet.'}</div>
                  )}
                </div>
              )}

              {activeTab === 'chart' && (
                <div className="h-[300px] md:h-[400px]">
                  {games.length >= 2 ? (
                    <Line data={chartData} options={chartOptions} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <BarChart3 size={48} className="text-gray-600 mb-4" />
                      <p className="text-gray-400">{t('needMoreMatches') || 'Need at least 2 matches to show graph.'}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'stats' && (
                <div>
                  {subscription.plan === 'free' ? (
                    <Card className="text-center p-8 border-yellow-500/30 bg-yellow-500/5">
                      <div className="text-4xl mb-4">🔒</div>
                      <h3 className="text-xl font-bold text-yellow-400 mb-2">
                        {t('premiumStats') || 'Premium Stats'}
                      </h3>
                      <p className="text-gray-300 mb-6">
                        {t('upgradeForStats') || 'Upgrade to unlock advanced statistics and trends.'}
                      </p>
                      <Button variant="primary" fullWidth>
                        {t('upgradeToPremium') || 'Upgrade to Premium'}
                      </Button>
                    </Card>
                  ) : stats ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card border={false} className="text-center p-4 bg-gray-800">
                          <p className="text-sm text-gray-400 mb-1">{t('matches') || 'Matches'}</p>
                          <p className="text-2xl font-bold text-white">{stats.totalGames}</p>
                        </Card>
                        
                        <Card border={false} className="text-center p-4 bg-gray-800">
                          <p className="text-sm text-gray-400 mb-1">{t('avgPoints') || 'Avg Pts'}</p>
                          <p className="text-2xl font-bold text-green-400">{stats.avgPoints}</p>
                        </Card>
                        
                        <Card border={false} className="text-center p-4 bg-gray-800">
                          <p className="text-sm text-gray-400 mb-1">{t('bestGame') || 'Best'}</p>
                          <p className="text-2xl font-bold text-green-400">{stats.bestGame.points}</p>
                          <p className="text-xs text-gray-500">{stats.bestGame.date}</p>
                        </Card>
                        
                        <Card border={false} className="text-center p-4 bg-gray-800">
                          <p className="text-sm text-gray-400 mb-1">{t('worstGame') || 'Worst'}</p>
                          <p className="text-2xl font-bold text-red-400">{stats.worstGame.points}</p>
                          <p className="text-xs text-gray-500">{stats.worstGame.date}</p>
                        </Card>
                      </div>

                      <Card>
                        <h4 className="text-lg font-semibold text-cyan-400 mb-4">
                          {t('pointDevelopment') || 'Points Accumulation'}
                        </h4>
                        <div className="h-64">
                          <Line 
                            data={{
                              labels: games.map(g => g.date).reverse(),
                              datasets: [{
                                label: t('cumulativePoints') || 'Total Points',
                                data: games.map(g => g.points).reverse().reduce((acc: number[], point: number) => {
                                  const last = acc.length > 0 ? acc[acc.length - 1] : 0;
                                  acc.push(last + point);
                                  return acc;
                                }, []),
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
                      <p className="text-gray-400">{t('noMatchesRegistered') || 'No data available.'}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}