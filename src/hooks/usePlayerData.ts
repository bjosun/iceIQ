import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firestore } from '../services/firebase';

interface GameRecord {
  id?: string;
  date: string;
  team: string;
  points: number;
  bonus: number;
  counts: Record<string, number>;
  softSkillCounts?: Record<string, number>;
  template: string;
}

interface Player {
  id: string;
  name: string;
  lastGameDate?: string;
  gameCount?: number;
}

export function usePlayerData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveGame = useCallback(async (
    playerName: string,
    gameData: Omit<GameRecord, 'id'>,
    template: string,
    counts: Record<string, number>,
    bonusFactor: number
  ) => {
    if (!user) {
      throw new Error('User must be logged in');
    }

    setLoading(true);
    setError(null);

    try {
      const totalPoints = Object.entries(counts).reduce((sum, [key, count]) => {
        // You'll need to get points from template actions
        // This is simplified - you'll need to adjust based on your template structure
        return sum + (count * 1); // Replace with actual point calculation
      }, 0);

      const currentBonus = totalPoints * bonusFactor;

      const gameRecord: GameRecord = {
        date: gameData.date || new Date().toISOString().split('T')[0],
        team: gameData.team.trim(),
        points: totalPoints,
        bonus: currentBonus,
        counts,
        template,
        ...(gameData.softSkillCounts && { softSkillCounts: gameData.softSkillCounts })
      };

      // Save player info
      await firestore.savePlayer(user.uid, playerName, {
        name: playerName,
        lastGameDate: gameRecord.date
      });

      // Save game record
      await firestore.saveGame(user.uid, playerName, gameRecord);

      // Update carried over bonus if negative
      if (currentBonus < 0) {
        const userData = await firestore.getUserData(user.uid);
        const carriedOverBonus = (userData?.carriedOverBonus || 0) + currentBonus;
        
        await firestore.updateUserData(user.uid, {
          carriedOverBonus
        });
      }

      return { success: true, gameRecord };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save game');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getPlayers = useCallback(async (): Promise<Player[]> => {
    if (!user) return [];

    try {
      setLoading(true);
      const players = await firestore.getPlayers(user.uid);
      
      // Get game count for each player
      const playersWithStats = await Promise.all(
        players.map(async (player: any) => {
          const games = await firestore.getGames(user.uid, player.name, 1000);
          return {
            ...player,
            gameCount: games.length
          };
        })
      );

      return playersWithStats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch players');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getPlayerHistory = useCallback(async (playerName: string, limit?: number) => {
    if (!user) return [];

    try {
      setLoading(true);
      const games = await firestore.getGames(user.uid, playerName, limit);
      return games;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch player history');
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deletePlayer = useCallback(async (playerName: string) => {
    if (!user) return;

    try {
      setLoading(true);
      await firestore.deletePlayer(user.uid, playerName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete player');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getPlayerStats = useCallback(async (playerName: string) => {
    if (!user) return null;

    try {
      const games = await getPlayerHistory(playerName, 1000);
      
      if (games.length === 0) return null;

      const totalPoints = games.reduce((sum, game) => sum + (game.points || 0), 0);
      const avgPoints = totalPoints / games.length;
      const bestGame = games.reduce((best, game) => 
        (game.points || 0) > (best.points || 0) ? game : best
      );
      const worstGame = games.reduce((worst, game) => 
        (game.points || 0) < (worst.points || 0) ? game : worst
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
        totalPoints,
        avgPoints: Number(avgPoints.toFixed(2)),
        bestGame,
        worstGame,
        recentGames: games.slice(0, 10),
        topActions: sortedActions
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate stats');
      return null;
    }
  }, [user, getPlayerHistory]);

  return {
    saveGame,
    getPlayers,
    getPlayerHistory,
    deletePlayer,
    getPlayerStats,
    loading,
    error,
    clearError: () => setError(null)
  };
}