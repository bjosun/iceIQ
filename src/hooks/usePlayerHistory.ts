import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../services/firebase';

interface GameRecord {
  id: string;
  date: string;
  team: string;
  points: number;
  bonus: number;
  counts: Record<string, number>;
  template: string;
}

interface PlayerStats {
  totalGames: number;
  avgPoints: number;
  bestGame: GameRecord;
  worstGame: GameRecord;
  totalPoints: number;
  recentGames: GameRecord[];
  topActions: Array<[string, number]>;
}

export function usePlayerHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPlayerHistory = useCallback(async (playerName: string, limit?: number): Promise<GameRecord[]> => {
    if (!user) return [];

    try {
      setLoading(true);
      const games = await firestore.getGames(user.uid, playerName, limit);
      return games as GameRecord[];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch player history');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getPlayerStats = useCallback(async (playerName: string): Promise<PlayerStats | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      const games = await getPlayerHistory(playerName, 1000);
      
      if (games.length === 0) return null;

      const totalPoints = games.reduce((sum, game) => sum + game.points, 0);
      const avgPoints = totalPoints / games.length;
      
      const bestGame = games.reduce((best, game) => 
        game.points > best.points ? game : best
      );
      
      const worstGame = games.reduce((worst, game) => 
        game.points < worst.points ? game : worst
      );

      // Calculate action frequencies
      const actionCounts: Record<string, number> = {};
      games.forEach(game => {
        Object.entries(game.counts || {}).forEach(([action, count]) => {
          actionCounts[action] = (actionCounts[action] || 0) + count;
        });
      });

      const sortedActions = Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      return {
        totalGames: games.length,
        avgPoints: Number(avgPoints.toFixed(2)),
        bestGame,
        worstGame,
        totalPoints,
        recentGames: games.slice(0, 10),
        topActions: sortedActions
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, getPlayerHistory]);

  const deleteGame = useCallback(async (playerName: string, gameId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      // TODO: Implement delete game functionality
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const exportHistory = useCallback(async (playerName: string, format: 'csv' | 'json' = 'json'): Promise<string> => {
    if (!user) return '';

    try {
      setLoading(true);
      const games = await getPlayerHistory(playerName);
      
      if (format === 'csv') {
        const headers = ['Date', 'Team', 'Points', 'Bonus'];
        const rows = games.map(game => [
          game.date,
          game.team,
          game.points.toString(),
          game.bonus.toString()
        ]);
        
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        return csv;
      } else {
        return JSON.stringify(games, null, 2);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export history');
      return '';
    } finally {
      setLoading(false);
    }
  }, [user, getPlayerHistory]);

  return {
    getPlayerHistory,
    getPlayerStats,
    deleteGame,
    exportHistory,
    loading,
    error,
    clearError: () => setError(null)
  };
}